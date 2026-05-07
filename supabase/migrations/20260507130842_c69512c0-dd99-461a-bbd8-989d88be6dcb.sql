DROP POLICY IF EXISTS "Public can read blog images" ON storage.objects;

CREATE POLICY "Admins can list blog images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'blog-imagens'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);