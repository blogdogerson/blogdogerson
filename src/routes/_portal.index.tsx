import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getHomeData } from "@/lib/portal.functions";
import { getColumnists } from "@/lib/columnists.functions";
import { ListRow } from "@/components/portal/ArticleCard";
import { HeroRotator } from "@/components/portal/HeroRotator";
import { TopBannerCarousel, InlineBanner } from "@/components/portal/BannerSlot";
import { SponsorsBand } from "@/components/portal/SponsorsBand";
import { CategoryStrip } from "@/components/portal/CategoryStrip";
import { VideoSections } from "@/components/portal/VideoSections";
import { ColumnistsSection } from "@/components/portal/ColumnistsSection";
import type { Article } from "@/lib/categories";

function LatestRotator({ pool }: { pool: Article[] }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (pool.length <= 4) return;
    const t = setInterval(() => setOffset((o) => (o + 1) % pool.length), 7000);
    return () => clearInterval(t);
  }, [pool.length]);
  const items = Array.from({ length: Math.min(4, pool.length) }, (_, i) => pool[(offset + i) % pool.length]);
  return (
    <div className="grid content-start gap-2 rounded-3xl bg-card p-3 shadow-card">
      <p className="px-2 pt-1 font-display text-xs font-black uppercase tracking-[0.25em] text-primary">
        Últimas notícias
      </p>
      <div key={offset} className="grid animate-fade-up gap-2">
        {items.map((a) => (
          <ListRow key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
  staleTime: 60_000,
});

const columnistsQuery = queryOptions({
  queryKey: ["columnists"],
  queryFn: () => getColumnists(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/_portal/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(homeQuery),
      context.queryClient.ensureQueryData(columnistsQuery),
    ]),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar as notícias. {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Nada por aqui.</div>,
});

// Categories displayed as clean segments on the home page
const HOME_SEGMENTS = [
  "Gramado",
  "Canela",
  "Nova Petrópolis",
  "Região",
  "Política",
  "Câmara de Vereadores",
] as const;

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: colData } = useSuspenseQuery(columnistsQuery);
  const { articles, banners, videos } = data;
  const columnists = colData.columnists;

  const heroPool = articles.slice(0, 5);
  const secondary = articles.slice(5, 9);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Top rotating banner */}
      <div className="py-5">
        <TopBannerCarousel banners={banners} />
      </div>

      {/* Hero — rotating + últimas list */}
      {heroPool.length > 0 && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <HeroRotator articles={heroPool} />
          <div className="grid content-start gap-2 rounded-3xl bg-card p-3 shadow-card">
            <p className="px-2 pt-1 font-display text-xs font-black uppercase tracking-[0.25em] text-primary">
              Últimas notícias
            </p>
            {secondary.map((a) => (
              <ListRow key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Sponsors — highlighted */}
      <SponsorsBand banners={banners} />

      {/* Wide banner */}
      <div className="my-10">
        <InlineBanner banners={banners} />
      </div>

      {/* Segments — 3 news per category, clean */}
      {HOME_SEGMENTS.map((cat) => (
        <CategoryStrip key={cat} category={cat} articles={articles} />
      ))}

      {/* Inline banner between segments and columnists */}
      <div className="my-10">
        <InlineBanner banners={banners} index={1} />
      </div>

      {/* Colunistas */}
      <ColumnistsSection columnists={columnists} />

      {/* Videos */}
      <VideoSections videos={videos} />
    </div>
  );
}
