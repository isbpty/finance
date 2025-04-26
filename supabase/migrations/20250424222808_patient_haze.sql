/*
  # Fix Transactions RLS Policies

  1. Changes
    - Drop and recreate the SELECT policy for transactions table to ensure proper implementation
    - Verify RLS is enabled
    - Use auth.uid() function consistently

  2. Security
    - Maintains row-level security
    - Ensures authenticated users can only access their own transactions
*/

-- First verify RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;

-- Recreate SELECT policy with explicit authentication check
CREATE POLICY "Users can read own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = userid
);