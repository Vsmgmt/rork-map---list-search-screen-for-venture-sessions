-- Storage RLS Policies for Boards Bucket
-- Run these in your Supabase SQL Editor

-- ============================================
-- OPTION 1: Public Anonymous Access (Less Secure)
-- Anyone can insert/update/delete images
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to upload to the Boards bucket
CREATE POLICY "Public: Allow anyone to upload to Boards bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'Boards');

-- Allow anyone to update files in the Boards bucket
CREATE POLICY "Public: Allow anyone to update in Boards bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'Boards')
WITH CHECK (bucket_id = 'Boards');

-- Allow anyone to delete files in the Boards bucket
CREATE POLICY "Public: Allow anyone to delete from Boards bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'Boards');

-- Allow anyone to select/read files in the Boards bucket
CREATE POLICY "Public: Allow anyone to read from Boards bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Boards');


-- ============================================
-- OPTION 2: Authenticated Only (More Secure) 
-- Only logged-in users can manage images
-- Recommended for production
-- ============================================

-- Before running Option 2, drop Option 1 policies if you created them:
-- DROP POLICY IF EXISTS "Public: Allow anyone to upload to Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to update in Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to delete from Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to read from Boards bucket" ON storage.objects;

-- Enable RLS (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated: Allow upload to Boards bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Boards');

-- Allow authenticated users to update
CREATE POLICY "Authenticated: Allow update in Boards bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Boards')
WITH CHECK (bucket_id = 'Boards');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated: Allow delete from Boards bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Boards');

-- Allow everyone to read (public access to view images)
CREATE POLICY "Public: Allow read from Boards bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Boards');


-- ============================================
-- OPTION 3: Owner-Based (Most Secure)
-- Users can only manage their own uploads
-- ============================================

-- Before running Option 3, drop previous policies

-- Allow users to upload with their user_id in metadata or path
CREATE POLICY "Authenticated: Allow user to upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Boards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Authenticated: Allow user to update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Boards'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'Boards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Authenticated: Allow user to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Boards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to read
CREATE POLICY "Public: Allow read from Boards bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Boards');

-- ============================================
-- To check existing policies, run:
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- To drop all policies and start fresh:
-- ============================================
-- DROP POLICY IF EXISTS "Public: Allow anyone to upload to Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to update in Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to delete from Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Public: Allow anyone to read from Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow upload to Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow update in Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow delete from Boards bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow user to upload own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow user to update own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated: Allow user to delete own files" ON storage.objects;
