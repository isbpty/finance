/*
  # Fix user registration

  1. Security
    - Enable RLS on auth.users table
    - Add policy for user registration
    - Add policy for user authentication
*/

-- Enable RLS on auth.users table if not already enabled
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Add policy for user registration
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users' 
    AND policyname = 'Users can register'
  ) THEN
    CREATE POLICY "Users can register" ON auth.users
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Add policy for user authentication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users' 
    AND policyname = 'Users can authenticate'
  ) THEN
    CREATE POLICY "Users can authenticate" ON auth.users
    FOR SELECT
    USING (auth.uid() = id);
  END IF;
END $$;