/*
  # Fix RLS policies and improve category handling

  1. Security
    - Drop and recreate RLS policies with proper auth checks
    - Ensure RLS is enabled on all tables
    - Add explicit authentication checks

  2. Changes
    - Recreate policies with proper auth checks
    - Add indexes for better performance
*/

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recreate policies with explicit auth checks
CREATE POLICY "Users can read own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = userid
);

CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = userid
);

CREATE POLICY "Users can update own transactions"
ON transactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = userid
)
WITH CHECK (
  auth.uid() = userid
);

CREATE POLICY "Users can delete own transactions"
ON transactions
FOR DELETE
TO authenticated
USING (
  auth.uid() = userid
);

-- Ensure indexes exist for better performance
CREATE INDEX IF NOT EXISTS transactions_userid_idx ON transactions (userid);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions (category);
CREATE INDEX IF NOT EXISTS transactions_learned_category_idx ON transactions (learned_category);
CREATE INDEX IF NOT EXISTS transactions_credit_card_id_idx ON transactions (credit_card_id);