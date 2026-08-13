import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getColumnBySlug } from "@/lib/columns.functions";
import { toDisplayHtml } from "@/lib/richtext";
import { ShareButtons } from "@/components/portal/ShareButtons";
import {
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  PUBLISHER_LOGO,
  SITE_NAME,
  SITE_URL,
  summarize,
} from "@/lib/site";

const columnQuery = (slug: string) =>
  queryOptions({
    queryKey: ["column", slug],
    queryFn: () => getColumnBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

const optimizedColumnImages: Record<string, string> = {
  "entre-a-politica-e-as-historias-da-serra": "/img/colunas/entre-a-politica-e-as-historias-da-serra.jpg",
  "e-voce-ja-usou-o-seu-hoje": "/img/colunas/e-voce-ja-usou-o-seu-hoje.jpg",
  "tecnologia-que-aproxima": "/img/colunas/tecnologia-que-aproxima.jpg",
};

export const Route = createFileRoute("/_portal/coluna/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(columnQuery(params.slug));
    if (!data.column) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.column) {
      return {
        meta: [
          { title: "Coluna não encontrada — Blog do Gerson" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const c = loaderData.column;
    const desc = summarize(c.excerpt, c.content, c.title);
    const author = c.columnist?.name ?? "Colunista";
    const canonical = absoluteUrl(`/coluna/${c.slug}`);
    const socialImage = absoluteUrl(
      optimizedColumnImages[c.slug] || c.image_url || DEFAULT_SOCIAL_IMAGE,
    );
    return {
      meta: [
        { title: `${c.title} — ${author} | Blog do Gerson` },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.title} — ${author}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Blog do Gerson" },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: socialImage },
        { property: "og:image:secure_url", content: socialImage },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: c.title },
        { property: "article:published_time", content: c.published_at },
        { property: "article:modified_time", content: c.updated_at },
        { name: "twitter:title", content: `${c.title} — ${author}` },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: socialImage },
        { name: "twitter:image:alt", content: c.title },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${canonical}#article`,
            url: canonical,
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
            headline: c.title,
            description: desc,
            image: [socialImage],
            datePublished: c.published_at,
            dateModified: c.updated_at,
            inLanguage: "pt-BR",
            isAccessibleForFree: true,
            author: { "@type": "Person", name: author, url: absoluteUrl("/colunistas") },
            publisher: {
              "@type": "NewsMediaOrganization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
            },
          }).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  component: ColumnPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar a coluna. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Coluna não encontrada</h1>
      <Link
        to="/colunistas"
        className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Ver colunistas
      </Link>
    </div>
  ),
});

function ColumnPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(columnQuery(slug));
  const { column, related } = data;
  if (!column) return null;
  const accent = column.columnist?.accent_color ?? "#3b82f6";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]"
          style={{ background: `${accent}18`, color: accent }}
        >
          {column.columnist?.specialty ?? "Coluna"}
        </span>
        {column.columnist && (
          <span className="text-sm font-semibold text-muted-foreground">
            por <span className="font-bold text-foreground">{column.columnist.name}</span>
          </span>
        )}
      </div>

      <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-5xl">
        {column.title}
      </h1>
      {column.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{column.excerpt}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-3">
        <p className="text-sm text-muted-foreground">
          {new Date(column.published_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <ShareButtons
          title={column.title}
          path={`/coluna/${column.slug}`}
          summary={column.excerpt}
        />
      </div>

      {column.image_url && (
        <img
          src={column.image_url}
          alt={column.title}
          decoding="async"
          fetchPriority="high"
          className="mt-6 w-full rounded-2xl shadow-card"
        />
      )}

      <div
        className="article-body mt-6"
        dangerouslySetInnerHTML={{ __html: toDisplayHtml(column.content) }}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-sm font-semibold">Compartilhe esta coluna:</p>
        <ShareButtons
          title={column.title}
          path={`/coluna/${column.slug}`}
          summary={column.excerpt}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-black">Outras colunas</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/coluna/$slug"
                params={{ slug: r.slug }}
                className="group block overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-float"
              >
                {r.image_url && (
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={r.image_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: r.columnist?.accent_color ?? "#3b82f6" }}
                  >
                    {r.columnist?.name ?? "Coluna"}
                  </p>
                  <p className="mt-1 line-clamp-3 font-display text-base font-black">{r.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

        <div className="mt-10">
          <Link to="/colunistas" className="text-sm font-semibold text-primary hover:underline">
            ← Todos os colunistas
          </Link>
        </div>
      </article>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <SidebarBanners banners={banners} />
      </aside>
    </div>
  );
}
