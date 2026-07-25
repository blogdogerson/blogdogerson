import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Article, Banner, Video } from "./categories";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const LIST_FIELDS = "id, slug, title, excerpt, category, categories, image_url, published_at, featured, published";

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [articlesRes, bannersRes, videosRes] = await Promise.all([
    supabase
      .from("articles")
      .select(LIST_FIELDS)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(36),
    supabase.from("banners").select("*").eq("active", true).order("sort_order"),
    supabase.from("videos").select("*").eq("active", true).order("sort_order"),
  ]);
  return {
    articles: (articlesRes.data ?? []) as unknown as Article[],
    banners: (bannersRes.data ?? []) as unknown as Banner[],
    videos: (videosRes.data ?? []) as unknown as Video[],
  };
});

export const getArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(250) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!article) return { article: null, related: [] as Article[], banners: [] as Banner[] };
    const [relatedRes, bannersRes] = await Promise.all([
      supabase
        .from("articles")
        .select(LIST_FIELDS)
        .eq("published", true)
        .eq("category", article.category)
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(4),
      supabase.from("banners").select("*").eq("active", true).order("sort_order"),
    ]);
    return {
      article: article as unknown as Article,
      related: (relatedRes.data ?? []) as unknown as Article[],
      banners: (bannersRes.data ?? []) as unknown as Banner[],
    };
  });

export const getCategoryArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { category: string; page?: number }) =>
    z.object({ category: z.string().min(1).max(60), page: z.number().int().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const page = Math.max(1, Math.min(200, data.page ?? 1));
    const per = 18;
    const from = (page - 1) * per;
    const { data: rows, count } = await supabase
      .from("articles")
      .select(LIST_FIELDS, { count: "exact" })
      .eq("published", true)
      .eq("category", data.category)
      .order("published_at", { ascending: false })
      .range(from, from + per - 1);
    return { articles: (rows ?? []) as unknown as Article[], total: count ?? 0, page, per };
  });

export const searchArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const q = data.q.replace(/[%_]/g, " ").trim();
    const { data: rows } = await supabase
      .from("articles")
      .select(LIST_FIELDS)
      .eq("published", true)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(40);
    return { articles: (rows ?? []) as unknown as Article[] };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; name?: string }) =>
    z
      .object({
        email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
        name: z.string().trim().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: data.email.toLowerCase(), name: data.name || null });
    if (error) {
      if (error.code === "23505") return { ok: true, duplicate: true };
      return { ok: false, error: "Não foi possível cadastrar. Tente novamente." };
    }
    return { ok: true, duplicate: false };
  });
