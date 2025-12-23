-- Supabase Products Soft Delete Migration
-- Run this SQL in your Supabase SQL Editor to add soft delete columns

-- Add is_active column (default true for existing products)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add deleted_at column (nullable)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Update existing products to be active (if any were marked inactive)
UPDATE products SET is_active = true WHERE is_active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.is_active IS 'Soft delete flag. false means product is deactivated.';
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when product was soft deleted.';

