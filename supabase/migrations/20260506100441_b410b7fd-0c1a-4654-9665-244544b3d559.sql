
-- 1. Lock down task-images bucket SELECT to owner only (was public)
DROP POLICY IF EXISTS "Users can view task images" ON storage.objects;
CREATE POLICY "Users can view their own task images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Also tighten existing INSERT/UPDATE/DELETE on task-images to authenticated
DROP POLICY IF EXISTS "Users can update their own task images" ON storage.objects;
CREATE POLICY "Users can update their own task images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'task-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own task images" ON storage.objects;
CREATE POLICY "Users can delete their own task images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'task-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Make task-images bucket private (signed URLs already used in client code)
UPDATE storage.buckets SET public = false WHERE id = 'task-images';

-- 2. Fix broken org-document-images storage policy (was joining d.image_path = d.name)
DROP POLICY IF EXISTS "Organization members can view org document images" ON storage.objects;
CREATE POLICY "Organization members can view org document images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'document-images'
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.image_path = storage.objects.name
        AND d.organization_id IS NOT NULL
        AND public.is_org_member(auth.uid(), d.organization_id)
    )
  );

-- 3. Add ip_address column to otp_codes for IP-based rate limiting
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_otp_codes_ip_created ON public.otp_codes(ip_address, created_at);
