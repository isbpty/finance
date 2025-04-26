/*
  # Add recurring transaction support

  1. Changes
    - Add `is_recurring` column to `transactions` table with default value of false
    - Add index on `is_recurring` column for better query performance

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS transactions_is_recurring_idx 
    ON transactions(is_recurring);
  END IF;
END $$;