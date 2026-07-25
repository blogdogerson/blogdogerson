import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ColumnPost {
  id: string;
  columnist_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnPostWithAuthor extends ColumnPost {
  columnist: {
    id: string;
    name: string;
    slug: string;
    specialty: string;
    avatar_url: string | null;
    accent_color: string;
  } | null;
}

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const anyDb = (c: any) => c as any;

/** Public: latest published columns (across all columnists). */
export const getLatestColumns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = anyDb(publicClient());
  const { data } = await supabase
    .from("columns")
    .select(
      "id, columnist_id, title, slug, excerpt, image_url, published_at, columnist:columnists(id, name, slug, specialty, avatar_url, accent_color)",
    )
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(12);
  return { columns: (data ?? []) as ColumnPostWithAuthor[] };
});

/** Public: single column by slug. */
export const getColumnBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(250) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = anyDb(publicClient());
    const { data: post } = await supabase
      .from("columns")
      .select(
        "*, columnist:columnists(id, name, slug, specialty, bio, avatar_url, accent_color)",
      )
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!post) return { column: null, related: [] as ColumnPostWithAuthor[] };
    const { data: related } = await supabase
      .from("columns")
      .select(
        "id, columnist_id, title, slug, excerpt, image_url, published_at, columnist:columnists(id, name, slug, specialty, avatar_url, accent_color)",
      )
      .eq("published", true)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    return {
      column: post as ColumnPostWithAuthor,
      related: (related ?? []) as ColumnPostWithAuthor[],
    };
  });

// ---- Admin ----

const columnSchema = z.object({
  id: z.string().uuid().optional(),
  columnist_id: z.string().uuid(),
  title: z.string().trim().min(1).max(250),
  slug: z.string().trim().min(1).max(250).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(500).default(""),
  content: z.string().max(200000),
  image_url: z.string().trim().max(1000).optional().nullable(),
  published: z.boolean().default(true),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso negado");
}

export const adminListColumns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await anyDb(context.supabase)
      .from("columns")
      .select(
        "id, columnist_id, title, slug, published, published_at, image_url, columnist:columnists(name, accent_color)",
      )
      .order("published_at", { ascending: false })
      .limit(200);
    return { columns: (data ?? []) as any[] };
  });

export const adminGetColumn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row } = await anyDb(context.supabase)
      .from("columns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    return { column: row as ColumnPost | null };
  });

export const adminSaveColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => columnSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const db = anyDb(context.supabase);
    const res = id
      ? await db.from("columns").update(payload).eq("id", id)
      : await db.from("columns").insert(payload);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await anyDb(context.supabase).from("columns").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });

// ---- Painel do Colunista (auto-gestão) ----

async function getMyColumnist(context: { supabase: any; userId: string }) {
  const { data } = await anyDb(context.supabase)
    .from("columnists")
    .select("id, name, slug, specialty, avatar_url, accent_color, active")
    .eq("user_id", context.userId)
    .maybeSingle();
  return data as
    | { id: string; name: string; slug: string; specialty: string; avatar_url: string | null; accent_color: string; active: boolean }
    | null;
}

/** Perfil do colunista logado (usado para gate no painel /minhas-colunas). */
export const getMyColumnistProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const columnist = await getMyColumnist(context);
    return { columnist };
  });

/** Lista as colunas do colunista logado. */
export const myListColumns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await getMyColumnist(context);
    if (!me) throw new Error("Você não está vinculado a nenhum colunista.");
    const { data } = await anyDb(context.supabase)
      .from("columns")
      .select("id, title, slug, published, published_at, image_url")
      .eq("columnist_id", me.id)
      .order("published_at", { ascending: false })
      .limit(200);
    return { columns: (data ?? []) as any[], columnist: me };
  });

export const myGetColumn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await getMyColumnist(context);
    if (!me) throw new Error("Você não está vinculado a nenhum colunista.");
    const { data: row } = await anyDb(context.supabase)
      .from("columns")
      .select("*")
      .eq("id", data.id)
      .eq("columnist_id", me.id)
      .maybeSingle();
    return { column: row as ColumnPost | null };
  });

const myColumnSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(250),
  slug: z.string().trim().min(1).max(250).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(500).default(""),
  content: z.string().max(200000),
  image_url: z.string().trim().max(1000).optional().nullable(),
  published: z.boolean().default(true),
});

export const mySaveColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => myColumnSchema.parse(d))
  .handler(async ({ data, context }) => {
    const me = await getMyColumnist(context);
    if (!me) return { ok: false as const, error: "Você não está vinculado a nenhum colunista." };
    const { id, ...fields } = data;
    const payload = { ...fields, columnist_id: me.id, updated_at: new Date().toISOString() };
    const db = anyDb(context.supabase);
    const res = id
      ? await db.from("columns").update(payload).eq("id", id).eq("columnist_id", me.id)
      : await db.from("columns").insert(payload);
    if (res.error) return { ok: false as const, error: res.error.message };
    return { ok: true as const };
  });

export const myDeleteColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await getMyColumnist(context);
    if (!me) return { ok: false as const, error: "Você não está vinculado a nenhum colunista." };
    const { error } = await anyDb(context.supabase)
      .from("columns")
      .delete()
      .eq("id", data.id)
      .eq("columnist_id", me.id);
    return { ok: !error, error: error?.message };
  });
