import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { absoluteUrl, escapeXml } from "@/lib/site";

export const Route = createFileRoute("/news-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("articles")
          .select("slug, title, published_at")
          .eq("published", true)
          .gte("published_at", cutoff)
          .order("published_at", { ascending: false })
          .limit(1000);
        if (error) console.error("Falha ao montar sitemap de notícias", error);

        const urls = (data ?? []).map((article) =>
          [
            "  <url>",
            `    <loc>${escapeXml(absoluteUrl(`/noticia/${article.slug}`))}</loc>`,
            "    <news:news>",
            "      <news:publication>",
            "        <news:name>Blog do Gerson</news:name>",
            "        <news:language>pt</news:language>",
            "      </news:publication>",
            `      <news:publication_date>${escapeXml(article.published_at)}</news:publication_date>`,
            `      <news:title>${escapeXml(article.title)}</news:title>`,
            "    </news:news>",
            "  </url>",
          ].join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
          },
        });
      },
    },
  },
});
