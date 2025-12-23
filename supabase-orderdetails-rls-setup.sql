-- Supabase OrderDetails Table RLS Setup
-- Run this SQL in your Supabase SQL Editor to enable RLS for orderDetails table

-- Enable Row Level Security (RLS) on orderDetails table
ALTER TABLE orderDetails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orderDetails" ON orderDetails;
DROP POLICY IF EXISTS "Users can insert their own orderDetails" ON orderDetails;
DROP POLICY IF EXISTS "Users can update their own orderDetails" ON orderDetails;
DROP POLICY IF EXISTS "Admins can view all orderDetails" ON orderDetails;

-- Policy: Users can view their own orderDetails
CREATE POLICY "Users can view their own orderDetails"
  ON orderDetails FOR SELECT
  USING (auth.uid() = fk_id_user);

-- Policy: Users can insert their own orderDetails
CREATE POLICY "Users can insert their own orderDetails"
  ON orderDetails FOR INSERT
  WITH CHECK (auth.uid() = fk_id_user);

-- Policy: Users can update their own orderDetails
CREATE POLICY "Users can update their own orderDetails"
  ON orderDetails FOR UPDATE
  USING (auth.uid() = fk_id_user)
  WITH CHECK (auth.uid() = fk_id_user);

-- Policy: Admins can view all orderDetails
CREATE POLICY "Admins can view all orderDetails"
  ON orderDetails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON orderDetails TO authenticated;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orderDetails_user_id ON orderDetails(fk_id_user);
CREATE INDEX IF NOT EXISTS idx_orderDetails_status ON orderDetails(order_status);
CREATE INDEX IF NOT EXISTS idx_orderDetails_created_at ON orderDetails(created_at);

