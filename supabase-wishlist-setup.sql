-- Supabase Wishlist Table Setup
-- Run this SQL in your Supabase SQL Editor

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'guest',
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one product per user (prevent duplicates)
  UNIQUE(user_id, product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own wishlist items
CREATE POLICY "Users can view their own wishlist"
  ON wishlist FOR SELECT
  USING (user_id = current_setting('app.user_id', true) OR user_id = 'guest');

-- Policy: Users can insert their own wishlist items
CREATE POLICY "Users can insert their own wishlist items"
  ON wishlist FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true) OR user_id = 'guest');

-- Policy: Users can delete their own wishlist items
CREATE POLICY "Users can delete their own wishlist items"
  ON wishlist FOR DELETE
  USING (user_id = current_setting('app.user_id', true) OR user_id = 'guest');

-- Note: For now, we're using 'guest' as the default user_id
-- When you implement authentication, replace 'guest' with the actual user ID

