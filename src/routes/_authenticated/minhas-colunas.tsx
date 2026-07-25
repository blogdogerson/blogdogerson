import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, PenLine, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyColumnistProfile } from "@/lib/columns.functions";
import { MyColumnsManager } from "@/components/admin/MyColumnsManager";

export const Route = createFileRoute("/_authenticated/minhas-colunas")({
  head: () => ({
    meta: [{ title: "Minhas colunas — Blog do Gerson" }, { name: "robots", content: "noindex" }],
  }),
  component: MyColumnsPage,
});

function MyColumnsPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyColumnistProfile);
  const { data, isLoading } = useQuery({
    queryKey: ["my-columnist-profile"],
    queryFn: () => fetchProfile(),
  });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Carregando painel...
      </div>
    );
  }

  if (!data?.columnist) {
    return (
      <div className="grid min-h-screen place-items-center bg-sky-soft px-4">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-float">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-xl font-black">Sem vínculo de colunista</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não foi vinculada a um colunista. Peça ao administrador para criar o
            seu acesso na aba <strong>Colunistas</strong> do painel.
          </p>
          <button
            onClick={logout}
            className="mt-5 h-11 w-full rounded-xl border font-semibold hover:bg-secondary"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: data.columnist.accent_color }}
            >
              <PenLine className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display font-black">Painel do colunista</p>
              <p className="truncate text-xs text-muted-foreground">
                {data.columnist.name} · {data.columnist.specialty}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Ver site
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <MyColumnsManager />
      </main>
    </div>
  );
}
