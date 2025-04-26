/*
  # Add budget management features

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `userid` (uuid, foreign key to auth.users)
      - `category` (text)
      - `amount` (numeric)
      - `period` (text)
      - `start_date` (date)
      - `created_at` (timestamptz)

    - `shared_finances`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to auth.users)
      - `shared_with` (uuid, foreign key to auth.users)
      - `permissions` (text)
      - `created_at` (timestamptz)

    - `receipts`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key to transactions)
      - `image_url` (text)
      - `ocr_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create shared_finances table
CREATE TABLE IF NOT EXISTS shared_finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  shared_with uuid NOT NULL REFERENCES auth.users(id),
  permissions text NOT NULL CHECK (permissions IN ('view', 'edit')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, shared_with)
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  image_url text NOT NULL,
  ocr_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Users can manage own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

-- Create policies for shared_finances
CREATE POLICY "Users can manage own shared finances"
  ON shared_finances
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view shared finances"
  ON shared_finances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with);

-- Create policies for receipts
CREATE POLICY "Users can manage own receipts"
  ON receipts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = receipts.transaction_id
      AND t.userid = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = receipts.transaction_id
      AND t.userid = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS budgets_userid_idx ON budgets(userid);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON budgets(category);
CREATE INDEX IF NOT EXISTS shared_finances_owner_id_idx ON shared_finances(owner_id);
CREATE INDEX IF NOT EXISTS shared_finances_shared_with_idx ON shared_finances(shared_with);
CREATE INDEX IF NOT EXISTS receipts_transaction_id_idx ON receipts(transaction_id);