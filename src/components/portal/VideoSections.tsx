import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Video } from "@/lib/categories";
import { VIDEO_SECTIONS } from "@/lib/categories";
import { ArrowRight, PlayCircle } from "lucide-react";

function facebookVideoId(u: URL): string | null {
  const m = u.pathname.match(/\/videos\/(?:[^/]+\/)?(\d+)/);
  if (m) return m[1];
  const v = u.searchParams.get("v");
  return v && /^\d+$/.test(v) ? v : null;
}

/** URL canônica pública do vídeo no Facebook (usada no player e no link de fallback). */
function facebookWatchUrl(url: string): string {
  try {
    const u = new URL(url);
    const id = facebookVideoId(u);
    if (id) return `https://www.facebook.com/watch/?v=${id}`;
    return `https://www.facebook.com${u.pathname.replace(/\/+$/, "")}/`;
  } catch {
    return url;
  }
}

/**
 * Converte links comuns (Instagram, YouTube, Facebook) para o formato aceito em iframes.
 * Colar o link normal do post/vídeo no admin passa a funcionar.
 */
function toEmbedUrl(url: string, autoplay = false): string {
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
    if (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "web.facebook.com" ||
      host === "fb.watch" ||
      host.endsWith(".facebook.com")
    ) {
      if (u.pathname.startsWith("/plugins/video.php")) return url;
      const href = facebookWatchUrl(url);
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        href,
      )}&show_text=false&autoplay=${autoplay ? "true" : "false"}`;
    }
    return url;
  } catch {
    return url;
  }
}

function isFacebook(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "web.facebook.com" ||
      host === "fb.watch" ||
      host.endsWith(".facebook.com")
    );
  } catch {
    return false;
  }
}

export function VideoEmbed({ video, orientation }: { video: Video; orientation: string }) {
  const ratio = orientation === "vertical" ? "aspect-[9/16]" : "aspect-video";
  const facebook = isFacebook(video.embed_url);
  const [playing, setPlaying] = useState(false);

  // Facebook: mostramos uma capa com botão de play e carregamos o player
  // dentro do site somente ao clicar (mais leve e evita bloqueios de autoplay).
  if (facebook && !playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Assistir: ${video.title}`}
        className={`group relative flex w-full ${ratio} items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 via-navy to-navy shadow-card transition hover:brightness-110`}
      >
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <PlayCircle className="h-12 w-12 text-primary transition group-hover:scale-110" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-navy-foreground/80">
            Assistir vídeo
          </span>
        </div>
      </button>
    );
  }

  return (
    <div>
      <div className={`overflow-hidden rounded-2xl bg-navy shadow-card ${ratio}`}>
        <iframe
          src={toEmbedUrl(video.embed_url, facebook)}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {facebook && (
        <a
          href={facebookWatchUrl(video.embed_url)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          Abrir no Facebook
        </a>
      )}
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
          const all = active.filter((v) => v.section === section.key);
          const items = all.slice(0, 4);
          return (
            <div key={section.key}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h3 className="font-display text-lg font-black uppercase tracking-wide text-primary">
                  {section.label}
                </h3>
                {all.length > items.length && (
                  <Link
                    to="/videos/$section"
                    params={{ section: section.key }}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                  >
                    Ver tudo ({all.length}) <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
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
