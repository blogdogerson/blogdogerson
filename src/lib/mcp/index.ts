import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listArticles from "./tools/list-articles";
import getArticle from "./tools/get-article";
import createArticle from "./tools/create-article";
import updateArticle from "./tools/update-article";
import listTopics from "./tools/list-topics";
import listColumns from "./tools/list-columns";
import createColumn from "./tools/create-column";

// O emissor OAuth precisa ser o host direto do Supabase; o ref do projeto é
// inlined pelo Vite em build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "blog-do-gerson-mcp",
  title: "Blog do Gerson",
  version: "0.1.0",
  instructions:
    "Ferramentas do portal Blog do Gerson (Gramado/RS). Use list_topics para conhecer as editorias, list_articles e get_article para ler notícias, create_article e update_article para publicar ou corrigir notícias (requer administrador), e list_columns / create_column para as colunas dos colunistas. Conteúdo em português (pt-BR) e HTML simples.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTopics,
    listArticles,
    getArticle,
    createArticle,
    updateArticle,
    listColumns,
    createColumn,
  ],
});
