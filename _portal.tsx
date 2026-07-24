// Os tópicos/categorias do site agora são dinâmicos (tabela `categories` no Supabase,
// gerenciados pelo painel administrativo). Este arquivo mantém apenas helpers puros
// (não dependem mais de uma lista fixa) e os tipos compartilhados.

export type Category = string;

export function categoryToSlug(cat: string): string {
  return cat
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function slugToCategory(
  slug: string,
  topics: readonly { name: string }[],
): string | null {
  return topics.find((t) => categoryToSlug(t.name) === slug)?.name ?? null;
}

export const VIDEO_SECTIONS = [
  { key: "podcast-cafezinho", label: "Podcast Cafezinho", orientation: "horizontal" },
  { key: "gramado-visao-de-futuro", label: "Gramado Visão de Futuro", orientation: "vertical" },
  { key: "tv-gramado-news", label: "TV Gramado News", orientation: "vertical" },
  { key: "fica-a-dica", label: "Fica a Dica", orientation: "vertical" },
  { key: "opiniao", label: "Opinião", orientation: "vertical" },
] as const;

export const RADIO_STREAM_URL = "https://stream01.ouveai.com.br:1092/stream";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string;
  featured: boolean;
  published: boolean;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  active: boolean;
  sort_order: number;
}

export interface Video {
  id: string;
  section: string;
  title: string;
  embed_url: string;
  orientation: string;
  active: boolean;
  sort_order: number;
}

export interface Topic {
  id: string;
  name: string;
  sort_order: number;
}
