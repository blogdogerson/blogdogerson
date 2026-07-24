import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminListCategories, adminSaveCategory, adminDeleteCategory } from "@/lib/admin.functions";

interface Editing {
  id?: string;
  name: string;
  sort_order: number;
}

const EMPTY: Editing = { name: "", sort_order: 0 };

export function CategoriesManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListCategories);
  const save = useServerFn(adminSaveCategory);
  const remove = useServerFn(adminDeleteCategory);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: () => list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
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
    if (
      !confirm(
        "Remover este tópico? Ele deixa de aparecer no menu, na home e no rodapé, mas as notícias já publicadas com essa editoria continuam existindo normalmente.",
      )
    )
      return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">{editing.id ? "Editar tópico" : "Novo tópico"}</h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
        <input
          value={editing.name}
          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          placeholder="Nome do tópico (ex.: Gramado, Turismo, Cultura...)"
          maxLength={60}
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <input
          type="number"
          value={editing.sort_order}
          onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })}
          placeholder="Ordem de exibição (menor número aparece primeiro)"
          className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        {editing.id && (
          <p className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
            Se você mudar o nome, as notícias que já estavam nesse tópico são atualizadas
            automaticamente para o novo nome.
          </p>
        )}
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar tópico"}
        </button>
      </form>
    );
  }

  const categories = (data?.categories ?? []) as Editing[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-black">Tópicos / Editorias</h2>
        <button
          onClick={() => setEditing({ ...EMPTY, sort_order: categories.length })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo tópico
        </button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Esses tópicos aparecem no menu, na home e no rodapé do site. Remover um tópico daqui não
        apaga nenhuma notícia — as matérias já publicadas com essa editoria continuam no site,
        só deixam de ter uma seção própria na navegação.
      </p>
      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhum tópico cadastrado. Clique em "Novo tópico" para criar o primeiro.
        </p>
      ) : (
        <div className="divide-y rounded-2xl border bg-card">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">Ordem: {c.sort_order}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Editar
                </button>
                <button
                  onClick={() => c.id && del(c.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
