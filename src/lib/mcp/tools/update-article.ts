import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
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
    const patch: Database["public"]["Tables"]["articles"]["Update"] = {};
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.content !== undefined) patch.content = fields.content;
    if (fields.excerpt !== undefined) patch.excerpt = fields.excerpt;
    if (fields.category !== undefined) patch.category = fields.category;
    if (fields.categories !== undefined) patch.categories = fields.categories;
    if (fields.image_url !== undefined) patch.image_url = fields.image_url;
    if (fields.published !== undefined) patch.published = fields.published;

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
