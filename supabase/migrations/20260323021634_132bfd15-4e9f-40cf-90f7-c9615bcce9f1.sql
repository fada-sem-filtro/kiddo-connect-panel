
-- Add attachment columns to recados
ALTER TABLE public.recados ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.recados ADD COLUMN IF NOT EXISTS anexo_tipo text;

-- Create storage bucket for recado attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('recado-anexos', 'recado-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload recado attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recado-anexos');

-- Authenticated users can view
CREATE POLICY "Anyone can view recado attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recado-anexos');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own recado attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'recado-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);
