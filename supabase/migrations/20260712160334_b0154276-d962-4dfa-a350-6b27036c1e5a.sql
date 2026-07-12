-- has_role only needs to run inside RLS policies (as authenticated) 
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- Validate email format on public newsletter signup instead of a blanket true
drop policy "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe with valid email" on public.newsletter_subscribers
for insert with check (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  and char_length(email) <= 255
);