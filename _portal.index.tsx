import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { adminImportWordPress } from "@/lib/admin.functions";

interface Progress {
  page: number;
  totalPages: number;
  total: number;
  imported: number;
  skipped: number;
}

export function ImportWordPress() {
  const qc = useQueryClient();
  const importPage = useServerFn(adminImportWordPress);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef(false);

  const start = async () => {
    setRunning(true);
    setFinished(false);
    setError("");
    cancelRef.current = false;
    let imported = 0;
    let skipped = 0;
    let page = 1;

    try {
      for (;;) {
        if (cancelRef.current) break;
        const res = await importPage({ data: { page, months: 6 } });
        if (!res.ok) {
          setError(res.error ?? "Erro na importação.");
          break;
        }
        imported += res.imported;
        skipped += res.skipped;
        setProgress({
          page,
          totalPages: res.totalPages,
          total: res.total,
          imported,
          skipped,
        });
        if (res.done) {
          setFinished(true);
          break;
        }
        page += 1;
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro inesperado na importação.");
    } finally {
      setRunning(false);
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    }
  };

  const pct =
    progress && progress.totalPages > 0
      ? Math.min(100, Math.round((progress.page / progress.totalPages) * 100))
      : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-xl font-black">Importar do site antigo</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Busca as notícias publicadas nos últimos 6 meses em{" "}
        <span className="font-semibold text-foreground">blogdogerson.com.br</span> e traz para
        este portal com imagem, categoria e data originais. Notícias que já existem aqui são
        puladas automaticamente (nada é duplicado) — pode rodar mais de uma vez sem medo.
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        {!running && !finished && (
          <button
            onClick={start}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-5 w-5" /> Importar últimos 6 meses
          </button>
        )}

        {(running || progress) && (
          <div className="space-y-3">
            {running && (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Importando... página {progress?.page ?? 1}
                {progress?.totalPages ? ` de ${progress.totalPages}` : ""}
              </p>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${finished ? 100 : pct}%` }}
              />
            </div>
            {progress && (
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{progress.imported}</span> importadas
                · <span className="font-bold text-foreground">{progress.skipped}</span> já
                existiam {progress.total ? `· ${progress.total} encontradas no período` : ""}
              </p>
            )}
            {running && (
              <button
                onClick={() => {
                  cancelRef.current = true;
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Parar importação
              </button>
            )}
          </div>
        )}

        {finished && !error && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-5 w-5" /> Importação concluída! Veja as notícias na aba
            "Notícias" e na página inicial do site.
          </p>
        )}
        {error && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-destructive">
            <XCircle className="h-5 w-5" /> {error}
          </p>
        )}
        {finished && (
          <button
            onClick={start}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Rodar novamente (só traz o que faltar)
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        As imagens continuam hospedadas no site antigo — mantenha o blogdogerson.com.br no ar
        enquanto o novo portal usar essas fotos.
      </p>
    </div>
  );
}
