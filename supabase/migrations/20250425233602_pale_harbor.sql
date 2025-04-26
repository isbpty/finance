/*
  # Fix receipts table schema

  1. Changes
    - Add userid column to receipts table
    - Update RLS policies to use userid instead of transaction lookup
    - Add proper indexes for performance

  2. Security
    - Maintain RLS protection
    - Update policies to use direct userid check
*/

-- Add userid column to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS userid uuid NOT NULL REFERENCES auth.users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own receipts" ON receipts;

-- Create new policy using userid
CREATE POLICY "Users can manage own receipts"
ON receipts
FOR ALL
TO authenticated
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);

-- Create index for userid
CREATE INDEX IF NOT EXISTS receipts_userid_idx ON receipts(userid);