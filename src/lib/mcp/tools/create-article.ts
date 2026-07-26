import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, slugify, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_article",
  title: "Criar notícia",
  description:
    "Cria uma nova notícia no Blog do Gerson (requer permissão de administrador). O conteúdo aceita HTML simples.",
  inputSchema: {
    title: z.string().min(1).describe("Título da notícia."),
    content: z.string().min(1).describe("Conteúdo em HTML."),
    category: z.string().describe("Editoria principal, ex.: Gramado."),
    categories: z.array(z.string()).optional().describe("Editorias adicionais."),
    excerpt: z.string().optional().describe("Resumo curto."),
    image_url: z.string().optional().describe("URL da imagem de destaque."),
    published: z.boolean().optional().describe("Publicar imediatamente (padrão true)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const categories = input.categories?.length ? input.categories : [input.category];
    const { data, error } = await supabaseForUser(ctx)
      .from("articles")
      .insert({
        title: input.title,
        slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
        content: input.content,
        category: input.category,
        categories,
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
