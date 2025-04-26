/*
  # Update receipts table transaction_id constraint

  1. Changes
    - Remove NOT NULL constraint from transaction_id column in receipts table
    - This allows receipts to be uploaded without an associated transaction

  2. Reasoning
    - Users should be able to upload receipts before linking them to transactions
    - This enables a more flexible workflow where receipts can be processed first and linked to transactions later
*/

ALTER TABLE receipts 
ALTER COLUMN transaction_id DROP NOT NULL;