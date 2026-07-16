
CREATE TABLE public.columnists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  specialty text NOT NULL DEFAULT 'Coluna',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  latest_title text NOT NULL DEFAULT '',
  latest_excerpt text NOT NULL DEFAULT '',
  link_url text,
  accent_color text NOT NULL DEFAULT '#3b82f6',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.columnists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.columnists TO authenticated;
GRANT ALL ON public.columnists TO service_role;

ALTER TABLE public.columnists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active columnists" ON public.columnists
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage columnists" ON public.columnists
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed one example columnist
INSERT INTO public.columnists (name, slug, specialty, bio, latest_title, latest_excerpt, accent_color, sort_order)
VALUES (
  'Coluna Social',
  'coluna-social',
  'Coluna Social',
  'Os acontecimentos, personagens e eventos que movimentam a sociedade da Serra Gaúcha.',
  'Em breve — primeira coluna',
  'Cadastre aqui pelo painel administrativo os colunistas e suas colunas.',
  '#3b82f6',
  1
);
