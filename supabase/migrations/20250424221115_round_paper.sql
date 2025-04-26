/*
  # Fix RLS policies for transactions table

  1. Changes
    - Drop existing policies
    - Recreate policies with proper auth checks
    - Add proper indexes for performance

  2. Security
    - Ensure proper RLS policies for all CRUD operations
    - Use auth.uid() for user verification
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recreate policies with proper auth checks
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

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS transactions_userid_idx ON transactions (userid);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions (category);
CREATE INDEX IF NOT EXISTS transactions_learned_category_idx ON transactions (learned_category);
CREATE INDEX IF NOT EXISTS transactions_credit_card_id_idx ON transactions (credit_card_id);