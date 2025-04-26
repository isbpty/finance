/*
  # Add admin user

  1. Changes
    - Create admin user with email test@test.com
    - Set password to eysh12
    - Add admin role to user
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users if the email doesn't exist
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
      crypt('eysh12', gen_salt('bf')),
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
    )
    RETURNING id INTO new_user_id;

    -- Set admin role
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
    WHERE id = new_user_id;
  END IF;
END $$;