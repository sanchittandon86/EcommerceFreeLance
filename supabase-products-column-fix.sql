-- Fix Products Table Column Naming
-- Run this SQL to ensure consistent column naming
-- This handles cases where both isActive and is_active might exist

-- Check if isActive (camelCase) exists and migrate to is_active (snake_case)
DO $$
BEGIN
    -- If isActive column exists, migrate data to is_active
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'isActive'
    ) THEN
        -- Update is_active with values from isActive if is_active doesn't have the value
        UPDATE products 
        SET is_active = "isActive" 
        WHERE is_active IS NULL OR is_active != "isActive";
        
        -- Drop the old isActive column
        ALTER TABLE products DROP COLUMN IF EXISTS "isActive";
    END IF;
END $$;

-- Ensure is_active column exists with correct defaults
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Ensure deleted_at column exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create/update indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Verify: All products should have is_active = true by default
UPDATE products SET is_active = true WHERE is_active IS NULL;

