import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  adminListTopics,
  adminSaveTopic,
  adminDeleteTopic,
  type Topic,
} from "@/lib/topics.functions";

interface Editing {
  id?: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
}

const EMPTY: Editing = { name: "", slug: "", sort_order: 0, active: true };

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TopicsManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListTopics);
  const save = useServerFn(adminSaveTopic);
  const remove = useServerFn(adminDeleteTopic);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-topics"], queryFn: () => list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await save({ data: editing });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir esta editoria? As notícias existentes continuam salvas, mas deixarão de aparecer nesta editoria."))
      return;
    const res = await remove({ data: { id } });
    if (res.ok) refresh();
    else alert(res.error ?? "Erro ao excluir");
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-black">Editorias</h2>
          <p className="text-sm text-muted-foreground">
            Editorias exibidas no menu, no rodapé e como blocos na home. A ordem segue o campo
            "Ordem".
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nova editoria
        </button>
      </div>

      {editing && (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-2xl border bg-card p-4 shadow-card"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={editing.name}
              onChange={(e) => {
                const name = e.target.value;
                setEditing({
                  ...editing,
                  name,
                  slug: editing.id ? editing.slug : slugify(name),
                });
              }}
              placeholder="Nome (ex: Turismo)"
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
              required
              maxLength={80}
            />
            <input
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
              placeholder="slug-da-url"
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
              required
              maxLength={80}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              Ordem
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) =>
                  setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })
                }
                className="h-10 w-24 rounded-lg border bg-card px-2 text-sm outline-none ring-ring focus:ring-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Ativa (aparece no site)
            </label>
          </div>
          {message && <p className="text-sm text-destructive">{message}</p>}
          <div className="flex gap-2">
            <button
              disabled={saving}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-11 rounded-xl border px-5 text-sm font-semibold hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : (data?.topics ?? []).length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhuma editoria cadastrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Ativa</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topics ?? []).map((t: Topic) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 tabular-nums">{t.sort_order}</td>
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.slug}</td>
                  <td className="px-4 py-3">{t.active ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() =>
                          setEditing({
                            id: t.id,
                            name: t.name,
                            slug: t.slug,
                            sort_order: t.sort_order,
                            active: t.active,
                          })
                        }
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => del(t.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
