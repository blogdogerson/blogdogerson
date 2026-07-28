import { useState } from "react";

type ArticleImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

/**
 * Keeps news cards visually complete when a migrated article has no local
 * image or when a remote image is no longer available.
 */
export function ArticleImage({ src, alt, className = "", loading = "lazy" }: ArticleImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-card to-sky-soft ${className}`}
      >
        <div className="absolute -left-12 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-sky-soft/70 blur-3xl" />
        <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6">
          <img
            src="/img/logo-blog-do-gerson-branco.png"
            alt=""
            className="h-auto w-[62%] max-w-sm object-contain opacity-95 drop-shadow-lg"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-foreground/65">
            Portal de notícias
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
