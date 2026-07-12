import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { adminListBanners, adminSaveBanner, adminDeleteBanner } from "@/lib/admin.functions";

const POSITIONS = [
  { value: "top", label: "Topo (rotativo)" },
  { value: "sidebar", label: "Lateral" },
  { value: "inline", label: "Entre notícias" },
] as const;

interface Editing {
  id?: string;
  title: string;
  image_url: string;
  link_url: string;
  position: "top" | "sidebar" | "inline";
  active: boolean;
  sort_order: number;
}

const EMPTY: Editing = { title: "", image_url: "", link_url: "", position: "top", active: true, sort_order: 0 };

export function BannersManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListBanners);
  const save = useServerFn(adminSaveBanner);
  const remove = useServerFn(adminDeleteBanner);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-banners"], queryFn: () => list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await save({ data: { ...editing, link_url: editing.link_url || null } });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">{editing.id ? "Editar banner" : "Novo banner"}</h2>
          <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        </div>
        <input
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          placeholder="Nome do anunciante (interno)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <input
          required
          value={editing.image_url}
          onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
          placeholder="URL da imagem do banner"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        {editing.image_url && (
          <img src={editing.image_url} alt="Prévia" className="max-h-40 rounded-xl object-contain" />
        )}
        <input
          value={editing.link_url}
          onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
          placeholder="Link do anunciante (ao clicar no banner)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={editing.position}
            onChange={(e) => setEditing({ ...editing, position: e.target.value as Editing["position"] })}
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={editing.sort_order}
            onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })}
            placeholder="Ordem"
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={editing.active}
            onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            className="h-4 w-4"
          />
          Ativo (exibindo no site)
        </label>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar banner"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-black">Banners de anúncio</h2>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.banners ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhum banner cadastrado. Clique em "Novo banner" para adicionar o primeiro anúncio.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.banners ?? []).map((b: any) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-[3/1] bg-muted">
                <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold">{b.title || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">
                  {POSITIONS.find((p) => p.value === b.position)?.label} ·{" "}
                  {b.active ? "Ativo" : "Inativo"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setEditing({ ...b, title: b.title ?? "", link_url: b.link_url ?? "" })}
                    className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    Editar
                  </button>
                  {b.link_url && (
                    <a
                      href={b.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-secondary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => del(b.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
