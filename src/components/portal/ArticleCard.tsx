import { Link } from "@tanstack/react-router";
import type { Article } from "@/lib/categories";
import { categoryToSlug } from "@/lib/categories";
import { ArticleImage } from "./ArticleImage";

export function formatExactDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/** Relative time for recent news ("há 2 horas"), exact date otherwise. */
export function formatDate(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin >= 0 && diffMin < 60) return diffMin <= 1 ? "agora mesmo" : `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH >= 1 && diffH < 24) return `há ${diffH} hora${diffH > 1 ? "s" : ""}`;
  return formatExactDate(iso);
}

export function CategoryTag({
  category,
  light,
  asLink,
}: {
  category: string;
  light?: boolean;
  asLink?: boolean;
}) {
  const cls = `inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
    light
      ? "bg-card/90 text-primary hover:bg-card"
      : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
  }`;
  if (asLink) {
    return (
      <Link to="/editoria/$slug" params={{ slug: categoryToSlug(category) }} className={cls}>
        {category}
      </Link>
    );
  }
  return <span className={cls}>{category}</span>;
}

export function HeroCard({ article }: { article: Article }) {
  return (
    <Link
      to="/noticia/$slug"
      params={{ slug: article.slug }}
      className="group relative block overflow-hidden rounded-3xl shadow-card hover-lift"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[16/9]">
        <ArticleImage
          src={article.image_url}
          alt={article.title}
          loading="eager"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <CategoryTag category={article.category} light />
        <h2 className="mt-3 font-display text-2xl font-black leading-tight text-navy-foreground sm:text-4xl">
          {article.title}
        </h2>
        <p className="mt-2 hidden max-w-2xl text-sm text-navy-foreground/80 sm:block">
          {article.excerpt}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-navy-foreground/75">
          {formatDate(article.published_at)}
        </p>
      </div>
    </Link>
  );
}

export function ArticleCard({ article, compact }: { article: Article; compact?: boolean }) {
  return (
    <Link
      to="/noticia/$slug"
      params={{ slug: article.slug }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-card hover-lift"
    >
      <div
        className={`${compact ? "aspect-[16/9]" : "aspect-[16/10]"} w-full overflow-hidden bg-muted`}
      >
        <ArticleImage
          src={article.image_url}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <CategoryTag category={article.category} />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {formatDate(article.published_at)}
          </span>
        </div>
        <h3
          className={`mt-2 font-display font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {article.title}
        </h3>
        {!compact && article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
}

export function ListRow({ article }: { article: Article }) {
  return (
    <Link
      to="/noticia/$slug"
      params={{ slug: article.slug }}
      className="group flex gap-4 rounded-xl p-2 transition-colors hover:bg-secondary"
    >
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
        <ArticleImage
          src={article.image_url}
          alt={article.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
          {article.category}
        </span>
        <h4 className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug text-foreground group-hover:text-primary">
          {article.title}
        </h4>
        <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(article.published_at)}</p>
      </div>
    </Link>
  );
}
