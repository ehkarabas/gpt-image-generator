-- MANUAL MIGRATION SCRIPT FOR SUPABASE DASHBOARD
-- Run this in Supabase Dashboard > SQL Editor
-- This combines all necessary fixes for the race condition issue

-- =========================================
-- STEP 1: Fix the profile creation trigger
-- =========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Always try to create profile, ignore if exists
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      SPLIT_PART(new.email, '@', 1),
      'User'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Never fail auth transaction
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- STEP 2: Backfill any missing profiles
-- =========================================

INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1),
    'User'
  ),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- STEP 3: Create atomic conversation function
-- =========================================

CREATE OR REPLACE FUNCTION public.create_conversation_with_profile(
  p_user_id UUID,
  p_email TEXT,
  p_title TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_result JSON;
BEGIN
  -- First ensure profile exists (upsert)
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    created_at, 
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_display_name, SPLIT_PART(p_email, '@', 1), 'User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();
  
  -- Then create conversation
  INSERT INTO public.conversations (
    id,
    title,
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    p_title,
    p_user_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_conversation_id;
  
  -- Return the created conversation as JSON
  SELECT row_to_json(c.*) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conversation_id;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE WARNING 'create_conversation_with_profile error: %', SQLERRM;
    RAISE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_conversation_with_profile TO service_role;
GRANT EXECUTE ON FUNCTION public.create_conversation_with_profile TO authenticated;

-- =========================================
-- STEP 4: Add indexes for performance
-- =========================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- =========================================
-- STEP 5: Verify everything is set up
-- =========================================

-- Check trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Check function exists
SELECT 
  proname as function_name,
  pronargs as arg_count
FROM pg_proc
WHERE proname IN ('handle_new_user', 'create_conversation_with_profile');

-- Check profiles count matches auth users
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count;

-- =========================================
-- IMPORTANT NOTES:
-- =========================================
-- After running this script:
-- 1. Go to Settings > API and click "Restart Project" 
-- 2. This will clear PostgREST cache and apply changes
-- 3. Then run the E2E test: npm run test:e2e:remote
