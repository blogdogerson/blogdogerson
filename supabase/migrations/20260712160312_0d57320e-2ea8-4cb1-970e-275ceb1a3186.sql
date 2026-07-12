-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view own roles" on public.user_roles
for select to authenticated using (user_id = auth.uid());

-- Articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  wp_id integer unique,
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null default '',
  category text not null default 'Geral',
  image_url text,
  published boolean not null default true,
  featured boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;

create policy "Public can read published articles" on public.articles
for select using (published = true);

create policy "Admins can manage articles" on public.articles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create index articles_published_at_idx on public.articles (published_at desc);
create index articles_category_idx on public.articles (category);

-- Banners
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  image_url text not null,
  link_url text,
  position text not null default 'sidebar',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.banners to anon;
grant select, insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;

create policy "Public can read active banners" on public.banners
for select using (active = true);

create policy "Admins can manage banners" on public.banners
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Videos
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null default '',
  embed_url text not null,
  orientation text not null default 'vertical',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.videos to anon;
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

create policy "Public can read active videos" on public.videos
for select using (active = true);

create policy "Admins can manage videos" on public.videos
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Newsletter
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon;
grant select, insert, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe" on public.newsletter_subscribers
for insert with check (true);

create policy "Admins can view subscribers" on public.newsletter_subscribers
for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete subscribers" on public.newsletter_subscribers
for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create trigger banners_updated_at before update on public.banners
for each row execute function public.set_updated_at();