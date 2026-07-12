import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const articleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(250),
  title: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().max(500).optional().default(""),
  content: z.string().max(200000),
  category: z.string().min(1).max(60),
  image_url: z.string().trim().max(1000).optional().nullable(),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  published_at: z.string().optional(),
});

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200).default(""),
  image_url: z.string().trim().min(1).max(1000),
  link_url: z.string().trim().max(1000).optional().nullable(),
  position: z.enum(["top", "sidebar", "inline"]),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

const videoSchema = z.object({
  id: z.string().uuid().optional(),
  section: z.string().min(1).max(60),
  title: z.string().trim().max(200).default(""),
  embed_url: z.string().trim().min(1).max(1000),
  orientation: z.enum(["horizontal", "vertical"]),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });

// First signed-in user can claim admin if no admin exists yet.
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, error: "Já existe um administrador." };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso negado");
}

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; page?: number }) =>
    z.object({ q: z.string().max(120).optional(), page: z.number().int().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const page = Math.max(1, data.page ?? 1);
    const per = 20;
    let query = context.supabase
      .from("articles")
      .select("id, slug, title, category, image_url, published_at, featured, published", { count: "exact" })
      .order("published_at", { ascending: false })
      .range((page - 1) * per, page * per - 1);
    if (data.q) query = query.ilike("title", `%${data.q.replace(/[%_]/g, " ")}%`);
    const { data: rows, count } = await query;
    return { articles: rows ?? [], total: count ?? 0, page, per };
  });

export const adminGetArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row } = await context.supabase.from("articles").select("*").eq("id", data.id).maybeSingle();
    return { article: row };
  });

export const adminSaveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => articleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const res = id
      ? await context.supabase.from("articles").update(payload).eq("id", id)
      : await context.supabase.from("articles").insert(payload);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });

export const adminListBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase.from("banners").select("*").order("position").order("sort_order");
    return { banners: rows ?? [] };
  });

export const adminSaveBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bannerSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const res = id
      ? await context.supabase.from("banners").update(fields).eq("id", id)
      : await context.supabase.from("banners").insert(fields);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("banners").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });

export const adminListVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase.from("videos").select("*").order("section").order("sort_order");
    return { videos: rows ?? [] };
  });

export const adminSaveVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => videoSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const res = id
      ? await context.supabase.from("videos").update(fields).eq("id", id)
      : await context.supabase.from("videos").insert(fields);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("videos").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });

export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    return { subscribers: rows ?? [] };
  });

export const adminDeleteSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("newsletter_subscribers").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });
