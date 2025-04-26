/*
  # Add credit cards and improve transaction categorization

  1. New Tables
    - `credit_cards`
      - `id` (uuid, primary key)
      - `userid` (uuid, foreign key to auth.users)
      - `name` (text)
      - `last_four` (text)
      - `created_at` (timestamptz)

  2. Changes to existing tables
    - Add `credit_card_id` to transactions table
    - Add `learned_category` column to transactions table

  3. Security
    - Enable RLS on credit_cards table
    - Add policies for authenticated users to manage their credit cards
*/

-- Create credit cards table
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  last_four text,
  created_at timestamptz DEFAULT now()
);

-- Add credit card reference to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS credit_card_id uuid REFERENCES credit_cards(id);

-- Add learned category column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS learned_category text;

-- Enable RLS on credit_cards
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_cards
CREATE POLICY "Users can read own credit cards"
  ON credit_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own credit cards"
  ON credit_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own credit cards"
  ON credit_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own credit cards"
  ON credit_cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);

-- Create indexes
CREATE INDEX IF NOT EXISTS credit_cards_userid_idx ON credit_cards (userid);
CREATE INDEX IF NOT EXISTS transactions_credit_card_id_idx ON transactions (credit_card_id);
CREATE INDEX IF NOT EXISTS transactions_learned_category_idx ON transactions (learned_category);