import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Topic {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
}

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const anyDb = (s: any) => s as any;

export const getTopics = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data } = await anyDb(s)
    .from("topics")
    .select("id, name, slug, sort_order, active")
    .eq("active", true)
    .order("sort_order");
  return { topics: (data ?? []) as Topic[] };
});

export const topicsQuery = queryOptions({
  queryKey: ["topics"],
  queryFn: () => getTopics(),
  staleTime: 60_000,
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso negado");
}

const topicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const adminListTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await anyDb(context.supabase)
      .from("topics")
      .select("*")
      .order("sort_order");
    return { topics: (data ?? []) as Topic[] };
  });

export const adminSaveTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => topicSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const db = anyDb(context.supabase);
    const res = id
      ? await db.from("topics").update(payload).eq("id", id)
      : await db.from("topics").insert(payload);
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  });

export const adminDeleteTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await anyDb(context.supabase).from("topics").delete().eq("id", data.id);
    return { ok: !error, error: error?.message };
  });
