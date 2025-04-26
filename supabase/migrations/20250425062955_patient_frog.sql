/*
  # Create users table and fix authentication

  1. New Tables
    - `users` table to mirror auth.users data
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `raw_user_meta_data` (jsonb)
      - `created_at` (timestamptz)
      - `last_sign_in_at` (timestamptz)

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users to read their own data
    - Add policy for admins to read all users
    
  3. Data Migration
    - Copy existing user data from auth.users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_sign_in_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' = 'admin' 
     FROM auth.users 
     WHERE id = auth.uid())
  );

-- Copy existing user data
INSERT INTO users (id, email, raw_user_meta_data, created_at, last_sign_in_at)
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  created_at = EXCLUDED.created_at,
  last_sign_in_at = EXCLUDED.last_sign_in_at;

-- Create function to sync user data
CREATE OR REPLACE FUNCTION sync_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, raw_user_meta_data, created_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data,
    NEW.created_at,
    NEW.last_sign_in_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    created_at = EXCLUDED.created_at,
    last_sign_in_at = EXCLUDED.last_sign_in_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep users table in sync
DROP TRIGGER IF EXISTS sync_users ON auth.users;
CREATE TRIGGER sync_users
  AFTER INSERT OR UPDATE
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_users();