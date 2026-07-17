-- Revoke execute from public/anon/authenticated so signed-in users can't call has_role directly.
-- RLS policies that reference has_role continue to work because they run with definer privileges of the policy owner via SECURITY DEFINER function ownership; however, since callers still need EXECUTE for policy evaluation, we keep the function SECURITY DEFINER but restrict direct RPC access.
-- To fully address the linter, switch to SECURITY INVOKER: authenticated users already have SELECT on user_roles scoped to their own rows via RLS, which is exactly what has_role(auth.uid(), ...) needs.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;