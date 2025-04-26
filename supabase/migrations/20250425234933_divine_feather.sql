/*
  # Add function to safely clear transactions

  1. New Functions
    - `clear_user_transactions`: Safely clears all transactions and associated receipts for a user
  
  2. Changes
    - Creates a function that handles deletion of transactions and receipts in the correct order
    - Ensures referential integrity is maintained
    - Wraps deletions in a transaction for atomicity
*/

CREATE OR REPLACE FUNCTION clear_user_transactions(p_userid UUID)
RETURNS void AS $$
BEGIN
  -- First delete all receipts for the user's transactions
  DELETE FROM receipts
  WHERE transaction_id IN (
    SELECT id FROM transactions WHERE userid = p_userid
  );
  
  -- Then delete all transactions for the user
  DELETE FROM transactions
  WHERE userid = p_userid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;