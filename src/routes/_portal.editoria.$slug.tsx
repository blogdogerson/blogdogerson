import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getCategoryArticles } from "@/lib/portal.functions";
import { ArticleCard } from "@/components/portal/ArticleCard";
import { slugToCategory } from "@/lib/categories";

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
});

const categoryQuery = (category: string, page: number) =>
  queryOptions({
    queryKey: ["category", category, page],
    queryFn: () => getCategoryArticles({ data: { category, page } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/_portal/editoria/$slug")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, params, deps }) => {
    const category = slugToCategory(params.slug);
    if (!category) throw notFound();
    await context.queryClient.ensureQueryData(categoryQuery(category, deps.page));
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category ?? "Editoria"} — Blog do Gerson` },
      {
        name: "description",
        content: `Notícias de ${loaderData?.category ?? "nossa região"} no Blog do Gerson.`,
      },
      { property: "og:title", content: `${loaderData?.category ?? "Editoria"} — Blog do Gerson` },
    ],
  }),
  component: CategoryPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="px-4 py-20 text-center text-muted-foreground">
      Erro ao carregar a editoria. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Editoria não encontrada</h1>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { page } = Route.useSearch();
  const category = slugToCategory(slug)!;
  const safePage = Math.max(1, Math.min(200, page));
  const { data } = useSuspenseQuery(categoryQuery(category, safePage));
  const totalPages = Math.max(1, Math.ceil(data.total / data.per));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 border-b pb-6">
        <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-primary">
          Editoria
        </p>
        <h1 className="mt-1 font-display text-4xl font-black sm:text-5xl">{category}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.total} notícias publicadas</p>
      </header>

      {data.articles.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Ainda não há notícias nesta editoria.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {safePage > 1 && (
            <Link
              from={Route.fullPath}
              search={(prev) => ({ ...prev, page: safePage - 1 })}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              ← Anterior
            </Link>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Página {safePage} de {totalPages}
          </span>
          {safePage < totalPages && (
            <Link
              from={Route.fullPath}
              search={(prev) => ({ ...prev, page: safePage + 1 })}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
