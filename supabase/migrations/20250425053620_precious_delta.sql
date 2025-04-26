/*
  # Add system categories table

  1. Changes
    - Add system categories to system_settings table
    - Insert default categories
*/

-- Insert default system categories
INSERT INTO system_settings (key, value)
VALUES (
  'system_categories',
  '[
    {"id": "groceries", "name": "Groceries", "color": "#10B981", "is_default": true},
    {"id": "dining", "name": "Dining Out", "color": "#F59E0B", "is_default": true},
    {"id": "entertainment", "name": "Entertainment", "color": "#8B5CF6", "is_default": true},
    {"id": "transportation", "name": "Transportation", "color": "#3B82F6", "is_default": true},
    {"id": "shopping", "name": "Shopping", "color": "#EC4899", "is_default": true},
    {"id": "travel", "name": "Travel", "color": "#06B6D4", "is_default": true},
    {"id": "housing", "name": "Housing", "color": "#6366F1", "is_default": true},
    {"id": "utilities", "name": "Utilities", "color": "#D97706", "is_default": true},
    {"id": "healthcare", "name": "Healthcare", "color": "#EF4444", "is_default": true},
    {"id": "education", "name": "Education", "color": "#0EA5E9", "is_default": true},
    {"id": "gifts", "name": "Gifts", "color": "#F472B6", "is_default": true},
    {"id": "services", "name": "Services", "color": "#71717A", "is_default": true},
    {"id": "subscriptions", "name": "Subscriptions", "color": "#9333EA", "is_default": true},
    {"id": "other", "name": "Other", "color": "#9CA3AF", "is_default": true}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;