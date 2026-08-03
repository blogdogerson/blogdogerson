import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getVideosBySection } from "@/lib/portal.functions";
import { VIDEO_SECTIONS } from "@/lib/categories";
import { VideoEmbed } from "@/components/portal/VideoSections";
import { absoluteUrl } from "@/lib/site";

const sectionQuery = (section: string) =>
  queryOptions({
    queryKey: ["videos", section],
    queryFn: () => getVideosBySection({ data: { section } }),
    staleTime: 60_000,
  });

function meta(section: string) {
  return VIDEO_SECTIONS.find((s) => s.key === section);
}

export const Route = createFileRoute("/_portal/videos/$section")({
  loader: async ({ context, params }) => {
    if (!meta(params.section)) throw notFound();
    return context.queryClient.ensureQueryData(sectionQuery(params.section));
  },
  head: ({ params }) => {
    const label = meta(params.section)?.label ?? "Vídeos";
    const canonical = absoluteUrl(`/videos/${params.section}`);
    return {
      meta: [
        { title: `${label} — Vídeos | Blog do Gerson` },
        {
          name: "description",
          content: `Todos os vídeos de ${label} no Blog do Gerson: episódios completos, entrevistas e conteúdos da Serra Gaúcha.`,
        },
        { property: "og:title", content: `${label} — Vídeos | Blog do Gerson` },
        {
          property: "og:description",
          content: `Assista a todos os episódios de ${label} no Blog do Gerson.`,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: VideosSectionPage,
  notFoundComponent: () => (
    <div className="px-4 py-20 text-center text-muted-foreground">
      Seção de vídeos não encontrada.
    </div>
  ),
});

function VideosSectionPage() {
  const { section } = Route.useParams();
  const { data } = useSuspenseQuery(sectionQuery(section));
  const info = meta(section);
  const videos = data.videos;
  const orientation = info?.orientation ?? "vertical";

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a home
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
        {info?.label ?? "Vídeos"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {videos.length} {videos.length === 1 ? "vídeo publicado" : "vídeos publicados"}.
      </p>

      {videos.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhum vídeo publicado nesta seção ainda.
        </p>
      ) : (
        <div
          className={`mt-8 grid gap-5 ${
            orientation === "horizontal"
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          }`}
        >
          {videos.map((v, idx) => {
            const auto = section === "gramado-visao-de-futuro";
            const epNumber =
              v.episode_number?.trim() ||
              (auto ? String(videos.length - idx).padStart(2, "0") : "");
            return (
              <div key={v.id}>
                <VideoEmbed video={v} orientation={orientation} />
                {epNumber && (
                  <p className="mt-2 font-display text-xs font-black uppercase tracking-[0.2em] text-primary">
                    Episódio {epNumber}
                  </p>
                )}
                {v.title && (
                  <p className={`${epNumber ? "mt-1" : "mt-2"} line-clamp-2 text-sm font-semibold`}>
                    {v.title}
                  </p>
                )}
                {v.description && (
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
