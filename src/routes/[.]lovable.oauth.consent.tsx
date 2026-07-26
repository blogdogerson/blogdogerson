import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string; client_id?: string; redirect_uris?: string[] } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Parâmetro authorization_id ausente.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-sky-soft px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-float">
        <h1 className="font-display text-xl font-black">Não foi possível carregar a autorização</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "Aplicativo externo";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um endereço de retorno.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-soft px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-float">
        <h1 className="font-display text-2xl font-black leading-tight">
          Conectar {clientName} ao Blog do Gerson
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {clientName} poderá usar as ferramentas do Blog do Gerson agindo como você enquanto você
          estiver conectado.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
          <li>• Ler e pesquisar notícias, editorias e colunas</li>
          <li>• Criar e editar conteúdo conforme as suas permissões</li>
        </ul>
        {details?.client?.redirect_uris?.[0] && (
          <p className="mt-4 break-all text-xs text-muted-foreground">
            Endereço de retorno: {details.client.redirect_uris[0]}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Isto não ignora as permissões do painel administrativo nem as regras de acesso do banco de
          dados.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="h-11 flex-1 rounded-xl bg-primary font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Aguarde..." : "Autorizar"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="h-11 flex-1 rounded-xl border font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </main>
  );
}
