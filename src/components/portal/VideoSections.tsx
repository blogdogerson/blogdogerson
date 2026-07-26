import type { Video } from "@/lib/categories";
import { VIDEO_SECTIONS } from "@/lib/categories";
import { PlayCircle } from "lucide-react";

/**
 * Converte links comuns (Instagram, YouTube) para o formato aceito em iframes.
 * Colar o link normal do post/vídeo no admin passa a funcionar.
 */
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      const path = u.pathname.replace(/\/+$/, "");
      return path.endsWith("/embed") ? url : `https://www.instagram.com${path}/embed`;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/shorts/"))
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      return url;
    }
    if (host === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    return url;
  } catch {
    return url;
  }
}

function VideoEmbed({ video, orientation }: { video: Video; orientation: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-navy shadow-card ${
        orientation === "vertical" ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      <iframe
        src={toEmbedUrl(video.embed_url)}
        title={video.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

export function VideoSections({ videos }: { videos: Video[] }) {
  const active = videos.filter((v) => v.active);

  return (
    <section id="videos" className="mt-14 scroll-mt-40 rounded-3xl bg-navy p-6 text-navy-foreground sm:p-10">
      <div className="mb-8 flex items-center gap-3">
        <PlayCircle className="h-8 w-8 text-primary" />
        <div>
          <h2 className="font-display text-3xl font-black">Vídeos</h2>
          <p className="text-sm text-navy-foreground/75">
            Podcast Cafezinho, TV Gramado News, entrevistas e muito mais.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {VIDEO_SECTIONS.map((section) => {
          const items = active.filter((v) => v.section === section.key).slice(0, 4);
          return (
            <div key={section.key}>
              <h3 className="mb-4 font-display text-lg font-black uppercase tracking-wide text-primary">
                {section.label}
              </h3>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-navy-foreground/20 p-6 text-center text-sm text-navy-foreground/50">
                  Em breve novos vídeos de {section.label}.
                </p>
              ) : (
                <div
                  className={`grid gap-4 ${
                    section.orientation === "horizontal"
                      ? "sm:grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {items.map((v, idx) => {
                    const auto = section.key === "gramado-visao-de-futuro";
                    const epNumber =
                      v.episode_number?.trim() ||
                      (auto ? String(items.length - idx).padStart(2, "0") : "");

                    return (
                      <div key={v.id}>
                        {/* Orientação vem da seção: Cafezinho sempre horizontal (YouTube),
                            demais seções sempre verticais — evita formatos misturados */}
                        <VideoEmbed video={v} orientation={section.orientation} />
                        {epNumber && (
                          <p className="mt-2 font-display text-xs font-black uppercase tracking-[0.2em] text-primary">
                            Episódio {epNumber}
                          </p>
                        )}
                        {v.title && (
                          <p className={`${epNumber ? "mt-1" : "mt-2"} line-clamp-2 text-sm font-semibold text-navy-foreground/90`}>
                            {v.title}
                          </p>
                        )}
                        {v.description && (
                          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-navy-foreground/65">
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
        })}
      </div>
    </section>
  );
}
