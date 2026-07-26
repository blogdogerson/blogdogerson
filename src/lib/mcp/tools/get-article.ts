import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_article",
  title: "Ler notícia",
  description: "Retorna o conteúdo completo de uma notícia do Blog do Gerson pelo slug.",
  inputSchema: { slug: z.string().min(1).describe("Slug da notícia.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { data, error } = await supabaseForUser(ctx)
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult(`Nenhuma notícia encontrada com o slug "${slug}".`);
    return textResult(data);
  },
});
