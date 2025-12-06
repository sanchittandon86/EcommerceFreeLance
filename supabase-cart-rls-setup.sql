-- Supabase Cart Table RLS Policies Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own cart" ON cart;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart;

-- Policy: Users can view their own cart items
CREATE POLICY "Users can view their own cart"
  ON cart FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own cart items
CREATE POLICY "Users can insert their own cart items"
  ON cart FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cart items
CREATE POLICY "Users can update their own cart items"
  ON cart FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cart items
CREATE POLICY "Users can delete their own cart items"
  ON cart FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cart TO authenticated;

-- Optional: Add unique constraint for efficient upsert operations
-- This prevents duplicate cart items and allows upsert to work properly
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cart_user_product_unique'
    ) THEN
        ALTER TABLE cart 
        ADD CONSTRAINT cart_user_product_unique 
        UNIQUE (user_id, product_id);
    END IF;
END $$;

