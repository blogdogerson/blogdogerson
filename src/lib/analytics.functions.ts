import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Row = { path: string; kind: string; title: string; referrer: string | null; created_at: string };

export type AnalyticsBucket = { path: string; kind: string; title: string; views: number };

export const getSiteAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number }) => z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");

    const since = new Date(Date.now() - data.days * 86400000).toISOString();

    // PostgREST limita cada resposta a 1000 linhas — paginar para contar tudo.
    const PAGE = 1000;
    const list: Row[] = [];
    for (let from = 0; from < 200000; from += PAGE) {
      const { data: rows, error } = await supabase
        .from("page_views")
        .select("path, kind, title, referrer, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const chunk = (rows ?? []) as Row[];
      list.push(...chunk);
      if (chunk.length < PAGE) break;
    }

    const byPath = new Map<string, AnalyticsBucket>();
    const byKind = new Map<string, number>();
    const byDay = new Map<string, number>();
    const byReferrer = new Map<string, number>();

    for (const r of list) {
      const key = r.path;
      const cur = byPath.get(key);
      if (cur) {
        cur.views += 1;
        if (!cur.title && r.title) cur.title = r.title;
      } else {
        byPath.set(key, { path: r.path, kind: r.kind, title: r.title, views: 1 });
      }
      byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);
      const day = r.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      const ref = r.referrer || "direto";
      byReferrer.set(ref, (byReferrer.get(ref) ?? 0) + 1);
    }

    const pages = [...byPath.values()].sort((a, b) => b.views - a.views);
    const pick = (kind: string) => pages.filter((p) => p.kind === kind).slice(0, 25);

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    return {
      total: list.length,
      today: byDay.get(today) ?? 0,
      yesterday: byDay.get(yesterday) ?? 0,
      byKind: [...byKind.entries()].map(([kind, views]) => ({ kind, views })).sort((a, b) => b.views - a.views),
      byDay: [...byDay.entries()].map(([day, views]) => ({ day, views })).sort((a, b) => a.day.localeCompare(b.day)),
      referrers: [...byReferrer.entries()].map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views).slice(0, 10),
      topPages: pages.slice(0, 25),
      topArticles: pick("noticia"),
      topColumns: pick("coluna"),
      topEditorias: pick("editoria"),
    };
  });
