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
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = user_id;
END;
$$;

-- Create default admin user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Insert admin user
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