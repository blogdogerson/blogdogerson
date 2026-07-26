import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_topics",
  title: "Listar editorias",
  description: "Lista as editorias (segmentos) ativas do Blog do Gerson.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { data, error } = await supabaseForUser(ctx)
      .from("topics")
      .select("id, name, slug, active, sort_order")
      .order("sort_order", { ascending: true });
    return error ? errorResult(error.message) : textResult(data);
  },
});
