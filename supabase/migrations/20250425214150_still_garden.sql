/*
  # Fix system settings table and policies

  1. Changes
    - Drop existing policies before recreating them
    - Ensure table exists with proper structure
    - Set up proper RLS policies for admin access
*/

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read settings" ON system_settings;
DROP POLICY IF EXISTS "Only admins can modify settings" ON system_settings;

-- Create policies
CREATE POLICY "Authenticated users can read settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify settings"
  ON system_settings
  FOR ALL
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

-- Insert default settings if they don't exist
INSERT INTO system_settings (key, value)
VALUES (
  'system_config',
  '{
    "email_config": {
      "smtp_host": "",
      "smtp_port": 587,
      "smtp_user": "",
      "smtp_pass": "",
      "from_email": "",
      "from_name": ""
    },
    "ocr_config": {
      "api_key": "",
      "language": "eng",
      "confidence_threshold": 80,
      "max_file_size": 5242880
    },
    "receipt_storage": {
      "provider": "local",
      "max_file_size": 5242880,
      "allowed_types": ["image/jpeg", "image/png", "image/webp"]
    }
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;