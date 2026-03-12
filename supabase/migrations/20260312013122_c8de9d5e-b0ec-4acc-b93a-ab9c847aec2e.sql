-- Add logo_url column to creches
ALTER TABLE public.creches ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for creche logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('creche-logos', 'creche-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to creche-logos bucket
CREATE POLICY "Authenticated users can upload creche logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creche-logos');

-- Allow public to view creche logos
CREATE POLICY "Public can view creche logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'creche-logos');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update creche logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'creche-logos');

CREATE POLICY "Authenticated users can delete creche logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creche-logos');
