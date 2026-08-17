import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsBucket = { path: string; kind: string; title: string; views: number };

export type SiteAnalytics = {
  total: number;
  today: number;
  yesterday: number;
  byKind: { kind: string; views: number }[];
  byDay: { day: string; views: number }[];
  referrers: { source: string; views: number }[];
  topPages: AnalyticsBucket[];
  topArticles: AnalyticsBucket[];
  topColumns: AnalyticsBucket[];
  topEditorias: AnalyticsBucket[];
};

export const getSiteAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number }) => z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");

    // Agregação feita no banco — sem limite de 1000 linhas.
    const { data: stats, error } = await supabase.rpc("page_view_stats", { _days: data.days });
    if (error) throw error;
    return stats as unknown as SiteAnalytics;
  });

