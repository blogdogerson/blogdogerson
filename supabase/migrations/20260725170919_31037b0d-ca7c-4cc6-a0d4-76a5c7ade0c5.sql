
CREATE TABLE public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  content TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 10,
  width_px INTEGER NOT NULL DEFAULT 520,
  height_px INTEGER NOT NULL DEFAULT 620,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popups TO authenticated;
GRANT ALL ON public.popups TO service_role;

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "popups_public_read_active"
  ON public.popups FOR SELECT
  USING (active = true);

CREATE POLICY "popups_admin_all"
  ON public.popups FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER popups_set_updated_at
  BEFORE UPDATE ON public.popups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
