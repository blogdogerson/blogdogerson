import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";


const BASE_URL = "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/quem-escreve", changefreq: "monthly", priority: "0.5" },
          { path: "/anuncie", changefreq: "monthly", priority: "0.5" },
        ];

        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const { data: topics } = await (supabase.from("topics") as any)
            .select("slug")
            .eq("active", true);
          for (const t of (topics ?? []) as Array<{ slug: string }>) {
            entries.push({
              path: `/editoria/${t.slug}`,
              changefreq: "daily",
              priority: "0.8",
            });
          }
          const { data } = await supabase
            .from("articles")
            .select("slug, published_at")
            .eq("published", true)
            .order("published_at", { ascending: false })
            .limit(1000);
          for (const a of data ?? []) {
            entries.push({
              path: `/noticia/${a.slug}`,
              lastmod: new Date(a.published_at).toISOString().slice(0, 10),
              changefreq: "monthly",
              priority: "0.7",
            });
          }
        } catch {
          /* sitemap still returns static entries */
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
