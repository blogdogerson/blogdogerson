create or replace function public.page_view_stats(_days int default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  _since timestamptz := now() - make_interval(days => greatest(1, least(_days, 365)));
  _result jsonb;
begin
  select jsonb_build_object(
    'total', (select count(*) from page_views where created_at >= _since),
    'today', (select count(*) from page_views where created_at >= date_trunc('day', now())),
    'yesterday', (select count(*) from page_views where created_at >= date_trunc('day', now()) - interval '1 day' and created_at < date_trunc('day', now())),
    'byKind', coalesce((select jsonb_agg(x) from (select kind, count(*)::int as views from page_views where created_at >= _since group by kind order by 2 desc) x), '[]'::jsonb),
    'byDay', coalesce((select jsonb_agg(x) from (select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as views from page_views where created_at >= _since group by 1 order by 1) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(x) from (select coalesce(nullif(referrer,''), 'direto') as source, count(*)::int as views from page_views where created_at >= _since group by 1 order by 2 desc limit 10) x), '[]'::jsonb),
    'topPages', coalesce((select jsonb_agg(x) from (select path, min(kind) as kind, max(title) as title, count(*)::int as views from page_views where created_at >= _since group by path order by 4 desc limit 25) x), '[]'::jsonb),
    'topArticles', coalesce((select jsonb_agg(x) from (select path, 'noticia'::text as kind, max(title) as title, count(*)::int as views from page_views where created_at >= _since and kind = 'noticia' group by path order by 4 desc limit 25) x), '[]'::jsonb),
    'topColumns', coalesce((select jsonb_agg(x) from (select path, 'coluna'::text as kind, max(title) as title, count(*)::int as views from page_views where created_at >= _since and kind = 'coluna' group by path order by 4 desc limit 25) x), '[]'::jsonb),
    'topEditorias', coalesce((select jsonb_agg(x) from (select path, 'editoria'::text as kind, max(title) as title, count(*)::int as views from page_views where created_at >= _since and kind = 'editoria' group by path order by 4 desc limit 25) x), '[]'::jsonb)
  ) into _result;

  return _result;
end;
$$;