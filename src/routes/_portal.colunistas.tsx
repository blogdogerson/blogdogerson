import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getColumnists } from "@/lib/columnists.functions";
import { getLatestColumns } from "@/lib/columns.functions";
import { ColumnistsSection } from "@/components/portal/ColumnistsSection";
import { LatestColumns } from "@/components/portal/LatestColumns";
import { TopBannerCarousel, InlineBanner, SquareBannerStack } from "@/components/portal/BannerSlot";
import { bannersQuery } from "@/lib/banners.query";
import { absoluteUrl } from "@/lib/site";

const columnistsQuery = queryOptions({
  queryKey: ["columnists"],
  queryFn: () => getColumnists(),
  staleTime: 60_000,
});

const latestColumnsQuery = queryOptions({
  queryKey: ["latest-columns"],
  queryFn: () => getLatestColumns(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/_portal/colunistas")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(columnistsQuery),
      context.queryClient.ensureQueryData(latestColumnsQuery),
      context.queryClient.ensureQueryData(bannersQuery),
    ]),
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
      { property: "og:url", content: absoluteUrl("/colunistas") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/colunistas") }],
  }),
  component: ColumnistsPage,
});

function ColumnistsPage() {
  const { data } = useSuspenseQuery(columnistsQuery);
  const { data: latest } = useSuspenseQuery(latestColumnsQuery);
  const { data: bannersData } = useSuspenseQuery(bannersQuery);
  const banners = bannersData.banners;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4">
      <TopBannerCarousel banners={banners} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <LatestColumns columns={latest.columns} />
          <div className="mt-10">
            <InlineBanner banners={banners} />
          </div>
          <ColumnistsSection columnists={data.columnists} />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SquareBannerStack banners={banners} max={3} />
        </aside>
      </div>
    </div>
  );
}
