import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getHomeData } from "@/lib/portal.functions";
import { getColumnists } from "@/lib/columnists.functions";
import { ArticleCard, ListRow } from "@/components/portal/ArticleCard";
import { HeroRotator } from "@/components/portal/HeroRotator";
import { TopBannerCarousel, SidebarBanners, InlineBanner } from "@/components/portal/BannerSlot";
import { VideoSections } from "@/components/portal/VideoSections";
import { ColumnistsSection } from "@/components/portal/ColumnistsSection";
import { CATEGORIES, categoryToSlug } from "@/lib/categories";

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

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: colData } = useSuspenseQuery(columnistsQuery);
  const { articles, banners, videos } = data;
  const columnists = colData.columnists;

  const heroPool = articles.slice(0, 5);
  const secondary = articles.slice(5, 9);
  const rest = articles.slice(9, 21);
  const more = articles.slice(21, 33);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Top rotating banner */}
      <div className="py-5">
        <TopBannerCarousel banners={banners} />
      </div>

      {/* Hero — rotating + list */}
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

      {/* Wide banner below hero */}
      <div className="my-8">
        <InlineBanner banners={banners} />
      </div>

      {/* Main grid + sidebar */}
      <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-black tracking-tight">NOTÍCIAS</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rest.slice(0, 6).map((a, i) => (
              <ArticleCard key={a.id} article={a} compact={i > 1} />
            ))}
          </div>

          <div className="my-8">
            <InlineBanner banners={banners} index={1} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rest.slice(6).map((a) => (
              <ArticleCard key={a.id} article={a} compact />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <SidebarBanners banners={banners} max={6} />
        </aside>
      </section>


      {/* Colunistas */}
      <ColumnistsSection columnists={columnists} />

      {/* Videos */}
      <VideoSections videos={videos} />

      {/* More news */}
      {more.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 font-display text-2xl font-black">Mais notícias</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((a) => (
              <ArticleCard key={a.id} article={a} compact />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to="/editoria/$slug"
                params={{ slug: categoryToSlug(cat) }}
                className="rounded-full border px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
