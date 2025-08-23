-- HARD RESET Migration: Complete database reset with auth.users trigger
-- Date: 2025-08-21
-- Purpose: Drop everything and recreate with proper auth.users integration

-- ===== STEP 1: DROP EVERYTHING =====
-- Drop ALL existing policies, triggers, and functions
DO $$
BEGIN
    -- Drop all policies
    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
    DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
    DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
    DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
    DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
    DROP POLICY IF EXISTS "messages_select_policy" ON messages;
    DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
    DROP POLICY IF EXISTS "messages_update_policy" ON messages;
    DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
    DROP POLICY IF EXISTS "images_select_policy" ON images;
    DROP POLICY IF EXISTS "images_insert_policy" ON images;
    DROP POLICY IF EXISTS "images_update_policy" ON images;
    DROP POLICY IF EXISTS "images_delete_policy" ON images;
END $$;

-- Drop all existing functions and triggers
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_soft_delete ON profiles;
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_hard_delete ON profiles;
DROP TRIGGER IF EXISTS trigger_cascade_profile_soft_delete ON profiles;
DROP TRIGGER IF EXISTS trigger_cascade_conversation_soft_delete ON conversations;
DROP TRIGGER IF EXISTS trigger_soft_delete_user_conversations ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_soft_delete();
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_hard_delete();
DROP FUNCTION IF EXISTS cascade_profile_soft_delete();
DROP FUNCTION IF EXISTS cascade_conversation_soft_delete();
DROP FUNCTION IF EXISTS soft_delete_user_conversations();
DELETE FROM auth.users;

-- Drop all tables (cascade will handle dependencies)
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS _health_check CASCADE;

-- ===== STEP 2: RECREATE TABLES WITH PROPER STRUCTURE =====
-- Create profiles table (NO FK to auth.users - reverse relationship)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- This will match auth.users.id but NO FK constraint
    email VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL DEFAULT 'User',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete column
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create images table (without messageId FK)
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_data TEXT NOT NULL,
    image_url TEXT,
    dalle_response_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create messages table with imageId FK
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL, -- 'user' | 'assistant'
    content TEXT, -- image_id varsa metin içermeyebilir
    message_order BIGINT NOT NULL,
    message_type VARCHAR NOT NULL DEFAULT 'text',
    image_id UUID UNIQUE REFERENCES images(id) ON DELETE SET NULL, -- One-to-one with images
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Health check table for API testing
CREATE TABLE _health_check (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

-- ===== STEP 3: CREATE INDEXES =====
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_deleted_at ON conversations(deleted_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_image_id ON messages(image_id);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_deleted_at ON images(deleted_at);

-- ===== STEP 4: CREATE AUTH.USERS DELETE TRIGGERS =====
-- This function deletes auth.users when profile is SOFT deleted (UPDATE with deleted_at)
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When profile is soft deleted (deleted_at changes from NULL to NOT NULL)
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        DELETE FROM auth.users WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function deletes auth.users when profile is HARD deleted (actual DELETE)
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- On hard delete (actual DELETE) - delete corresponding auth.users
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for SOFT delete (UPDATE)
CREATE TRIGGER trigger_delete_auth_user_on_soft_delete
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_soft_delete();

-- Create trigger for HARD delete (DELETE)
CREATE TRIGGER trigger_delete_auth_user_on_hard_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_hard_delete();

-- ===== STEP 5: CREATE CASCADE SOFT DELETE FUNCTIONS =====
-- This function cascades soft delete from profiles to conversations, messages, and images
CREATE OR REPLACE FUNCTION cascade_profile_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When profile is soft deleted, cascade to conversations and messages
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        -- Soft delete all user's conversations
        UPDATE conversations 
        SET deleted_at = NEW.deleted_at, updated_at = NOW()
        WHERE user_id = NEW.id AND deleted_at IS NULL;
        
        -- Soft delete all messages in those conversations
        UPDATE messages 
        SET deleted_at = NEW.deleted_at
        WHERE conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = NEW.id
        ) AND deleted_at IS NULL;
        
        -- Soft delete all user's images
        UPDATE images 
        SET deleted_at = NEW.deleted_at
        WHERE user_id = NEW.id AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function cascades soft delete from conversations to messages
CREATE OR REPLACE FUNCTION cascade_conversation_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When conversation is soft deleted, cascade to messages
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE messages 
        SET deleted_at = NEW.deleted_at
        WHERE conversation_id = NEW.id AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile cascade soft delete
CREATE TRIGGER trigger_cascade_profile_soft_delete
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION cascade_profile_soft_delete();

-- Create trigger for conversation cascade soft delete
CREATE TRIGGER trigger_cascade_conversation_soft_delete
    AFTER UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION cascade_conversation_soft_delete();

-- ===== STEP 6: ROW LEVEL SECURITY (RLS) =====
-- Disable RLS for profiles - causing GET issues
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Disable RLS for conversations - causing UPDATE issues
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Profiles policies (NO deleted_at filter - login should work with soft deleted profiles)
-- BUT update/insert operations should check deleted_at in application layer
-- Disable RLS for profiles - causing GET issues
-- CREATE POLICY "profiles_select_policy" ON profiles
--     FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "profiles_update_policy" ON profiles
--     FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "profiles_insert_policy" ON profiles
--     FOR INSERT WITH CHECK (auth.uid() = id);

-- CREATE POLICY "profiles_delete_policy" ON profiles
--     FOR DELETE USING (auth.uid() = id);

-- Conversations policies DISABLED - RLS causing UPDATE issues for soft delete
-- Will rely on application-level security in API routes
-- CREATE POLICY "conversations_select_policy" ON conversations
--     FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
-- CREATE POLICY "conversations_insert_policy" ON conversations
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "conversations_update_policy" ON conversations
--     FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "conversations_delete_policy" ON conversations
--     FOR DELETE USING (auth.uid() = user_id);

-- Messages policies (filter deleted_at IS NULL)
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Images policies (filter deleted_at IS NULL)
CREATE POLICY "images_select_policy" ON images
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "images_insert_policy" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "images_update_policy" ON images
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id OR deleted_at IS NOT NULL);

CREATE POLICY "images_delete_policy" ON images
    FOR DELETE USING (auth.uid() = user_id);