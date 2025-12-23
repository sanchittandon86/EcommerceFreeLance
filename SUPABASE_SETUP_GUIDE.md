# Supabase Configuration Guide

## 🔧 Fixing "Configuration Required" Error

If you're seeing "Configuration Required" on the home page, follow these steps:

---

## ✅ Step 1: Check Environment Variables

Create a `.env.local` file in the root of your project with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Where to Find These Values:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Step 2: Run Database Migrations

The app requires certain database columns. Run these SQL files in your Supabase SQL Editor:

### **Required Migrations (in order):**

1. **Products Soft Delete** (if not already done):
   ```sql
   -- Run: supabase-products-soft-delete-migration.sql
   ```

2. **Column Fix** (if you have both isActive and is_active):
   ```sql
   -- Run: supabase-products-column-fix.sql
   ```

### **Quick Check:**

Run this in Supabase SQL Editor to verify columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('is_active', 'isActive');
```

---

## ✅ Step 3: Verify Environment Variables Are Loaded

After creating `.env.local`:

1. **Restart your Next.js dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Check if variables are loaded**:
   - The app will log errors if variables are missing
   - Check browser console for Supabase connection errors

---

## 🔍 Troubleshooting

### **Error: "column products.is_active does not exist"**

**Solution**: Run the soft delete migration:
```sql
-- Execute supabase-products-soft-delete-migration.sql
```

### **Error: "Invalid API key" or "JWT" errors**

**Solution**: 
1. Verify your `.env.local` file exists
2. Check that values are correct (no extra spaces)
3. Restart the dev server

### **Error: "Failed to fetch" or Network errors**

**Solution**:
1. Check your Supabase project is active
2. Verify RLS policies allow public read access to products
3. Check browser console for CORS errors

---

## 📋 Quick Setup Checklist

- [ ] Created `.env.local` file
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Restarted Next.js dev server
- [ ] Ran `supabase-products-soft-delete-migration.sql`
- [ ] Verified products table has `is_active` column
- [ ] Checked browser console for errors

---

## 🚨 Common Issues

### **Issue: Environment variables not loading**

**Fix**: 
- Ensure file is named `.env.local` (not `.env`)
- Restart dev server after creating/editing `.env.local`
- Check for typos in variable names

### **Issue: Products table missing columns**

**Fix**:
- Run the migration SQL files
- Verify columns exist using SQL query above
- Check Supabase dashboard → Table Editor → products

### **Issue: RLS blocking queries**

**Fix**:
- Ensure products table has public read policy:
  ```sql
  CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);
  ```

---

## 📝 Example .env.local File

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay (if using payments)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Verification

After setup, you should see:
- ✅ Home page loads without "Configuration Required" error
- ✅ Products display on the homepage
- ✅ No errors in browser console
- ✅ No errors in terminal/server logs

---

**Need Help?** Check the browser console and server logs for specific error messages.

