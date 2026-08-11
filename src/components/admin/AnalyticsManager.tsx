import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteAnalytics, type AnalyticsBucket } from "@/lib/analytics.functions";

const RANGES = [
  { days: 1, label: "24 horas" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 365, label: "1 ano" },
];

const KIND_LABEL: Record<string, string> = {
  home: "Página inicial",
  noticia: "Notícias",
  coluna: "Colunas",
  colunista: "Perfis de colunistas",
  editoria: "Editorias",
  video: "Vídeos",
  busca: "Buscas",
  pagina: "Outras páginas",
};

function Table({ title, rows, empty }: { title: string; rows: AnalyticsBucket[]; empty: string }) {
  const max = rows[0]?.views ?? 1;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.path}>
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={r.path}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium text-foreground hover:text-primary"
                  title={r.title || r.path}
                >
                  {r.title || r.path}
                </a>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{r.views}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(r.views / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalyticsManager() {
  const [days, setDays] = useState(30);
  const fetchAnalytics = useServerFn(getSiteAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["site-analytics", days],
    queryFn: () => fetchAnalytics({ data: { days } }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              days === r.days
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando estatísticas…</p>}
      {error && <p className="text-sm text-destructive">Não foi possível carregar as estatísticas.</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: `Acessos (${RANGES.find((r) => r.days === days)?.label})`, value: data.total },
              { label: "Hoje", value: data.today },
              { label: "Ontem", value: data.yesterday },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Acessos por tipo de conteúdo
            </h3>
            {data.byKind.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem dados no período.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.byKind.map((k) => (
                  <div key={k.kind} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">{KIND_LABEL[k.kind] ?? k.kind}</p>
                    <p className="text-xl font-semibold tabular-nums">{k.views}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Notícias mais lidas" rows={data.topArticles} empty="Ainda sem acessos registrados." />
            <Table title="Colunas mais lidas" rows={data.topColumns} empty="Ainda sem acessos registrados." />
            <Table title="Editorias mais acessadas" rows={data.topEditorias} empty="Ainda sem acessos registrados." />
            <Table title="Páginas mais acessadas" rows={data.topPages} empty="Ainda sem acessos registrados." />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Origem dos acessos
            </h3>
            {data.referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem dados no período.</p>
            ) : (
              <ul className="space-y-2">
                {data.referrers.map((r) => (
                  <li key={r.source} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.source}</span>
                    <span className="font-semibold tabular-nums">{r.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            A contagem começa a partir de agora — acessos anteriores à ativação deste relatório não aparecem aqui.
          </p>
        </>
      )}
    </div>
  );
}
