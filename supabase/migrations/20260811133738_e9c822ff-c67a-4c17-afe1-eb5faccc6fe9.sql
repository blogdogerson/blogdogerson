CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  kind text NOT NULL DEFAULT 'pagina',
  title text NOT NULL DEFAULT '',
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX page_views_path_idx ON public.page_views (path);

GRANT INSERT ON public.page_views TO anon;
GRANT INSERT, SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page view"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(path) <= 512 AND char_length(title) <= 300 AND char_length(kind) <= 32);

CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));