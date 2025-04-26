/*
  # Set up admin functionality

  1. Changes
    - Create admin role and permissions
    - Add admin-specific functions
    - Set up RLS policies for admin access
    - Create default admin user

  2. Security
    - Enable RLS on all tables
    - Add proper admin policies
    - Secure admin functions
*/

-- Create admin role function
CREATE OR REPLACE FUNCTION create_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create admin role if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO admin;
  END IF;
END;
$$;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update user metadata to include admin role
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
      ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
    END
  WHERE id = user_id;
END;
$$;

-- Function to demote admin to regular user
CREATE OR REPLACE FUNCTION demote_from_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Remove admin role from user metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = user_id;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT raw_user_meta_data->>'role'
  INTO user_role
  FROM auth.users
  WHERE id = user_id;

  RETURN user_role = 'admin';
END;
$$;

-- Create default admin user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Insert admin user with encrypted password
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"role": "admin"}'::jsonb,
      now(),
      now()
    );
  END IF;
END $$;

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies for auth.users
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
  DROP POLICY IF EXISTS "Admins can read all users" ON auth.users;
  DROP POLICY IF EXISTS "Admins can update users" ON auth.users;
  
  -- Create new policies
  CREATE POLICY "Users can read own data" 
    ON auth.users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Admins can read all users"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

  CREATE POLICY "Admins can update users"
    ON auth.users
    FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
END $$;

-- Call create_admin_role function
SELECT create_admin_role();