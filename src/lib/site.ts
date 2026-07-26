/** Endereço público canônico do portal (usado em compartilhamento e SEO). */
export const SITE_URL = "https://blogdogerson.com.br";

/** Monta uma URL absoluta a partir de um caminho relativo (/noticia/slug). */
export function absoluteUrl(path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${clean}`;
  return `${SITE_URL}${clean}`;
}
