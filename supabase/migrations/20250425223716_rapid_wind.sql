/*
  # Fix RLS policies for users table

  1. Changes
    - Update RLS policies to allow admins to manage user metadata
    - Keep existing policies for users to read their own data
    - Add policy for admins to manage all user data

  2. Security
    - Maintains existing RLS protection
    - Adds specific policies for admin operations
    - Ensures proper access control for user management
*/

-- Drop existing policies that conflict with new ones
DROP POLICY IF EXISTS "Admins can update user metadata" ON public.users;

-- Create new policy for admin operations
CREATE POLICY "Admins can manage user metadata"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users AS au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role')::text = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users AS au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role')::text = 'admin'
  )
);