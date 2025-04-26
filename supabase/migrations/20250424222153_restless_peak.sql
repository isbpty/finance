/*
  # Update schema with credit cards and learned categories

  1. New Tables
    - `credit_cards`
      - `id` (uuid, primary key)
      - `userid` (uuid, foreign key to auth.users)
      - `name` (text)
      - `last_four` (text)
      - `created_at` (timestamptz)

  2. Changes to existing tables
    - Add `credit_card_id` to transactions table
    - Add `learned_category` to transactions table

  3. Security
    - Enable RLS on credit_cards table
    - Add policies for credit_cards table
*/

-- Create credit cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  last_four text,
  created_at timestamptz DEFAULT now()
);

-- Add credit card reference to transactions
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'credit_card_id'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN credit_card_id uuid REFERENCES credit_cards(id);
  END IF;
END $$;

-- Add learned category column to transactions
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'learned_category'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN learned_category text;
  END IF;
END $$;

-- Enable RLS on credit_cards
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can insert own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can update own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can delete own credit cards" ON credit_cards;
END $$;

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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS credit_cards_userid_idx ON credit_cards (userid);
CREATE INDEX IF NOT EXISTS transactions_credit_card_id_idx ON transactions (credit_card_id);
CREATE INDEX IF NOT EXISTS transactions_learned_category_idx ON transactions (learned_category);

-- Drop existing policies if they exist for transactions
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
END $$;

-- Recreate policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);