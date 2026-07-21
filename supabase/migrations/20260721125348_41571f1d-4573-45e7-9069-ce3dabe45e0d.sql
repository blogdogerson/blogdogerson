
CREATE TABLE public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  columnist_id UUID NOT NULL REFERENCES public.columnists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX columns_columnist_published_idx ON public.columns (columnist_id, published_at DESC);
CREATE INDEX columns_published_idx ON public.columns (published, published_at DESC);

GRANT SELECT ON public.columns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.columns TO authenticated;
GRANT ALL ON public.columns TO service_role;

ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published columns" ON public.columns
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can read all columns" ON public.columns
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert columns" ON public.columns
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update columns" ON public.columns
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete columns" ON public.columns
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER columns_set_updated_at
  BEFORE UPDATE ON public.columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
