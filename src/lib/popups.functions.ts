import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export interface Popup {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  content: string;
  duration_seconds: number;
  width_px: number;
  height_px: number;
  active: boolean;
  sort_order: number;
}

const popupSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200).default(""),
  image_url: z.string().trim().max(1000).optional().nullable(),
  link_url: z.string().trim().max(1000).optional().nullable(),
  content: z.string().max(5000).default(""),
  duration_seconds: z.number().int().min(1).max(120).default(10),
  width_px: z.number().int().min(240).max(1200).default(520),
  height_px: z.number().int().min(240).max(1200).default(620),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso negado");
}

export const getActivePopup = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await (supabase as any)
    .from("popups")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .limit(1);
  const row = (data ?? [])[0] ?? null;
  return { popup: row as Popup | null };
});

export const adminListPopups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await (context.supabase as any)
      .from("popups")
      .select("*")
      .order("sort_order", { ascending: true });
    return { popups: (data ?? []) as Popup[] };
  });

export const adminSavePopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => popupSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const res = id
      ? await (context.supabase as any).from("popups").update(fields).eq("id", id)
      : await (context.supabase as any).from("popups").insert(fields);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeletePopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (context.supabase as any).from("popups").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });
