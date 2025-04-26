/*
  # Improve category handling and filtering

  1. Changes
    - Add merchant column to transactions table for better filtering
    - Add indexes for improved query performance
*/

-- Add merchant column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'merchant'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN merchant text GENERATED ALWAYS AS (
      CASE 
        WHEN position(' - ' in description) > 0 
        THEN split_part(description, ' - ', 1)
        ELSE description
      END
    ) STORED;
  END IF;
END $$;

-- Create index on merchant column
CREATE INDEX IF NOT EXISTS transactions_merchant_idx ON transactions (merchant);

-- Create function to update learned categories
CREATE OR REPLACE FUNCTION update_similar_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update similar transactions with the same merchant
  IF NEW.learned_category IS NOT NULL THEN
    UPDATE transactions
    SET learned_category = NEW.learned_category
    WHERE userid = NEW.userid
    AND merchant = NEW.merchant
    AND id != NEW.id
    AND (learned_category IS NULL OR learned_category != NEW.learned_category);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic category learning
DROP TRIGGER IF EXISTS update_similar_transactions_trigger ON transactions;
CREATE TRIGGER update_similar_transactions_trigger
AFTER UPDATE OF learned_category ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_similar_transactions();