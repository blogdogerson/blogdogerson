import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Columnist {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  bio: string;
  avatar_url: string | null;
  latest_title: string;
  latest_excerpt: string;
  link_url: string | null;
  accent_color: string;
  active: boolean;
  sort_order: number;
}

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getColumnists = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("columnists")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  const columnists = (data ?? []) as unknown as Columnist[];
  if (columnists.length === 0) return { columnists };

  // Sobrescreve "Última coluna" com a coluna publicada mais recente de cada colunista.
  const { data: cols } = await (supabase as any)
    .from("columns")
    .select("columnist_id, title, excerpt, published_at")
    .eq("published", true)
    .in(
      "columnist_id",
      columnists.map((c) => c.id),
    )
    .order("published_at", { ascending: false })
    .limit(500);

  const latest = new Map<string, { title: string; excerpt: string | null }>();
  for (const row of (cols ?? []) as {
    columnist_id: string;
    title: string;
    excerpt: string | null;
  }[]) {
    if (!latest.has(row.columnist_id)) {
      latest.set(row.columnist_id, { title: row.title, excerpt: row.excerpt });
    }
  }

  return {
    columnists: columnists.map((c) => {
      const l = latest.get(c.id);
      return l
        ? { ...c, latest_title: l.title, latest_excerpt: l.excerpt ?? "" }
        : c;
    }),
  };
});


/** Público: perfil de um colunista + suas colunas publicadas. */
export const getColumnistBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient() as any;
    const { data: columnist } = await supabase
      .from("columnists")
      .select("*")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (!columnist) return { columnist: null, columns: [] as any[] };
    const { data: columns } = await supabase
      .from("columns")
      .select("id, title, slug, excerpt, image_url, published_at")
      .eq("columnist_id", columnist.id)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(50);
    return {
      columnist: columnist as Columnist,
      columns: (columns ?? []) as {
        id: string;
        title: string;
        slug: string;
        excerpt: string | null;
        image_url: string | null;
        published_at: string;
      }[],
    };
  });

const columnistSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  specialty: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(2000).default(""),
  avatar_url: z.string().trim().max(1000).optional().nullable(),
  latest_title: z.string().trim().max(200).default(""),
  latest_excerpt: z.string().trim().max(500).default(""),
  link_url: z.string().trim().max(1000).optional().nullable(),
  accent_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso negado");
}

// Cast to any to bypass generated types until they regenerate with columnists table
const anyDb = (supabase: any) => supabase as any;

export const adminListColumnists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await anyDb(context.supabase).from("columnists").select("*").order("sort_order");
    return { columnists: (data ?? []) as Columnist[] };
  });

export const adminSaveColumnist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => columnistSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const db = anyDb(context.supabase);
    const res = id
      ? await db.from("columnists").update(payload).eq("id", id)
      : await db.from("columnists").insert(payload);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteColumnist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await anyDb(context.supabase).from("columnists").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });

export const adminReorderColumnists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = anyDb(context.supabase);
    const now = new Date().toISOString();
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await db
        .from("columnists")
        .update({ sort_order: i, updated_at: now })
        .eq("id", data.ids[i]);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  });
