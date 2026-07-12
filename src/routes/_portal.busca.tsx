import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { searchArticles } from "@/lib/portal.functions";
import { ArticleCard } from "@/components/portal/ArticleCard";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_portal/busca")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Pesquisa — Blog do Gerson" },
      { name: "description", content: "Pesquise notícias no Blog do Gerson." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const doSearch = useServerFn(searchArticles);
  const query = q.trim().slice(0, 120);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => doSearch({ data: { q: query } }),
    enabled: query.length > 0,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 border-b pb-6">
        <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-primary">
          Pesquisa
        </p>
        <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">
          {query ? `Resultados para "${query}"` : "Pesquisar notícias"}
        </h1>
      </header>

      {!query && (
        <p className="py-16 text-center text-muted-foreground">
          Use a lupa no topo da página para pesquisar.
        </p>
      )}
      {isLoading && <p className="py-16 text-center text-muted-foreground">Pesquisando...</p>}
      {query && !isLoading && (data?.articles.length ?? 0) === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          Nenhuma notícia encontrada para "{query}".
        </p>
      )}
      {data && data.articles.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
