-- Migration: Fix orders table user_id type from bigint to UUID
-- Run this SQL in your Supabase SQL Editor if you already have an orders table with bigint user_id

-- Step 1: Drop the foreign key constraint if it exists (if user_id references something)
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Step 2: Drop the column (this will delete all data in that column)
-- If you have important orders, you might want to export them first
ALTER TABLE orders DROP COLUMN IF EXISTS user_id;

-- Step 3: Add the column back with correct UUID type
ALTER TABLE orders ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Step 5: Ensure other columns exist with correct types
-- Check if id is UUID, if not you might need to fix it too
-- ALTER TABLE orders ALTER COLUMN id TYPE UUID USING id::uuid;

-- Step 6: Ensure status column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Step 7: Ensure amount column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'amount') THEN
        ALTER TABLE orders ADD COLUMN amount DECIMAL(10, 2) NOT NULL;
    END IF;
END $$;

-- Step 8: Ensure razorpay_order_id column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'razorpay_order_id') THEN
        ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT;
    END IF;
END $$;

-- Step 9: Ensure payment_id column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE orders ADD COLUMN payment_id TEXT;
    END IF;
END $$;

-- Step 10: Ensure signature column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'signature') THEN
        ALTER TABLE orders ADD COLUMN signature TEXT;
    END IF;
END $$;

-- Step 11: Ensure created_at column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'created_at') THEN
        ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 12: Ensure updated_at column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 13: Create other indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- Step 14: Enable RLS if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 15: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Step 16: Create RLS policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Step 17: Grant permissions
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
