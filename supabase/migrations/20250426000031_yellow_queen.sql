/*
  # Add email settings table

  1. Changes
    - Add mail_config to system_settings table
    - Add default SMTP configuration
*/

-- Insert default mail configuration if it doesn't exist
INSERT INTO system_settings (key, value)
VALUES (
  'mail_config',
  '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_pass": "",
    "from_email": "",
    "from_name": "",
    "encryption": "tls"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;