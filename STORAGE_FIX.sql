-- SIMPLE FIX FOR STORAGE RLS POLICIES
-- Copy and paste this EXACT script into Supabase SQL Editor
-- This creates policies for authenticated users

-- Drop any existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Authenticated users can upload to Boards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update in Boards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from Boards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from Boards" ON storage.objects;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can upload to Boards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Boards');

CREATE POLICY "Authenticated users can update in Boards"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Boards')
WITH CHECK (bucket_id = 'Boards');

CREATE POLICY "Authenticated users can delete from Boards"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Boards');

CREATE POLICY "Anyone can read from Boards"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Boards');
