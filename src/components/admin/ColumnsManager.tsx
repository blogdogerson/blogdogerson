import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminListColumns,
  adminGetColumn,
  adminSaveColumn,
  adminDeleteColumn,
} from "@/lib/columns.functions";
import { adminListColumnists } from "@/lib/columnists.functions";
import { ImageUpload } from "./ImageUpload";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

interface Editing {
  id?: string;
  columnist_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
}

const EMPTY: Editing = {
  columnist_id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  published: true,
};

export function ColumnsManager() {
  const qc = useQueryClient();
  const list = useServerFn(adminListColumns);
  const getOne = useServerFn(adminGetColumn);
  const save = useServerFn(adminSaveColumn);
  const remove = useServerFn(adminDeleteColumn);
  const listColumnists = useServerFn(adminListColumnists);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-columns"], queryFn: () => list() });
  const { data: columnistsData } = useQuery({
    queryKey: ["admin-columnists-picker"],
    queryFn: () => listColumnists(),
  });
  const columnists = columnistsData?.columnists ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-columns"] });
    qc.invalidateQueries({ queryKey: ["columnists"] });
    qc.invalidateQueries({ queryKey: ["latest-columns"] });
  };

  const openEdit = async (id: string) => {
    const res = await getOne({ data: { id } });
    if (res.column) {
      const c = res.column;
      setEditing({
        id: c.id,
        columnist_id: c.columnist_id,
        title: c.title,
        slug: c.slug,
        excerpt: c.excerpt ?? "",
        content: c.content,
        image_url: c.image_url ?? "",
        published: c.published,
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.columnist_id) {
      setMessage("Escolha o colunista.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await save({
        data: {
          ...editing,
          slug: editing.slug || slugify(editing.title),
          image_url: editing.image_url || null,
        },
      });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir esta coluna?")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {editing.id ? "Editar coluna" : "Nova coluna"}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <select
            required
            value={editing.columnist_id}
            onChange={(e) => setEditing({ ...editing, columnist_id: e.target.value })}
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="">Escolha o colunista...</option>
            {columnists.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.specialty}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              className="h-4 w-4"
            />
            Publicada
          </label>
        </div>

        <input
          required
          value={editing.title}
          onChange={(e) =>
            setEditing({
              ...editing,
              title: e.target.value,
              slug: editing.id ? editing.slug : slugify(e.target.value),
            })
          }
          placeholder="Título da coluna"
          className="h-12 w-full rounded-xl border bg-card px-4 font-display text-lg font-bold outline-none ring-ring focus:ring-2"
        />

        <ImageUpload
          value={editing.image_url}
          onChange={(url) => setEditing({ ...editing, image_url: url })}
          label="Imagem de capa"
          folder="colunas"
        />

        <textarea
          value={editing.excerpt}
          onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
          placeholder="Resumo/chamada (aparece no card e no compartilhamento)"
          rows={2}
          maxLength={500}
          className="w-full rounded-xl border bg-card p-4 text-sm outline-none ring-ring focus:ring-2"
        />

        <textarea
          required
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          placeholder="Texto da coluna (aceita HTML: <p>, <strong>, <img>...)"
          rows={16}
          className="w-full rounded-xl border bg-card p-4 font-mono text-sm outline-none ring-ring focus:ring-2"
        />

        {message && <p className="text-sm text-destructive">{message}</p>}
        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar coluna"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-black">Colunas</h2>
          <p className="text-sm text-muted-foreground">
            Textos publicados pelos colunistas. Cada coluna vira uma página pública em /coluna/slug.
          </p>
        </div>
        <button
          onClick={() => {
            if (columnists.length === 0) {
              alert("Cadastre um colunista antes de escrever uma coluna.");
              return;
            }
            setEditing({ ...EMPTY, columnist_id: columnists[0].id });
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nova coluna
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.columns ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhuma coluna publicada ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {(data?.columns ?? []).map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-secondary/50"
            >
              <div
                className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                style={{ borderLeft: `3px solid ${c.columnist?.accent_color ?? "#3b82f6"}` }}
              >
                {c.image_url && (
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.columnist?.name ?? "Sem autor"} ·{" "}
                  {new Date(c.published_at).toLocaleDateString("pt-BR")}
                  {!c.published && <span className="ml-2 text-destructive">Rascunho</span>}
                </p>
              </div>
              <button
                onClick={() => openEdit(c.id)}
                aria-label="Editar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => del(c.id)}
                aria-label="Excluir"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
