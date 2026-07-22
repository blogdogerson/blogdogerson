import { Link } from "@tanstack/react-router";
import type { Banner } from "@/lib/categories";

const TOTAL_SLOTS = 4;

export function SponsorsBand({ banners }: { banners: Banner[] }) {
  const items = banners
    .filter((b) => b.active && b.position === "sponsor")
    .slice(0, TOTAL_SLOTS);
  const placeholders = Math.max(0, TOTAL_SLOTS - items.length);

  return (
    <section className="mt-14 sm:mt-20">
      <p className="mb-4 text-center font-display text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">
        Publicidade
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((b) => {
          const inner = (
            <div className="group relative aspect-square overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-float hover:ring-primary/40">
              <img
                src={b.image_url}
                alt={b.title || "Patrocinador"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
                  Publicidade
                </p>
                {b.title && (
                  <p className="line-clamp-1 font-display text-sm font-bold text-white">
                    {b.title}
                  </p>
                )}
              </div>
            </div>
          );
          return b.link_url ? (
            <a
              key={b.id}
              href={b.link_url}
              target="_blank"
              rel="noreferrer sponsored"
              className="block"
            >
              {inner}
            </a>
          ) : (
            <div key={b.id}>{inner}</div>
          );
        })}

        {Array.from({ length: placeholders }).map((_, i) => (
          <Link
            key={`ph-${i}`}
            to="/anuncie"
            className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/25 bg-sky-soft text-center transition-colors hover:border-primary/60 hover:bg-sky-soft/80"
          >
            <span className="font-display text-sm font-black uppercase tracking-widest text-primary/70 group-hover:text-primary">
              Anuncie aqui
            </span>
            <span className="px-3 text-xs text-muted-foreground">
              gerson@blogdogerson.com.br
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
