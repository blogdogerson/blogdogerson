import type { Video } from "@/lib/categories";
import { VIDEO_SECTIONS } from "@/lib/categories";
import { PlayCircle } from "lucide-react";

function VideoEmbed({ video }: { video: Video }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-navy shadow-card ${
        video.orientation === "vertical" ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      <iframe
        src={video.embed_url}
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
    <section className="mt-14 rounded-3xl bg-navy p-6 text-navy-foreground sm:p-10">
      <div className="mb-8 flex items-center gap-3">
        <PlayCircle className="h-8 w-8 text-primary" />
        <div>
          <h2 className="font-display text-3xl font-black">Vídeos</h2>
          <p className="text-sm text-navy-foreground/60">
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
                  {items.map((v) => (
                    <div key={v.id}>
                      <VideoEmbed video={v} />
                      {v.title && (
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-navy-foreground/90">
                          {v.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
