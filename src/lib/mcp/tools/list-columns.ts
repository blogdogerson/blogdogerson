import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_columns",
  title: "Listar colunas",
  description:
    "Lista as colunas dos colunistas do Blog do Gerson, com o nome do autor e a data de publicação.",
  inputSchema: {
    search: z.string().optional().describe("Texto a procurar no título da coluna."),
    limit: z.number().int().optional().describe("Quantidade de resultados (padrão 20, máx 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let query = supabaseForUser(ctx)
      .from("columns")
      .select("id, title, slug, excerpt, published, published_at, columnists(name)")
      .order("published_at", { ascending: false })
      .limit(take);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    return error ? errorResult(error.message) : textResult(data);
  },
});
