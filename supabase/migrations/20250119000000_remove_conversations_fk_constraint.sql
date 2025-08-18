-- Remove FK constraint completely to solve race condition
-- This allows conversations to be created without waiting for profile

-- Drop any existing FK constraints on conversations.user_id
ALTER TABLE public.conversations 
  DROP CONSTRAINT IF EXISTS conversations_user_fk CASCADE;

ALTER TABLE public.conversations 
  DROP CONSTRAINT IF EXISTS conversations_user_id_fkey CASCADE;

-- Ensure index still exists for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- Update RLS policies to not depend on profiles table
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- Create new RLS policies that check auth.uid() directly
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Keep the profile trigger for convenience, but it's no longer blocking
-- The trigger will still create profiles, but conversations don't wait for it
