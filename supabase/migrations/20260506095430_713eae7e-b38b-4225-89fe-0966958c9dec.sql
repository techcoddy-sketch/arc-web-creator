UPDATE storage.buckets SET public = false WHERE id = 'document-images';
DROP POLICY IF EXISTS "Public can view document images" ON storage.objects;