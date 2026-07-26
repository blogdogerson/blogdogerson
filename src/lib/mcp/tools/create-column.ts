import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, slugify, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_column",
  title: "Publicar coluna",
  description:
    "Cria uma coluna assinada pelo colunista vinculado à conta autenticada. O conteúdo aceita HTML simples.",
  inputSchema: {
    title: z.string().min(1).describe("Título da coluna."),
    content: z.string().min(1).describe("Conteúdo em HTML."),
    excerpt: z.string().optional().describe("Resumo curto."),
    image_url: z.string().optional().describe("URL da imagem de destaque."),
    published: z.boolean().optional().describe("Publicar imediatamente (padrão true)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data: columnist, error: columnistError } = await supabase
      .from("columnists")
      .select("id")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (columnistError) return errorResult(columnistError.message);
    if (!columnist) return errorResult("Esta conta não está vinculada a um perfil de colunista.");

    const { data, error } = await supabase
      .from("columns")
      .insert({
        columnist_id: columnist.id,
        title: input.title,
        slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
        content: input.content,
        excerpt: input.excerpt ?? null,
        image_url: input.image_url ?? null,
        published: input.published ?? true,
        published_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    return error ? errorResult(error.message) : textResult(data);
  },
});
