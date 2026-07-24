-- Tópicos/categorias dinâmicos: passam a ser gerenciados via painel administrativo
-- em vez de uma lista fixa no código. "Geral" fica de fora da lista (não aparece
-- mais no menu/home/rodapé) mas as notícias já publicadas com category = 'Geral'
-- NÃO são apagadas nem alteradas por esta migração.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

create policy "Public can read categories" on public.categories
for select using (true);

create policy "Admins can manage categories" on public.categories
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

-- Seed com os tópicos atuais, mantendo a ordem usada na home, exceto "Geral"
insert into public.categories (name, sort_order)
values
  ('Gramado', 1),
  ('Canela', 2),
  ('Nova Petrópolis', 3),
  ('Câmara de Vereadores', 4),
  ('Polícia', 5),
  ('Política', 6),
  ('Região', 7)
on conflict (name) do nothing;
