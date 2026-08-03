import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { resolveLegacyArticle } from "@/lib/portal.functions";

export const Route = createFileRoute("/_portal/$year/$month/$day/$slug")({
  loader: async ({ params }) => {
    const result = await resolveLegacyArticle({ data: params });
    if (!result.slug) throw notFound();
    throw redirect({ href: `/noticia/${result.slug}`, statusCode: 301 });
  },
  component: () => null,
});
