-- Admin OrderDetails RLS Policies
-- Run this SQL in your Supabase SQL Editor to enable admin order updates
-- Note: This system uses orderDetails table, not orders table

-- Policy: Admins can update all orderDetails
CREATE POLICY "Admins can update all orderDetails"
  ON orderDetails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can view all orderDetails (if not already exists)
-- This should already exist from supabase-orderdetails-rls-setup.sql, but adding for completeness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'orderDetails' 
    AND policyname = 'Admins can view all orderDetails'
  ) THEN
    CREATE POLICY "Admins can view all orderDetails"
      ON orderDetails FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Grant UPDATE permission to authenticated users (RLS will restrict to admins)
-- This should already be granted, but ensuring it exists
GRANT UPDATE ON orderDetails TO authenticated;

-- Add comment
COMMENT ON POLICY "Admins can update all orderDetails" ON orderDetails IS 
  'Allows admins to update order status and refund information';

