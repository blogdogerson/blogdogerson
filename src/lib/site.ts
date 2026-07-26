/** Endereço público canônico do portal (usado em compartilhamento e SEO). */
export const SITE_URL = "https://blogdogerson.lovable.app";


/** Monta uma URL absoluta a partir de um caminho relativo (/noticia/slug). */
export function absoluteUrl(path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${clean}`;
  return `${SITE_URL}${clean}`;
}

/** Resumo curto para meta tags e compartilhamento (usa o excerpt ou o início do texto). */
export function summarize(excerpt?: string | null, content?: string | null, fallback = "") {
  const base =
    (excerpt ?? "").trim() ||
    (content ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim() ||
    fallback;
  return base.length > 200 ? `${base.slice(0, 197).trimEnd()}...` : base;
}
