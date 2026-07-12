import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Trash2 } from "lucide-react";
import { adminListSubscribers, adminDeleteSubscriber } from "@/lib/admin.functions";

export function NewsletterManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListSubscribers);
  const remove = useServerFn(adminDeleteSubscriber);

  const { data, isLoading } = useQuery({ queryKey: ["admin-subs"], queryFn: () => list() });
  const subs = data?.subscribers ?? [];

  const del = async (id: string) => {
    if (!confirm("Remover este cadastro?")) return;
    await remove({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["admin-subs"] });
  };

  const exportCsv = () => {
    const rows = [["email", "nome", "data"], ...subs.map((s: any) => [s.email, s.name ?? "", s.created_at])];
    const csv = rows.map((r) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "newsletter-blog-do-gerson.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-black">Newsletter</h2>
          <p className="text-sm text-muted-foreground">{subs.length} cadastros</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subs.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold hover:bg-secondary disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : subs.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Ainda não há cadastros na newsletter.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {subs.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.email}</p>
                <p className="text-xs text-muted-foreground">
                  {s.name ? `${s.name} · ` : ""}
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => del(s.id)}
                aria-label="Remover"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
