/*
  # Create transaction tables

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `userId` (uuid, foreign key to auth.users)
      - `date` (date)
      - `description` (text)
      - `amount` (numeric)
      - `category` (text)
      - `createdAt` (timestamptz)

  2. Security
    - Enable RLS on `transactions` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to update their own data
    - Add policy for authenticated users to delete their own data
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userId uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  createdAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userId);

-- Create indexes for better performance
CREATE INDEX transactions_userId_idx ON transactions (userId);
CREATE INDEX transactions_date_idx ON transactions (date);
CREATE INDEX transactions_category_idx ON transactions (category);