/**
 * Prepara o conteúdo (coluna/notícia) para exibição.
 *
 * - Se o texto já tem tags de bloco (<p>, <h2>, <blockquote>...), usa como está.
 * - Se é texto simples (colado direto no admin), converte quebras de linha
 *   duplas em parágrafos e quebras simples em <br>, preservando tags inline
 *   como <strong>, <em> e <img> que o autor tenha usado no meio do texto.
 */
const BLOCK_TAG = /<\s*(p|div|h[1-6]|ul|ol|li|blockquote|figure|table|section|article|br)\b/i;

export function toDisplayHtml(content: string): string {
  if (!content) return "";
  if (BLOCK_TAG.test(content)) return content;
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\r?\n/g, "<br />")}</p>`)
    .join("\n");
}
