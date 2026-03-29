
INSERT INTO storage.buckets (id, name, public) VALUES ('authorized-pickups-photos', 'authorized-pickups-photos', true);

CREATE POLICY "Authenticated users can upload pickup photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated users can update pickup photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Anyone can view pickup photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated users can delete pickup photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'authorized-pickups-photos');
