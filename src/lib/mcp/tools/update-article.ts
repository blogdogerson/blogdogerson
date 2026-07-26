import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "update_article",
  title: "Atualizar notícia",
  description:
    "Atualiza campos de uma notícia existente pelo slug (requer permissão de administrador).",
  inputSchema: {
    slug: z.string().min(1).describe("Slug da notícia a atualizar."),
    title: z.string().optional(),
    content: z.string().optional().describe("Novo conteúdo em HTML."),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    image_url: z.string().optional(),
    published: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ slug, ...fields }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(patch).length === 0) return errorResult("Nenhum campo para atualizar.");
    const { data, error } = await supabaseForUser(ctx)
      .from("articles")
      .update(patch)
      .eq("slug", slug)
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Notícia não encontrada ou sem permissão para editar.");
    return textResult(data);
  },
});
