import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getHomeData } from "@/lib/portal.functions";
import { getColumnists } from "@/lib/columnists.functions";
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
    ]),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar as notícias. {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Nada por aqui.</div>,
});

// Categories displayed as clean segments on the home page (ordem definida pelo editor)
const HOME_SEGMENTS = [
  "Gramado",
  "Canela",
  "Nova Petrópolis",
  "Geral",
  "Câmara de Vereadores",
  "Polícia",
  "Política",
  "Região",
] as const;

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: colData } = useSuspenseQuery(columnistsQuery);
  const { articles, banners, videos } = data;
  const columnists = colData.columnists;

  const heroPool = articles.slice(0, 5);

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
          <LatestList pool={articles.slice(5)} />
        </section>
      )}

      {/* Segments with fixed square ads stacked on the left */}
      <div className="mt-2 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="pt-12">
          <SquareBannerStack banners={banners} />
        </aside>
        <div className="min-w-0">
          {HOME_SEGMENTS.map((cat) => (
            <CategoryStrip key={cat} category={cat} articles={articles} />
          ))}
        </div>
      </div>

      {/* Wide banner between segments and columnists */}
      <div className="my-10">
        <InlineBanner banners={banners} />
      </div>

      {/* Colunistas */}
      <ColumnistsSection columnists={columnists} />

      {/* Videos */}
      <VideoSections videos={videos} />
    </div>
  );
}
