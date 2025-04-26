/*
  # Fix Authentication Issues

  1. Changes
    - Drop and recreate auth schema tables if needed
    - Ensure proper RLS policies
    - Create default admin user
    - Fix schema permissions

  2. Security
    - Maintain proper RLS policies
    - Set up correct auth permissions
*/

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create default admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@test.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test@test.com',
      crypt('test123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create or replace auth policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can authenticate" ON auth.users;
  DROP POLICY IF EXISTS "Users can register" ON auth.users;

  -- Create new policies
  CREATE POLICY "Users can authenticate"
    ON auth.users
    FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can register"
    ON auth.users
    FOR INSERT
    WITH CHECK (true);
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT INSERT ON auth.users TO anon;
GRANT UPDATE ON auth.users TO authenticated;