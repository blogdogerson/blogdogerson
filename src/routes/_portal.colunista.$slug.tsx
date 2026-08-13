import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, PenLine } from "lucide-react";
import { getColumnistBySlug } from "@/lib/columnists.functions";
import { bannersQuery } from "@/lib/banners.query";
import { InlineBanner, SidebarBanners } from "@/components/portal/BannerSlot";
import { absoluteUrl } from "@/lib/site";

const columnistQuery = (slug: string) =>
  queryOptions({
    queryKey: ["columnist", slug],
    queryFn: () => getColumnistBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/_portal/colunista/$slug")({
  loader: async ({ context, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(columnistQuery(params.slug)),
      context.queryClient.ensureQueryData(bannersQuery),
    ]);
    if (!data.columnist) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const c = loaderData?.columnist;
    if (!c) {
      return {
        meta: [
          { title: "Colunista não encontrado — Blog do Gerson" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const desc =
      (c.bio || `Colunas de ${c.name} no Blog do Gerson.`).slice(0, 155);
    const canonical = absoluteUrl(`/colunista/${c.slug}`);
    return {
      meta: [
        { title: `${c.name} — ${c.specialty} | Blog do Gerson` },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.name} — ${c.specialty}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${c.name} — ${c.specialty}` },
        { name: "twitter:description", content: desc },
        ...(c.avatar_url?.startsWith("https://")
          ? [
              { property: "og:image", content: c.avatar_url },
              { name: "twitter:image", content: c.avatar_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ColumnistPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
      Não foi possível carregar o perfil. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Colunista não encontrado</h1>
      <Link
        to="/colunistas"
        className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Ver colunistas
      </Link>
    </div>
  ),
});

function ColumnistPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(columnistQuery(slug));
  const c = data.columnist;
  if (!c) return null;
  const accent = c.accent_color || "#3b82f6";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header
        className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-card"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-15 blur-3xl"
          style={{ background: accent }}
        />
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl"
            style={{ background: `${accent}18` }}
          >
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <PenLine className="h-8 w-8" style={{ color: accent }} />
            )}
          </div>
          <div className="min-w-0">
            <p
              className="font-display text-[11px] font-black uppercase tracking-[0.24em]"
              style={{ color: accent }}
            >
              {c.specialty}
            </p>
            <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">{c.name}</h1>
            {c.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {c.bio}
              </p>
            )}
            {c.link_url && (
              <a
                href={c.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold"
                style={{ color: accent }}
              >
                Link externo <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      <h2 className="mt-10 font-display text-2xl font-black">Colunas de {c.name}</h2>
      {data.columns.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não há colunas publicadas por este autor.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.columns.map((col) => (
            <Link
              key={col.id}
              to="/coluna/$slug"
              params={{ slug: col.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-float"
            >
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {col.image_url && (
                  <img
                    src={col.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-black leading-snug">{col.title}</h3>
                {col.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{col.excerpt}</p>
                )}
                <span className="mt-auto pt-3 text-xs text-muted-foreground">
                  {new Date(col.published_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
