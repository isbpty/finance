/*
  # Add recurring flag to transactions

  1. Changes
    - Add is_recurring boolean column to transactions table
    - Set default value to false
    - Make column nullable
*/

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;