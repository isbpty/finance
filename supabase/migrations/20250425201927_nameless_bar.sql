/*
  # Add payment method to transactions

  1. Changes
    - Add payment_method column to transactions table
    - Set default value to 'unknown'
    - Add check constraint for valid values

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'unknown' CHECK (payment_method IN ('cash', 'credit_card', 'unknown'));