export const CATEGORIES = [
  "Geral",
  "Gramado",
  "Canela",
  "Nova Petrópolis",
  "Região",
  "Política",
  "Polícia",
  "Câmara de Vereadores",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function categoryToSlug(cat: string): string {
  return cat
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function slugToCategory(slug: string): Category | null {
  return (CATEGORIES.find((c) => categoryToSlug(c) === slug) as Category) ?? null;
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
  categories?: string[] | null;
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
