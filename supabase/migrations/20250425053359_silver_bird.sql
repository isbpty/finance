/*
  # Add system settings table

  1. New Tables
    - `system_settings`
      - `key` (text, primary key)
      - `value` (jsonb)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on system_settings table
    - Add policies for authenticated users to manage settings
*/

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default header mappings
INSERT INTO system_settings (key, value)
VALUES (
  'header_mappings',
  '[
    {"id": "1", "excelHeader": "fecha", "systemField": "date", "isRequired": true},
    {"id": "2", "excelHeader": "description", "systemField": "description", "isRequired": true},
    {"id": "3", "excelHeader": "amount", "systemField": "amount", "isRequired": true},
    {"id": "4", "excelHeader": "category", "systemField": "category", "isRequired": false}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;