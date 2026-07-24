import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  columnistListMyColumns,
  columnistGetColumn,
  columnistSaveColumn,
} from "@/lib/columnist-panel.functions";
import { ImageUpload } from "./ImageUpload";
import { RichTextArea } from "./RichTextArea";

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
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
}

const EMPTY: Editing = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  published: true,
};

/**
 * Painel restrito para um colunista: só vê e edita a própria coluna, nada
 * mais do painel administrativo (sem Notícias, Banners, Vídeos, Tópicos etc).
 */
export function ColumnistPanel({ columnistName }: { columnistName: string }) {
  const qc = useQueryClient();
  const list = useServerFn(columnistListMyColumns);
  const getOne = useServerFn(columnistGetColumn);
  const save = useServerFn(columnistSaveColumn);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["my-columns"], queryFn: () => list() });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-columns"] });
    qc.invalidateQueries({ queryKey: ["columnists"] });
    qc.invalidateQueries({ queryKey: ["latest-columns"] });
  };

  const openEdit = async (id: string) => {
    const res = await getOne({ data: { id } });
    if (res.column) {
      const c = res.column;
      setEditing({
        id: c.id,
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

        <RichTextArea
          required
          value={editing.content}
          onChange={(content) => setEditing({ ...editing, content })}
          placeholder="Escreva o texto da coluna. Deixe uma linha em branco entre os parágrafos."
          rows={16}
          folder="colunas"
        />

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={editing.published}
            onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
            className="h-4 w-4"
          />
          Publicada
        </label>

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
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-black">Minhas colunas</h2>
          <p className="text-sm text-muted-foreground">
            Olá, {columnistName}. Aqui você edita e publica somente a sua própria coluna.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nova coluna
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.columns ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Você ainda não publicou nenhuma coluna. Clique em "Nova coluna" para começar.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {(data?.columns ?? []).map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-secondary/50"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {c.image_url && (
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
