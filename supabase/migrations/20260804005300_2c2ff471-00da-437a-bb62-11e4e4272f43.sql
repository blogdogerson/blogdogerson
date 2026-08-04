create or replace function public.is_columnist(_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.columnists where user_id = _user_id)
$$;