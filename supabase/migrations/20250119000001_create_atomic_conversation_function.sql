-- Create a transactional function to create conversation with profile
-- This ensures both are created atomically, preventing race conditions

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

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.create_conversation_with_profile TO service_role;

-- Also ensure the existing trigger handles all edge cases
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
