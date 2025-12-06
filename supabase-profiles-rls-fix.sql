-- Fix RLS policies to allow users to insert their own profile
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing insert policy (if it exists)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can also insert profiles (for triggers and admin operations)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

