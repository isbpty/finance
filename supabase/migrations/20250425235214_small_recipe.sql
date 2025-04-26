CREATE OR REPLACE FUNCTION clear_user_transactions(p_userid UUID)
RETURNS void AS $$
BEGIN
  -- Set transaction_id to NULL in receipts table
  UPDATE receipts
  SET transaction_id = NULL
  WHERE transaction_id IN (
    SELECT id FROM transactions WHERE userid = p_userid
  );
  
  -- Delete all transactions for the user
  DELETE FROM transactions
  WHERE userid = p_userid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;