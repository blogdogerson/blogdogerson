import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_articles",
  title: "Listar notícias",
  description:
    "Lista notícias do Blog do Gerson, com busca por texto e filtro por editoria. Retorna título, slug, editoria, data e resumo.",
  inputSchema: {
    search: z.string().optional().describe("Texto a procurar no título."),
    category: z.string().optional().describe("Nome da editoria, ex.: Gramado, Política."),
    limit: z.number().int().optional().describe("Quantidade de resultados (padrão 20, máx 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let query = supabaseForUser(ctx)
      .from("articles")
      .select("id, title, slug, category, categories, excerpt, published, published_at")
      .order("published_at", { ascending: false })
      .limit(take);
    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.contains("categories", [category]);
    const { data, error } = await query;
    return error ? errorResult(error.message) : textResult(data);
  },
});
