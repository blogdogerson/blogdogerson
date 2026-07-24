-- Permite vincular um login (conta criada em /auth) a um colunista específico,
-- para que ele possa editar e publicar SOMENTE a própria coluna pelo painel,
-- sem acesso a Notícias, Banners, Vídeos, Tópicos ou colunas de outros colunistas.

ALTER TABLE public.columnists
  ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- O próprio colunista pode ler seu registro (mesmo se estiver inativo),
-- além da política pública já existente que só libera colunistas ativos.
CREATE POLICY "Columnist can view own profile" ON public.columnists
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Função auxiliar: id do colunista vinculado ao usuário logado (ou null).
CREATE OR REPLACE FUNCTION public.my_columnist_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.columnists WHERE user_id = auth.uid() LIMIT 1
$$;

-- Um colunista logado pode ler/criar/editar/apagar somente as próprias colunas.
CREATE POLICY "Columnists can manage own columns" ON public.columns
  FOR ALL TO authenticated
  USING (columnist_id = public.my_columnist_id())
  WITH CHECK (columnist_id = public.my_columnist_id());
