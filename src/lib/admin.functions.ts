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
  categories: z.array(z.string().min(1).max(60)).max(20).optional().default([]),
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
  position: z.enum(["top", "sidebar", "inline", "sponsor"]),
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
  episode_number: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
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
    const cats = Array.from(new Set([...(fields.categories ?? []), fields.category].filter(Boolean)));
    const payload = { ...fields, categories: cats, updated_at: new Date().toISOString() };
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

// Tópicos/editorias agora vivem em `src/lib/topics.functions.ts` com a tabela `topics`.


// ---------------------------------------------------------------------------
// Vincular login de colunista (conta criada em /auth) a um colunista
// ---------------------------------------------------------------------------

export const adminLinkColumnistUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { columnistId: string; email: string }) =>
    z
      .object({
        columnistId: z.string().uuid(),
        email: z.string().trim().email().max(255),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page += 1) {
      const { data: usersPage, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { ok: false, error: error.message };
      const match = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) userId = match.id;
      if (usersPage.users.length < 200) break;
    }

    if (!userId) {
      return {
        ok: false,
        error:
          'Não encontrei nenhuma conta com esse e-mail. Peça para o colunista entrar em /auth e clicar em "Primeira vez? Criar conta" — depois tente vincular de novo.',
      };
    }

    const { error } = await (supabaseAdmin.from("columnists") as any).update({ user_id: userId }).eq("id", data.columnistId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const adminUnlinkColumnistUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { columnistId: string }) => z.object({ columnistId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("columnists") as any).update({ user_id: null }).eq("id", data.columnistId);
    return { ok: !error, error: error?.message };
  });

// Cria uma conta de login (e-mail + senha) para um colunista e já vincula ao cadastro.
// Se o e-mail já existir como usuário, atualiza a senha e vincula.
export const adminCreateColumnistLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { columnistId: string; email: string; password: string }) =>
    z
      .object({
        columnistId: z.string().uuid(),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    let userId: string | null = null;
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      for (let page = 1; page <= 20 && !userId; page += 1) {
        const { data: usersPage, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) return { ok: false, error: error.message };
        const match = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === email);
        if (match) userId = match.id;
        if (usersPage.users.length < 200) break;
      }
      if (!userId) return { ok: false, error: created.error?.message ?? "Não foi possível criar o login." };
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password, email_confirm: true });
    }

    const { error: linkErr } = await (supabaseAdmin.from("columnists") as any)
      .update({ user_id: userId })
      .eq("id", data.columnistId);
    if (linkErr) return { ok: false, error: linkErr.message };
    return { ok: true as const, email };
  });

// ---------------------------------------------------------------------------
// Importação de notícias do site original (WordPress) — blogdogerson.com.br
// ---------------------------------------------------------------------------

const WP_API = "https://blogdogerson.com.br/wp-json/wp/v2";

// Categorias do WordPress → editorias do portal novo.
// "Geral" não existe mais como editoria própria — tudo que caía nela agora
// vai para "Região" (mesma regra usada para as notícias antigas já publicadas).
const WP_CATEGORY_MAP: Record<string, string> = {
  Geral: "Região",
  "Política": "Política",
  Cidade: "Gramado",
  Economia: "Região",
  "Região": "Região",
  "Polícia": "Polícia",
  "Prefeitura de Gramado": "Gramado",
  "Prefeitura de Canela": "Canela",
  "Câmara de Vereadores": "Câmara de Vereadores",
  "Nova Petrópolis": "Nova Petrópolis",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

function cleanExcerpt(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\[…\]|\[&hellip;\]|…\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
}

export const adminImportWordPress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { page?: number; months?: number }) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        months: z.number().int().min(1).max(24).default(6),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const after = new Date();
    after.setMonth(after.getMonth() - data.months);
    const per = 10;

    // Mapa id→nome das categorias do WordPress
    const catRes = await fetch(`${WP_API}/categories?per_page=100&_fields=id,name`);
    if (!catRes.ok) return { ok: false as const, error: "Não consegui acessar o site original." };
    const cats = (await catRes.json()) as Array<{ id: number; name: string }>;
    const catName = new Map(cats.map((c) => [c.id, decodeEntities(c.name)]));

    const url =
      `${WP_API}/posts?per_page=${per}&page=${data.page}` +
      `&after=${after.toISOString()}&_embed=wp:featuredmedia&orderby=date&order=desc`;
    const res = await fetch(url);
    if (res.status === 400) {
      // Página além do total — importação concluída
      return { ok: true as const, imported: 0, skipped: 0, done: true, totalPages: data.page - 1, total: 0 };
    }
    if (!res.ok) return { ok: false as const, error: `Erro ${res.status} ao buscar as notícias.` };

    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    const total = Number(res.headers.get("x-wp-total") ?? "0");
    const posts = (await res.json()) as any[];

    const rows = posts.map((p) => {
      const wpCats: string[] = (p.categories ?? [])
        .map((id: number) => catName.get(id))
        .filter(Boolean);
      // Prioriza a categoria mais específica (cidade/editoria) sobre "Região":
      // muitos posts do WordPress trazem "Geral"/"Economia" como primeira
      // categoria mesmo sendo, na prática, de Gramado/Canela/etc. — só cai em
      // Região se nenhuma categoria mais específica for encontrada.
      const mapped = wpCats.map((n) => WP_CATEGORY_MAP[n as string]).filter(Boolean) as string[];
      const category = mapped.find((c) => c !== "Região") ?? mapped[0] ?? "Região";
      const image =
        p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ??
        p.yoast_head_json?.og_image?.[0]?.url ??
        null;
      return {
        slug: String(p.slug).slice(0, 250),
        title: decodeEntities(String(p.title?.rendered ?? "")).trim().slice(0, 300),
        excerpt: cleanExcerpt(String(p.excerpt?.rendered ?? "")),
        content: String(p.content?.rendered ?? "").slice(0, 200000),
        category,
        image_url: image,
        featured: false,
        published: true,
        published_at: `${p.date_gmt}Z`,
      };
    });

    // Não duplicar: para slugs que já existem, apenas corrige a categoria/imagem
    // (útil para reprocessar importações antigas classificadas errado); para os
    // novos, insere.
    const slugs = rows.map((r) => r.slug);
    const { data: existing } = await context.supabase
      .from("articles")
      .select("slug")
      .in("slug", slugs);
    const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
    const fresh = rows.filter((r) => r.title && !existingSet.has(r.slug));
    const toFix = rows.filter((r) => r.title && existingSet.has(r.slug));

    if (fresh.length > 0) {
      const { error } = await context.supabase.from("articles").insert(fresh);
      if (error) return { ok: false as const, error: error.message };
    }
    for (const r of toFix) {
      await context.supabase
        .from("articles")
        .update({ category: r.category, image_url: r.image_url })
        .eq("slug", r.slug);
    }

    return {
      ok: true as const,
      imported: fresh.length,
      skipped: rows.length - fresh.length,
      done: data.page >= totalPages,
      totalPages,
      total,
    };
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
