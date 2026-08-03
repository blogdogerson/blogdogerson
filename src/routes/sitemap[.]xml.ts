import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { VIDEO_SECTIONS } from "@/lib/categories";
import { absoluteUrl, escapeXml } from "@/lib/site";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "hourly" | "daily" | "weekly" | "monthly";
  priority?: string;
}

function newestDate(...values: Array<string | null | undefined>) {
  const valid = values.filter(Boolean).map((value) => new Date(value!).getTime());
  return valid.length ? new Date(Math.max(...valid)).toISOString() : undefined;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/colunistas", changefreq: "weekly", priority: "0.7" },
          { path: "/quem-escreve", changefreq: "monthly", priority: "0.5" },
          { path: "/anuncie", changefreq: "monthly", priority: "0.4" },
          ...VIDEO_SECTIONS.map((section) => ({
            path: `/videos/${section.key}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
        ];

        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );

          const { data: topics, error: topicsError } = await supabase
            .from("topics")
            .select("slug, updated_at")
            .eq("active", true);
          if (topicsError) throw topicsError;
          for (const topic of topics ?? []) {
            entries.push({
              path: `/editoria/${topic.slug}`,
              lastmod: topic.updated_at,
              changefreq: "daily",
              priority: "0.8",
            });
          }

          const pageSize = 1000;
          for (let from = 0; ; from += pageSize) {
            const { data: articles, error } = await supabase
              .from("articles")
              .select("slug, published_at, updated_at")
              .eq("published", true)
              .order("published_at", { ascending: false })
              .range(from, from + pageSize - 1);
            if (error) throw error;
            for (const article of articles ?? []) {
              entries.push({
                path: `/noticia/${article.slug}`,
                lastmod: newestDate(article.published_at, article.updated_at),
                changefreq: "monthly",
                priority: "0.7",
              });
            }
            if (!articles || articles.length < pageSize) break;
          }

          for (let from = 0; ; from += pageSize) {
            const { data: columns, error } = await supabase
              .from("columns")
              .select("slug, published_at, updated_at")
              .eq("published", true)
              .order("published_at", { ascending: false })
              .range(from, from + pageSize - 1);
            if (error) throw error;
            for (const column of columns ?? []) {
              entries.push({
                path: `/coluna/${column.slug}`,
                lastmod: newestDate(column.published_at, column.updated_at),
                changefreq: "monthly",
                priority: "0.6",
              });
            }
            if (!columns || columns.length < pageSize) break;
          }
        } catch (error) {
          console.error("Falha ao montar sitemap dinâmico", error);
        }

        const uniqueEntries = Array.from(
          new Map(entries.map((entry) => [entry.path, entry])).values(),
        );
        const urls = uniqueEntries.map((entry) =>
          [
            "  <url>",
            `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
            entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : null,
            entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
            entry.priority ? `    <priority>${entry.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
