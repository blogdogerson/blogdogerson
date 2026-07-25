
ALTER TABLE public.columnists
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Columnists can read own record" ON public.columnists
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Columnists can read own columns" ON public.columns
FOR SELECT TO authenticated
USING (columnist_id IN (SELECT id FROM public.columnists WHERE user_id = auth.uid()));

CREATE POLICY "Columnists can insert own columns" ON public.columns
FOR INSERT TO authenticated
WITH CHECK (columnist_id IN (SELECT id FROM public.columnists WHERE user_id = auth.uid()));

CREATE POLICY "Columnists can update own columns" ON public.columns
FOR UPDATE TO authenticated
USING (columnist_id IN (SELECT id FROM public.columnists WHERE user_id = auth.uid()))
WITH CHECK (columnist_id IN (SELECT id FROM public.columnists WHERE user_id = auth.uid()));

CREATE POLICY "Columnists can delete own columns" ON public.columns
FOR DELETE TO authenticated
USING (columnist_id IN (SELECT id FROM public.columnists WHERE user_id = auth.uid()));
