import { Link } from "@tanstack/react-router";
import { ArrowRight, PenLine } from "lucide-react";
import type { Columnist } from "@/lib/columnists.functions";

export function ColumnistsSection({ columnists }: { columnists: Columnist[] }) {
  if (columnists.length === 0) return null;

  return (
    <section className="mt-14 sm:mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            COLUNISTAS
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Opinião, Social, Política, Economia.
          </p>
        </div>
        <Link
          to="/colunistas"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
        >
          Todos os colunistas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {columnists.slice(0, 6).map((c, i) => (
          <ColumnistCard key={c.id} columnist={c} featured={i === 0} />
        ))}
      </div>
    </section>
  );
}

function ColumnistCard({ columnist, featured }: { columnist: Columnist; featured?: boolean }) {
  const accent = columnist.accent_color || "#3b82f6";
  const inner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float ${
        featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""
      }`}
      style={{ borderColor: `${accent}22` }}
    >
      {/* Accent ribbon */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }}
      />
      {/* Corner glyph */}
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: accent }}
      />

      <header className="flex items-center gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl ring-2 shadow-sm"
          style={{ background: `${accent}18`, boxShadow: `0 6px 24px -12px ${accent}` }}
        >
          {columnist.avatar_url ? (
            <img
              src={columnist.avatar_url}
              alt={columnist.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <PenLine className="h-6 w-6" style={{ color: accent }} />
          )}
        </div>
        <div className="min-w-0">
          <p
            className="font-display text-[11px] font-black uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {columnist.specialty}
          </p>
          <h3 className="mt-0.5 truncate font-display text-lg font-black">{columnist.name}</h3>
        </div>
      </header>

      {columnist.bio && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {columnist.bio}
        </p>
      )}

      {(columnist.latest_title || columnist.latest_excerpt) && (
        <div
          className="mt-5 rounded-2xl border-l-4 bg-sky-soft/60 p-4"
          style={{ borderLeftColor: accent }}
        >
          <p className="font-display text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Última coluna
          </p>
          {columnist.latest_title && (
            <p className="mt-1 font-display text-base font-black leading-snug text-foreground">
              {columnist.latest_title}
            </p>
          )}
          {columnist.latest_excerpt && (
            <p className="mt-1 text-sm text-foreground/70 line-clamp-2">
              {columnist.latest_excerpt}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <span
          className="inline-flex items-center gap-1.5 text-sm font-bold transition-transform duration-200 group-hover:translate-x-1"
          style={{ color: accent }}
        >
          Ler coluna <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );

  if (columnist.link_url) {
    return (
      <a href={columnist.link_url} target="_blank" rel="noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return (
    <Link to="/colunistas" className="block h-full">
      {inner}
    </Link>
  );
}
