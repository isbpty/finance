/*
  # Fix Authentication Schema

  1. Changes
    - Ensure auth schema exists
    - Grant necessary permissions to authenticated and anon roles
    - Set up proper RLS policies for auth-related operations

  2. Security
    - Grant minimal required permissions to roles
    - Enable RLS where needed
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Grant access to auth.users for authenticated users
GRANT SELECT ON auth.users TO authenticated;

-- Ensure proper RLS is enabled on auth-related tables
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for auth.users
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
  
  -- Create new policy
  CREATE POLICY "Users can read own data" 
    ON auth.users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);
END $$;