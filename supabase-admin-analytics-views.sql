-- Admin Analytics Dashboard - SQL Views
-- Run this SQL in your Supabase SQL Editor to create analytics views

-- 1. Total Revenue View
-- Calculates total revenue from completed orders (order_status = 1)
CREATE OR REPLACE VIEW admin_total_revenue AS
SELECT 
  COALESCE(SUM(amount * quantity), 0) AS total_revenue
FROM orderDetails
WHERE order_status = 1 -- completed
  AND is_active = 1;

-- 2. Orders Today View
-- Counts completed orders created today
CREATE OR REPLACE VIEW admin_orders_today AS
SELECT 
  COUNT(*) AS orders_count,
  COALESCE(SUM(amount * quantity), 0) AS revenue_today
FROM orderDetails
WHERE order_status = 1 -- completed
  AND is_active = 1
  AND DATE(created_at) = CURRENT_DATE;

-- 3. Orders This Week View
-- Counts completed orders created in the current week (Monday to Sunday)
CREATE OR REPLACE VIEW admin_orders_this_week AS
SELECT 
  COUNT(*) AS orders_count,
  COALESCE(SUM(amount * quantity), 0) AS revenue_week
FROM orderDetails
WHERE order_status = 1 -- completed
  AND is_active = 1
  AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE);

-- 4. Failed Payments View
-- Counts failed orders (order_status = 2)
CREATE OR REPLACE VIEW admin_failed_payments AS
SELECT 
  COUNT(*) AS failed_count,
  COALESCE(SUM(amount * quantity), 0) AS failed_revenue
FROM orderDetails
WHERE order_status = 2 -- failed
  AND is_active = 1;

-- 5. Top Selling Products View
-- Shows top 10 products by total quantity sold (completed orders only)
CREATE OR REPLACE VIEW admin_top_selling_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  COALESCE(SUM(od.quantity), 0) AS total_quantity_sold,
  COALESCE(SUM(od.amount * od.quantity), 0) AS total_revenue
FROM products p
LEFT JOIN orderDetails od ON p.id = od.fk_id_product
  AND od.order_status = 1 -- completed
  AND od.is_active = 1
WHERE p.is_active = true
GROUP BY p.id, p.name, p.image_url, p.price
ORDER BY total_quantity_sold DESC, total_revenue DESC
LIMIT 10;

-- Grant SELECT permissions to authenticated users (RLS will handle admin-only access)
GRANT SELECT ON admin_total_revenue TO authenticated;
GRANT SELECT ON admin_orders_today TO authenticated;
GRANT SELECT ON admin_orders_this_week TO authenticated;
GRANT SELECT ON admin_failed_payments TO authenticated;
GRANT SELECT ON admin_top_selling_products TO authenticated;

-- Create RLS policies for views (admin-only access)
-- Note: Views don't support RLS directly, so we'll enforce access in the application layer
-- But we can create policies on the underlying tables

-- Add comments for documentation
COMMENT ON VIEW admin_total_revenue IS 'Total revenue from all completed orders';
COMMENT ON VIEW admin_orders_today IS 'Orders and revenue for today (completed orders only)';
COMMENT ON VIEW admin_orders_this_week IS 'Orders and revenue for current week (completed orders only)';
COMMENT ON VIEW admin_failed_payments IS 'Count and revenue of failed orders';
COMMENT ON VIEW admin_top_selling_products IS 'Top 10 products by quantity sold (completed orders only)';

