# Supabase Storage Setup for Board Images

## Issue
You're getting `StorageApiError: new row violates row-level security policy` because the storage bucket needs proper RLS policies.

## Solution - Run in Supabase SQL Editor

Copy and paste this SQL into your Supabase SQL Editor to create the bucket and policies:

```sql
-- Create the Boards storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Boards', 'Boards', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access to Boards bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to Boards bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update to Boards bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete from Boards bucket" ON storage.objects;

-- Allow anyone to read (view) images from the Boards bucket
CREATE POLICY "Public read access to Boards bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'Boards');

-- Allow anyone to upload images to the Boards bucket
CREATE POLICY "Public upload to Boards bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Boards');

-- Allow anyone to update images in the Boards bucket (for upsert)
CREATE POLICY "Public update to Boards bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Boards');

-- Allow anyone to delete images from the Boards bucket
CREATE POLICY "Public delete from Boards bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'Boards');
```

## What This Does

1. **Creates the `Boards` bucket** as a public bucket (images are publicly accessible)
2. **Enables Row Level Security** on the storage.objects table
3. **Creates 4 policies** that allow public access to:
   - Read (view) images
   - Upload new images
   - Update existing images (needed for `upsert: true`)
   - Delete images

## Verification

After running the SQL, test by:

1. Going to your board edit screen
2. Upload an image
3. Check if the upload succeeds without RLS errors

## Security Note

These policies allow **public access** to the Boards bucket. For production, you may want to:
- Restrict uploads to authenticated users only
- Add file size limits
- Validate file types

Example of authenticated-only upload policy:
```sql
-- Require authentication for uploads
DROP POLICY IF EXISTS "Public upload to Boards bucket" ON storage.objects;

CREATE POLICY "Authenticated upload to Boards bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Boards' 
  AND auth.role() = 'authenticated'
);
```

But for now, public access policies will unblock your development.
