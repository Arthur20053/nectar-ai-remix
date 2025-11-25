-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add is_recurring column to transactions table
ALTER TABLE transactions 
ADD COLUMN is_recurring boolean DEFAULT false NOT NULL;

-- Add some default business categories if they don't exist
INSERT INTO categories (name, type, color, icon, user_id) 
VALUES 
  ('Marketing', 'despesa', '#ef4444', 'megaphone', NULL),
  ('Operacional', 'despesa', '#f59e0b', 'settings', NULL),
  ('Salário', 'despesa', '#8b5cf6', 'users', NULL),
  ('Pessoal', 'despesa', '#06b6d4', 'user', NULL),
  ('Vendas', 'receita', '#10b981', 'shopping-cart', NULL),
  ('Serviços', 'receita', '#3b82f6', 'briefcase', NULL)
ON CONFLICT DO NOTHING;