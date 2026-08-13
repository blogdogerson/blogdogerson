import { queryOptions } from "@tanstack/react-query";
import { getBanners } from "@/lib/portal.functions";

export const bannersQuery = queryOptions({
  queryKey: ["banners"],
  queryFn: () => getBanners(),
  staleTime: 60_000,
});
