
CREATE POLICY "Admins can upload to uploads bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can list uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
