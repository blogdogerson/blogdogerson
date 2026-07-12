import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  adminListArticles,
  adminGetArticle,
  adminSaveArticle,
  adminDeleteArticle,
} from "@/lib/admin.functions";
import { CATEGORIES } from "@/lib/categories";

function slugify(text: string) {
  return text
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
  category: string;
  image_url: string;
  featured: boolean;
  published: boolean;
}

const EMPTY: Editing = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Geral",
  image_url: "",
  featured: false,
  published: true,
};

export function ArticlesManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListArticles);
  const getOne = useServerFn(adminGetArticle);
  const save = useServerFn(adminSaveArticle);
  const remove = useServerFn(adminDeleteArticle);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-articles", q, page],
    queryFn: () => list({ data: { q: q || undefined, page } }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const openEdit = async (id: string) => {
    const res = await getOne({ data: { id } });
    if (res.article) {
      const a = res.article;
      setEditing({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt ?? "",
        content: a.content,
        category: a.category,
        image_url: a.image_url ?? "",
        featured: a.featured,
        published: a.published,
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
      } else {
        setMessage(res.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir esta notícia? Essa ação não pode ser desfeita.")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {editing.id ? "Editar notícia" : "Nova notícia"}
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
            setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })
          }
          placeholder="Título da notícia"
          className="h-12 w-full rounded-xl border bg-card px-4 font-display text-lg font-bold outline-none ring-ring focus:ring-2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={editing.image_url}
            onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
            placeholder="URL da imagem de capa"
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        {editing.image_url && (
          <img src={editing.image_url} alt="Prévia" className="h-40 rounded-xl object-cover" />
        )}
        <textarea
          value={editing.excerpt}
          onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
          placeholder="Resumo (aparece nos cards e no compartilhamento)"
          maxLength={500}
          rows={2}
          className="w-full rounded-xl border bg-card p-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <textarea
          required
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          placeholder="Conteúdo da notícia (aceita HTML: <p>, <img>, <strong>...)"
          rows={16}
          className="w-full rounded-xl border bg-card p-4 font-mono text-sm outline-none ring-ring focus:ring-2"
        />
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              className="h-4 w-4"
            />
            Publicada
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editing.featured}
              onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              className="h-4 w-4"
            />
            Destaque
          </label>
        </div>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar notícia"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Pesquisar por título..."
          className="h-11 flex-1 rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nova notícia
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {(data?.articles ?? []).map((a: any) => (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-secondary/50"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {a.image_url && <img src={a.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.category} · {new Date(a.published_at).toLocaleDateString("pt-BR")}
                  {!a.published && <span className="ml-2 text-destructive">Rascunho</span>}
                </p>
              </div>
              {a.featured && <Star className="h-4 w-4 shrink-0 text-primary" />}
              <button
                onClick={() => openEdit(a.id)}
                aria-label="Editar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => del(a.id)}
                aria-label="Excluir"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {data && data.total > data.per && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {Math.ceil(data.total / data.per)}
          </span>
          <button
            disabled={page >= Math.ceil(data.total / data.per)}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
