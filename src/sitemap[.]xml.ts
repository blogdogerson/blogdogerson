import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server functions for the RESTRICTED columnist panel: a columnist logged in
// here can only see/edit/publish their own column, never anyone else's
// content and never the rest of the admin panel (Notícias, Banners, etc).

const anyDb = (supabase: any) => supabase as any;

async function myColumnist(context: { supabase: any; userId: string }) {
  const { data } = await anyDb(context.supabase)
    .from("columnists")
    .select("id, name, slug, specialty, avatar_url, accent_color")
    .eq("user_id", context.userId)
    .maybeSingle();
  return data as { id: string; name: string; slug: string; specialty: string; avatar_url: string | null; accent_color: string } | null;
}

export const getMyColumnistProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const columnist = await myColumnist(context);
    return { columnist };
  });

export const columnistListMyColumns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const columnist = await myColumnist(context);
    if (!columnist) return { columns: [] as any[] };
    const { data } = await anyDb(context.supabase)
      .from("columns")
      .select("id, title, slug, published, published_at, image_url")
      .eq("columnist_id", columnist.id)
      .order("published_at", { ascending: false })
      .limit(200);
    return { columns: data ?? [] };
  });

export const columnistGetColumn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const columnist = await myColumnist(context);
    if (!columnist) return { column: null };
    const { data: row } = await anyDb(context.supabase)
      .from("columns")
      .select("*")
      .eq("id", data.id)
      .eq("columnist_id", columnist.id)
      .maybeSingle();
    return { column: row ?? null };
  });

const columnistColumnSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(250),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(250)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  excerpt: z.string().trim().max(500).default(""),
  content: z.string().max(200000),
  image_url: z.string().trim().max(1000).optional().nullable(),
  published: z.boolean().default(true),
});

export const columnistSaveColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => columnistColumnSchema.parse(d))
  .handler(async ({ data, context }) => {
    const columnist = await myColumnist(context);
    if (!columnist) {
      return {
        ok: false,
        error:
          "Sua conta ainda não está vinculada a um colunista. Peça para o administrador vincular seu e-mail no painel.",
      };
    }
    const { id, ...fields } = data;
    const payload = { ...fields, columnist_id: columnist.id, updated_at: new Date().toISOString() };
    const db = anyDb(context.supabase);

    if (id) {
      // Confere que a coluna pertence a este colunista antes de editar.
      const { data: existing } = await db
        .from("columns")
        .select("id")
        .eq("id", id)
        .eq("columnist_id", columnist.id)
        .maybeSingle();
      if (!existing) return { ok: false, error: "Coluna não encontrada." };
      const res = await db.from("columns").update(payload).eq("id", id);
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    }

    const res = await db.from("columns").insert(payload);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });
