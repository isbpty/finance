/*
  # Add admin user policies

  1. Changes
    - Add policy to allow admin users to read all user data
    - Add policy to allow admin users to update user metadata
    - Add policy to allow admin users to delete users

  2. Security
    - Policies are restricted to users with 'admin' role in their metadata
    - Regular users can still only access their own data
    - Check if policies exist before creating them
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
  DROP POLICY IF EXISTS "Admins can update user metadata" ON public.users;
  DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

  -- Create new policies
  CREATE POLICY "Admins can read all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
      (SELECT (raw_user_meta_data->>'role')::text = 'admin' 
       FROM auth.users 
       WHERE id = auth.uid())
    );

  CREATE POLICY "Admins can update user metadata"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
      (SELECT (raw_user_meta_data->>'role')::text = 'admin' 
       FROM auth.users 
       WHERE id = auth.uid())
    )
    WITH CHECK (
      (SELECT (raw_user_meta_data->>'role')::text = 'admin' 
       FROM auth.users 
       WHERE id = auth.uid())
    );

  CREATE POLICY "Admins can delete users"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
      (SELECT (raw_user_meta_data->>'role')::text = 'admin' 
       FROM auth.users 
       WHERE id = auth.uid())
    );
END $$;