-- Add email column to profiles table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- Check if email column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        
        -- Update existing rows with email from auth.users
        UPDATE profiles p
        SET email = au.email
        FROM auth.users au
        WHERE p.id = au.id
        AND p.email IS NULL;
        
        RAISE NOTICE 'Email column added to profiles table';
    ELSE
        RAISE NOTICE 'Email column already exists in profiles table';
    END IF;
END $$;

-- Refresh the schema cache (PostgREST will do this automatically, but you can also restart the API)

