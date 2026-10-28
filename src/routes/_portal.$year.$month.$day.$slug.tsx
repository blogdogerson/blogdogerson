import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { resolveLegacyArticle } from "@/lib/portal.functions";

// Old links whose original article was lost — point to the closest existing story.
const MANUAL_REDIRECTS: Record<string, string> = {
  "residence-club-at-hard-rock-hotel-gramado-apoia-semana-da-mulher-promovida-pelo-gabinete-da-primeira-dama":
    "pelo-segundo-ano-consecutivo-residence-club-hard-rock-hotel-gramado-apoia-a-semana-da-mulher-promovida-pelo-gabinete-da-primeira-dama-de-gramado",
};

export const Route = createFileRoute("/_portal/$year/$month/$day/$slug")({
  loader: async ({ params }) => {
    const manual = MANUAL_REDIRECTS[params.slug];
    if (manual) throw redirect({ href: `/noticia/${manual}`, statusCode: 301 });
    const result = await resolveLegacyArticle({ data: params });
    if (!result.slug) throw notFound();
    throw redirect({ href: `/noticia/${result.slug}`, statusCode: 301 });
  },
  component: () => null,
});
