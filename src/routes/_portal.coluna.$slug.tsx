import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getColumnBySlug } from "@/lib/columns.functions";
import { toDisplayHtml } from "@/lib/richtext";
import { ShareButtons } from "@/components/portal/ShareButtons";

const columnQuery = (slug: string) =>
  queryOptions({
    queryKey: ["column", slug],
    queryFn: () => getColumnBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

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
    return {
      meta: [
        { title: `${c.title} — ${author} | Blog do Gerson` },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.title} — ${author}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Blog do Gerson" },
        { property: "og:url", content: canonical },
        { name: "twitter:title", content: `${c.title} — ${author}` },
        { name: "twitter:description", content: desc },
        ...(c.image_url
          ? [
              { property: "og:image", content: c.image_url },
              { name: "twitter:image", content: c.image_url },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
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
            por{" "}
            <span className="font-bold text-foreground">{column.columnist.name}</span>
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
        <ShareButtons title={column.title} path={`/coluna/${column.slug}`} summary={column.excerpt} />
      </div>

      {column.image_url && (
        <img
          src={column.image_url}
          alt={column.title}
          className="mt-6 w-full rounded-2xl shadow-card"
        />
      )}

      <div
        className="article-body mt-6"
        dangerouslySetInnerHTML={{ __html: toDisplayHtml(column.content) }}
      />

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
                  <p className="mt-1 line-clamp-3 font-display text-base font-black">
                    {r.title}
                  </p>
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
    </div>
  );
}
