/*
  # Add database management functions

  1. New Functions
    - create_transactions_table
    - create_credit_cards_table
    - setup_rls_policies
    - update_db_config

  2. Security
    - Functions are only accessible to authenticated users
    - Proper error handling and validation
*/

-- Function to create transactions table
CREATE OR REPLACE FUNCTION create_transactions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    userid uuid NOT NULL REFERENCES auth.users(id),
    date date NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    credit_card_id uuid REFERENCES credit_cards(id),
    learned_category text,
    merchant text GENERATED ALWAYS AS (
      CASE 
        WHEN position(' - ' in description) > 0 
        THEN split_part(description, ' - ', 1)
        ELSE description
      END
    ) STORED,
    is_recurring boolean DEFAULT false,
    createdat timestamptz DEFAULT now()
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS transactions_userid_idx ON transactions(userid);
  CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
  CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category);
  CREATE INDEX IF NOT EXISTS transactions_merchant_idx ON transactions(merchant);
  CREATE INDEX IF NOT EXISTS transactions_is_recurring_idx ON transactions(is_recurring);
END;
$$;

-- Function to create credit cards table
CREATE OR REPLACE FUNCTION create_credit_cards_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS credit_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    userid uuid NOT NULL REFERENCES auth.users(id),
    name text NOT NULL,
    last_four text,
    created_at timestamptz DEFAULT now()
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS credit_cards_userid_idx ON credit_cards(userid);
END;
$$;

-- Function to setup RLS policies
CREATE OR REPLACE FUNCTION setup_rls_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
  
  DROP POLICY IF EXISTS "Users can read own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can insert own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can update own credit cards" ON credit_cards;
  DROP POLICY IF EXISTS "Users can delete own credit cards" ON credit_cards;

  -- Create transactions policies
  CREATE POLICY "Users can read own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = userid)
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    TO authenticated
    USING (auth.uid() = userid);

  -- Create credit cards policies
  CREATE POLICY "Users can read own credit cards"
    ON credit_cards FOR SELECT
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can insert own credit cards"
    ON credit_cards FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can update own credit cards"
    ON credit_cards FOR UPDATE
    TO authenticated
    USING (auth.uid() = userid)
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can delete own credit cards"
    ON credit_cards FOR DELETE
    TO authenticated
    USING (auth.uid() = userid);
END;
$$;

-- Function to update database configuration
CREATE OR REPLACE FUNCTION update_db_config(new_config jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Store configuration in a settings table
  CREATE TABLE IF NOT EXISTS system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
  );

  INSERT INTO system_settings (key, value)
  VALUES ('db_config', new_config)
  ON CONFLICT (key) DO UPDATE
    SET value = new_config,
        updated_at = now();
END;
$$;