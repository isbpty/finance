/*
  # Add smart categorization features

  1. Changes
    - Add learned_patterns table for smart categorization
    - Add function to suggest categories based on patterns
*/

-- Create learned_patterns table
CREATE TABLE IF NOT EXISTS learned_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  pattern text NOT NULL,
  category text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(userid, pattern)
);

-- Enable RLS
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own patterns"
  ON learned_patterns
  FOR ALL
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

-- Create function to suggest category
CREATE OR REPLACE FUNCTION suggest_category(description text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suggested_category text;
BEGIN
  -- First try exact match
  SELECT category INTO suggested_category
  FROM learned_patterns
  WHERE userid = user_id
  AND pattern = description
  ORDER BY confidence DESC
  LIMIT 1;

  -- If no exact match, try pattern matching
  IF suggested_category IS NULL THEN
    SELECT category INTO suggested_category
    FROM learned_patterns
    WHERE userid = user_id
    AND description ILIKE '%' || pattern || '%'
    ORDER BY confidence DESC
    LIMIT 1;
  END IF;

  -- If still no match, use default categorization
  IF suggested_category IS NULL THEN
    SELECT category INTO suggested_category
    FROM transactions
    WHERE userid = user_id
    AND description ILIKE '%' || description || '%'
    GROUP BY category
    ORDER BY count(*) DESC
    LIMIT 1;
  END IF;

  RETURN COALESCE(suggested_category, 'other');
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS learned_patterns_userid_idx ON learned_patterns(userid);
CREATE INDEX IF NOT EXISTS learned_patterns_pattern_idx ON learned_patterns(pattern);