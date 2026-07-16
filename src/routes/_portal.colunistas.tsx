import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getColumnists } from "@/lib/columnists.functions";
import { ColumnistsSection } from "@/components/portal/ColumnistsSection";

const columnistsQuery = queryOptions({
  queryKey: ["columnists"],
  queryFn: () => getColumnists(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/_portal/colunistas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(columnistsQuery),
  head: () => ({
    meta: [
      { title: "Colunistas — Blog do Gerson" },
      {
        name: "description",
        content:
          "Colunistas do Blog do Gerson: opinião, coluna social e vozes que assinam a Serra Gaúcha.",
      },
      { property: "og:title", content: "Colunistas — Blog do Gerson" },
      { property: "og:description", content: "Vozes que assinam a Serra Gaúcha." },
      { property: "og:url", content: "/colunistas" },
    ],
    links: [{ rel: "canonical", href: "/colunistas" }],
  }),
  component: ColumnistsPage,
});

function ColumnistsPage() {
  const { data } = useSuspenseQuery(columnistsQuery);
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4">
      <ColumnistsSection columnists={data.columnists} />
    </div>
  );
}
