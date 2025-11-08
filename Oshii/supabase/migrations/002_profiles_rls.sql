-- =====================================================
-- Migration: Add RLS policies for profiles table
-- Purpose: Allow users to search and view other users' profiles
-- =====================================================

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow authenticated users to view all profiles (for friend search)
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- Verify policies
-- =====================================================
-- You can verify the policies are applied by running:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
