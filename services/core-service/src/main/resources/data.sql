-- Seed base categories for SnapExpense
-- These names must match the CATEGORIES list in the frontend's mockData.ts
-- ON CONFLICT ensures this is idempotent with create-drop or update DDL modes
INSERT INTO categories (name, icon, color) VALUES
  ('Food & Dining',    '🍔', '#7C3AED'),
  ('Transport',        '🚗', '#F97316'),
  ('Shopping',         '🛍️', '#3B82F6'),
  ('Bills & Utilities','💡', '#10B981'),
  ('Healthcare',       '🏥', '#EF4444'),
  ('Entertainment',    '🎬', '#F59E0B'),
  ('Groceries',        '🛒', '#6366F1'),
  ('Education',        '📚', '#8B5CF6'),
  ('Travel',           '✈️', '#0EA5E9'),
  ('Others',           '📦', '#94A3B8')
ON CONFLICT (name) DO NOTHING;