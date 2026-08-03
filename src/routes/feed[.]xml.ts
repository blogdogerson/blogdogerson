import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { absoluteUrl, DEFAULT_DESCRIPTION, escapeXml, SITE_NAME, summarize } from "@/lib/site";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const { data, error } = await supabase
          .from("articles")
          .select("slug, title, excerpt, content, published_at")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(50);
        if (error) console.error("Falha ao montar feed RSS", error);

        const items = (data ?? []).map((article) => {
          const url = absoluteUrl(`/noticia/${article.slug}`);
          return [
            "    <item>",
            `      <title>${escapeXml(article.title)}</title>`,
            `      <link>${escapeXml(url)}</link>`,
            `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
            `      <description>${escapeXml(summarize(article.excerpt, article.content, article.title))}</description>`,
            `      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>`,
            "    </item>",
          ].join("\n");
        });

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
          "  <channel>",
          `    <title>${SITE_NAME}</title>`,
          `    <link>${absoluteUrl("/")}</link>`,
          `    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>`,
          "    <language>pt-BR</language>",
          `    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />`,
          ...items,
          "  </channel>",
          "</rss>",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
          },
        });
      },
    },
  },
});
