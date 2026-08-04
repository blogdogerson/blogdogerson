create or replace function public.is_columnist(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.columnists where user_id = _user_id)
$$;

revoke all on function public.is_columnist(uuid) from public, anon;
grant execute on function public.is_columnist(uuid) to authenticated, service_role;

create policy "Columnists can upload to uploads bucket"
on storage.objects for insert to authenticated
with check (bucket_id = 'uploads' and public.is_columnist(auth.uid()));

create policy "Columnists can list uploads"
on storage.objects for select to authenticated
using (bucket_id = 'uploads' and public.is_columnist(auth.uid()));

create policy "Columnists can update uploads"
on storage.objects for update to authenticated
using (bucket_id = 'uploads' and public.is_columnist(auth.uid()) and owner = auth.uid());

create policy "Columnists can delete own uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'uploads' and public.is_columnist(auth.uid()) and owner = auth.uid());