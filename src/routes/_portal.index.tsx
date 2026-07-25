import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getHomeData } from "@/lib/portal.functions";
import { getColumnists } from "@/lib/columnists.functions";
import { topicsQuery } from "@/lib/topics.functions";
import { ListRow } from "@/components/portal/ArticleCard";
import { HeroRotator } from "@/components/portal/HeroRotator";
import { TopBannerCarousel, InlineBanner, SquareBannerStack } from "@/components/portal/BannerSlot";
import { CategoryStrip } from "@/components/portal/CategoryStrip";
import { VideoSections } from "@/components/portal/VideoSections";
import { ColumnistsSection } from "@/components/portal/ColumnistsSection";
import type { Article } from "@/lib/categories";

function LatestList({ pool }: { pool: Article[] }) {
  const items = pool.slice(0, 4);
  return (
    <div className="grid content-start gap-2 rounded-3xl bg-card p-3 shadow-card">
      <p className="flex items-center gap-2 px-2 pt-1 font-display text-xs font-black uppercase tracking-[0.25em] text-highlight-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-highlight animate-pulse-dot" />
        Últimas notícias
      </p>
      <div className="grid gap-2">
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
      context.queryClient.ensureQueryData(topicsQuery),
    ]),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar as notícias. {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Nada por aqui.</div>,
});

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: colData } = useSuspenseQuery(columnistsQuery);
  const { data: topicsData } = useSuspenseQuery(topicsQuery);
  const { articles, banners, videos } = data;
  const columnists = colData.columnists;
  const topics = topicsData.topics;

  const heroPool = articles.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4">
      {/* Top rotating banner */}
      <div className="py-4 sm:py-5">
        <TopBannerCarousel banners={banners} />
      </div>

      {/* Hero — rotating + últimas list */}
      {heroPool.length > 0 && (
        <section className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <HeroRotator articles={heroPool} />
          <LatestList pool={articles.slice(5)} />
        </section>
      )}

      {/* Segments with fixed square ads stacked on the left (desktop only) */}
      <div className="mt-4 grid gap-6 sm:gap-8 lg:mt-2 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block lg:pt-12">
          <SquareBannerStack banners={banners} />
        </aside>
        <div className="min-w-0">
          {topics.map((t) => (
            <CategoryStrip key={t.id} category={t.name} articles={articles} />
          ))}
        </div>
      </div>

      {/* Mobile: sponsors as a horizontal scroll below segments */}
      <div className="mt-6 lg:hidden">
        <p className="mb-3 font-display text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
          Patrocinadores
        </p>
        <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2">
          <SquareBannerStackMobile banners={banners} />
        </div>
      </div>

      {/* Wide banner between segments and columnists */}
      <div className="my-8 sm:my-10">
        <InlineBanner banners={banners} />
      </div>

      {/* Colunistas */}
      <ColumnistsSection columnists={columnists} />

      {/* Videos */}
      <VideoSections videos={videos} />
    </div>
  );
}

function SquareBannerStackMobile({ banners }: { banners: any[] }) {
  const items = banners
    .filter((b) => b.active && b.position === "sidebar")
    .sort((a, b) => a.sort_order - b.sort_order);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((b) => (
        <a
          key={b.id}
          href={b.link_url ?? undefined}
          target={b.link_url ? "_blank" : undefined}
          rel="noreferrer sponsored"
          className="block aspect-square w-[70vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-navy shadow-card sm:w-[240px]"
        >
          <img src={b.image_url} alt={b.title || "Anúncio"} className="h-full w-full object-cover" loading="lazy" />
        </a>
      ))}
    </>
  );
}
