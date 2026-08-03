/** Endereço público canônico do portal (usado em compartilhamento e SEO). */
export const SITE_URL = "https://blogdogerson.com.br";
export const SITE_NAME = "Blog do Gerson";
export const DEFAULT_DESCRIPTION =
  "Portal de notícias de Gramado, Canela, Nova Petrópolis e Região da Serra Gaúcha. Jornalismo sério desde 2005, por Gerson Sorgetz.";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/img/og-blog-do-gerson.jpg`;
export const PUBLISHER_LOGO = `${SITE_URL}/img/logo-blog-do-gerson-branco.png`;

/** Monta uma URL absoluta a partir de um caminho relativo (/noticia/slug). */
export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Escapa conteúdo dinâmico antes de inseri-lo em XML (sitemaps e RSS). */
export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
