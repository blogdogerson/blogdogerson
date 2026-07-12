import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Image, LogOut, Mail, Newspaper, PlayCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminStatus, bootstrapAdmin } from "@/lib/admin.functions";
import { ArticlesManager } from "@/components/admin/ArticlesManager";
import { BannersManager } from "@/components/admin/BannersManager";
import { VideosManager } from "@/components/admin/VideosManager";
import { NewsletterManager } from "@/components/admin/NewsletterManager";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Painel — Blog do Gerson" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

const TABS = [
  { key: "noticias", label: "Notícias", icon: Newspaper },
  { key: "banners", label: "Banners", icon: Image },
  { key: "videos", label: "Vídeos", icon: PlayCircle },
  { key: "newsletter", label: "Newsletter", icon: Mail },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("noticias");
  const fetchStatus = useServerFn(getMyAdminStatus);
  const claimAdmin = useServerFn(bootstrapAdmin);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const { data: status, isLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => fetchStatus(),
  });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const claim = async () => {
    setClaiming(true);
    setClaimError("");
    try {
      const res = await claimAdmin();
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-status"] });
      } else {
        setClaimError(res.error ?? "Não foi possível ativar o acesso.");
      }
    } finally {
      setClaiming(false);
    }
  };

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando painel...</div>;
  }

  if (!status?.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-sky-soft px-4">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-float">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-xl font-black">Acesso de administrador</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não tem permissão de administrador. Se você é o primeiro usuário do
            site, clique abaixo para ativar o acesso.
          </p>
          {claimError && <p className="mt-3 text-sm text-destructive">{claimError}</p>}
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={claim}
              disabled={claiming}
              className="h-11 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {claiming ? "Ativando..." : "Ativar acesso de administrador"}
            </button>
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand">
              <span className="font-display text-lg font-black text-primary-foreground">G</span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display font-black">Painel administrativo</p>
              <p className="text-xs text-muted-foreground">Blog do Gerson</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/" className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-secondary">
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
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "noticias" && <ArticlesManager />}
        {tab === "banners" && <BannersManager />}
        {tab === "videos" && <VideosManager />}
        {tab === "newsletter" && <NewsletterManager />}
      </main>
    </div>
  );
}
