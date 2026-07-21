import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Clock } from "lucide-react";
import { getArticleBySlug } from "@/lib/portal.functions";
import { toDisplayHtml } from "@/lib/richtext";
import { categoryToSlug } from "@/lib/categories";
import { CategoryTag, formatExactDate, ArticleCard } from "@/components/portal/ArticleCard";
import { SidebarBanners, InlineBanner } from "@/components/portal/BannerSlot";
import { NewsletterForm } from "@/components/portal/NewsletterForm";
import { ShareButtons } from "@/components/portal/ShareButtons";

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticleBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/_portal/noticia/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(articleQuery(params.slug));
    if (!data.article) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.article) {
      return { meta: [{ title: "Notícia não encontrada — Blog do Gerson" }, { name: "robots", content: "noindex" }] };
    }
    const a = loaderData.article;
    const desc = (a.excerpt || a.title).slice(0, 158);
    return {
      meta: [
        { title: `${a.title} — Blog do Gerson` },
        { name: "description", content: desc },
        { property: "og:title", content: a.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/noticia/${a.slug}` },
        ...(a.image_url ? [{ property: "og:image", content: a.image_url }, { name: "twitter:image", content: a.image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/noticia/${a.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.title,
            datePublished: a.published_at,
            image: a.image_url ? [a.image_url] : undefined,
            author: { "@type": "Person", name: "Gerson Sorgetz" },
            publisher: { "@type": "Organization", name: "Blog do Gerson" },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar a notícia. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Notícia não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Ela pode ter sido removida ou o endereço mudou.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </div>
  ),
});

/** Estimated reading time in minutes (~200 words/min). */
function readingTime(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(articleQuery(slug));
  const { article, related, banners } = data;
  if (!article) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <article className="min-w-0">
          <div className="max-w-3xl">
            <nav aria-label="Trilha de navegação" className="mb-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-primary">
                Início
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                to="/editoria/$slug"
                params={{ slug: categoryToSlug(article.category) }}
                className="transition-colors hover:text-primary"
              >
                {article.category}
              </Link>
            </nav>
            <CategoryTag category={article.category} asLink />
            <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-5xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-3">
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>
                  Por <span className="font-semibold text-foreground">Gerson Sorgetz</span> ·{" "}
                  {formatExactDate(article.published_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {readingTime(article.content)} min de leitura
                </span>
              </p>
              <ShareButtons title={article.title} slug={article.slug} />
            </div>
          </div>

          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title}
              className="mt-6 w-full rounded-2xl shadow-card"
            />
          )}

          <div
            className="article-body mt-6 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: toDisplayHtml(article.content) }}
          />

          <div className="mt-10 max-w-3xl">
            <InlineBanner banners={banners} />
          </div>

          <div className="mt-8 flex max-w-3xl items-center justify-between border-t pt-5">
            <p className="text-sm font-semibold">Compartilhe esta notícia:</p>
            <ShareButtons title={article.title} slug={article.slug} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 font-display text-2xl font-black">Leia também</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} compact />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-6">
          <SidebarBanners banners={banners} />
          <div className="rounded-2xl bg-sky-soft p-5">
            <h3 className="font-display text-lg font-black">Newsletter</h3>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              Receba as notícias no seu e-mail.
            </p>
            <NewsletterForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
