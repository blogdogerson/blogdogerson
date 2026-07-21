import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ColumnPostWithAuthor } from "@/lib/columns.functions";

export function LatestColumns({ columns }: { columns: ColumnPostWithAuthor[] }) {
  if (columns.length === 0) return null;
  const [featured, ...rest] = columns.slice(0, 5);

  return (
    <section className="mt-14 sm:mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Do teclado dos colunistas
          </p>
          <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            Últimas colunas
          </h2>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ColumnCardBig column={featured} />
        <div className="grid content-start gap-3">
          {rest.map((c) => (
            <ColumnCardSmall key={c.id} column={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ColumnCardBig({ column }: { column: ColumnPostWithAuthor }) {
  const accent = column.columnist?.accent_color ?? "#3b82f6";
  return (
    <Link
      to="/coluna/$slug"
      params={{ slug: column.slug }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-float"
    >
      {column.image_url ? (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={column.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className="aspect-[16/9]"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}05)` }}
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          {column.columnist?.avatar_url && (
            <img
              src={column.columnist.avatar_url}
              alt={column.columnist.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: accent }}
            >
              {column.columnist?.specialty ?? "Coluna"}
            </p>
            <p className="font-display text-sm font-black">
              {column.columnist?.name ?? "Colunista"}
            </p>
          </div>
        </div>
        <h3 className="mt-4 font-display text-2xl font-black leading-tight">{column.title}</h3>
        {column.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {column.excerpt}
          </p>
        )}
        <span
          className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-bold"
          style={{ color: accent }}
        >
          Ler coluna <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function ColumnCardSmall({ column }: { column: ColumnPostWithAuthor }) {
  const accent = column.columnist?.accent_color ?? "#3b82f6";
  return (
    <Link
      to="/coluna/$slug"
      params={{ slug: column.slug }}
      className="group flex gap-4 rounded-2xl bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float"
    >
      <div
        className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        {column.image_url && (
          <img src={column.image_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: accent }}
        >
          {column.columnist?.name ?? "Coluna"}
        </p>
        <p className="mt-0.5 line-clamp-2 font-display text-sm font-black">{column.title}</p>
      </div>
    </Link>
  );
}
