import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Article, Banner, Video } from "./categories";
import { CATEGORIES, categoryToSlug } from "./categories";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const LIST_FIELDS =
  "id, slug, title, excerpt, category, categories, image_url, published_at, featured, published";

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [articlesRes, bannersRes, videosRes] = await Promise.all([
    supabase
      .from("articles")
      .select(LIST_FIELDS)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(120),
    supabase.from("banners").select("*").eq("active", true).order("sort_order"),
    supabase
      .from("videos")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
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
    const cats = article.categories?.length ? article.categories : [article.category];
    const [relatedRes, bannersRes] = await Promise.all([
      supabase
        .from("articles")
        .select(LIST_FIELDS)
        .eq("published", true)
        .overlaps("categories", cats)
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

export const getEditoria = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; page?: number }) =>
    z.object({ slug: z.string().min(1).max(80), page: z.number().int().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const page = Math.max(1, Math.min(200, data.page ?? 1));
    const per = 18;
    const from = (page - 1) * per;

    const { data: topics } = await supabase.from("topics").select("name, slug").eq("active", true);

    const list = (topics ?? []) as { name: string; slug: string }[];
    const topic = list.find((t) => t.slug === data.slug || categoryToSlug(t.name) === data.slug);

    const aliasSlugs = new Set<string>([data.slug]);
    if (topic) {
      aliasSlugs.add(topic.slug);
      aliasSlugs.add(categoryToSlug(topic.name));
    }

    const names = Array.from(
      new Set(
        [...CATEGORIES, ...list.map((t) => t.name)].filter((n) =>
          aliasSlugs.has(categoryToSlug(n)),
        ),
      ),
    );
    if (topic) names.push(topic.name);
    const uniqueNames = Array.from(new Set(names));

    if (uniqueNames.length === 0) {
      return { category: null as string | null, articles: [] as Article[], total: 0, page, per };
    }

    const { data: rows, count } = await supabase
      .from("articles")
      .select(LIST_FIELDS, { count: "exact" })
      .eq("published", true)
      .overlaps("categories", uniqueNames)
      .order("published_at", { ascending: false })
      .range(from, from + per - 1);

    return {
      category: topic?.name ?? uniqueNames[0],
      articles: (rows ?? []) as unknown as Article[],
      total: count ?? 0,
      page,
      per,
    };
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

export const getVideosBySection = createServerFn({ method: "GET" })
  .inputValidator((d: { section: string }) =>
    z.object({ section: z.string().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows } = await supabase
      .from("videos")
      .select("*")
      .eq("active", true)
      .eq("section", data.section)
      .order("sort_order")
      .order("created_at", { ascending: false });
    return { videos: (rows ?? []) as unknown as Video[] };
  });

export const resolveLegacyArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { year: string; month: string; day: string; slug: string }) =>
    z
      .object({
        year: z.string().regex(/^(19|20)\d{2}$/),
        month: z.string().regex(/^(0[1-9]|1[0-2])$/),
        day: z.string().regex(/^(0[1-9]|[12]\d|3[01])$/),
        slug: z
          .string()
          .min(1)
          .max(250)
          .regex(/^[a-z0-9-]+$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const targetDate = `${data.year}-${data.month}-${data.day}`;
    const center = Date.parse(`${targetDate}T12:00:00.000Z`);
    if (!Number.isFinite(center)) return { slug: null as string | null };

    const supabase = publicClient();
    const { data: candidates } = await supabase
      .from("articles")
      .select("slug, published_at")
      .eq("published", true)
      .ilike("slug", `${data.slug}%`)
      .gte("published_at", new Date(center - 36 * 60 * 60 * 1000).toISOString())
      .lte("published_at", new Date(center + 36 * 60 * 60 * 1000).toISOString())
      .limit(20);

    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const sameDay = (candidates ?? []).filter(
      (row) => localDate.format(new Date(row.published_at)) === targetDate,
    );
    const exact = sameDay.find((row) => row.slug === data.slug);
    const suffixed = sameDay.find((row) => new RegExp(`^${data.slug}-\\d+$`).test(row.slug));
    return { slug: exact?.slug ?? suffixed?.slug ?? null };
  });
