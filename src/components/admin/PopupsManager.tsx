import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  adminListPopups,
  adminSavePopup,
  adminDeletePopup,
} from "@/lib/popups.functions";
import { ImageUpload } from "./ImageUpload";

interface Editing {
  id?: string;
  title: string;
  image_url: string;
  link_url: string;
  content: string;
  duration_seconds: number;
  width_px: number;
  height_px: number;
  active: boolean;
  sort_order: number;
}

const EMPTY: Editing = {
  title: "",
  image_url: "",
  link_url: "",
  content: "",
  duration_seconds: 10,
  width_px: 520,
  height_px: 620,
  active: true,
  sort_order: 0,
};

export function PopupsManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListPopups);
  const save = useServerFn(adminSavePopup);
  const remove = useServerFn(adminDeletePopup);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: () => list(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
    queryClient.invalidateQueries({ queryKey: ["active-popup"] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...editing,
        image_url: editing.image_url || null,
        link_url: editing.link_url || null,
      };
      const res = await save({ data: payload });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este pop-up?")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {editing.id ? "Editar pop-up" : "Novo pop-up"}
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
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          placeholder="Título (opcional)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />

        <ImageUpload
          value={editing.image_url}
          onChange={(url) => setEditing({ ...editing, image_url: url })}
          label="Imagem do pop-up (opcional)"
          folder="popups"
          aspect="aspect-[4/5]"
        />

        <textarea
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          placeholder="Texto exibido no pop-up (opcional)"
          rows={3}
          className="w-full rounded-xl border bg-card p-3 text-sm outline-none ring-ring focus:ring-2"
        />

        <input
          value={editing.link_url}
          onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
          placeholder="Link ao clicar no pop-up (opcional)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Duração (segundos)
            <input
              type="number"
              min={1}
              max={120}
              value={editing.duration_seconds}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  duration_seconds: Math.max(1, Number(e.target.value) || 10),
                })
              }
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Largura (px)
            <input
              type="number"
              min={240}
              max={1200}
              value={editing.width_px}
              onChange={(e) =>
                setEditing({ ...editing, width_px: Math.max(240, Number(e.target.value) || 520) })
              }
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Altura (px)
            <input
              type="number"
              min={240}
              max={1200}
              value={editing.height_px}
              onChange={(e) =>
                setEditing({ ...editing, height_px: Math.max(240, Number(e.target.value) || 620) })
              }
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              className="h-4 w-4"
            />
            Ativo (exibindo no site)
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Ordem
            <input
              type="number"
              value={editing.sort_order}
              onChange={(e) =>
                setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
              }
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          O pop-up aparece na primeira vez que a pessoa entra no site (por sessão). Ela pode fechar
          antes ou o pop-up some sozinho depois da duração escolhida. No celular, o tamanho é
          ajustado para caber na tela.
        </p>

        {message && <p className="text-sm text-destructive">{message}</p>}

        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar pop-up"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-black">Pop-ups de boas-vindas</h2>
          <p className="text-xs text-muted-foreground">
            O primeiro pop-up ativo (menor ordem) é exibido na home. Deixe todos inativos para não mostrar nada.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo pop-up
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.popups ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhum pop-up cadastrado. Clique em "Novo pop-up" para configurar o primeiro aviso.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.popups ?? []).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-[4/5] bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center p-4 text-center text-xs text-muted-foreground">
                    (sem imagem)
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold">{p.title || "Sem título"}</p>
                <p className="text-xs text-muted-foreground">
                  {p.duration_seconds}s · {p.width_px}×{p.height_px} · {p.active ? "Ativo" : "Inativo"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditing({
                        id: p.id,
                        title: p.title ?? "",
                        image_url: p.image_url ?? "",
                        link_url: p.link_url ?? "",
                        content: p.content ?? "",
                        duration_seconds: p.duration_seconds,
                        width_px: p.width_px,
                        height_px: p.height_px,
                        active: p.active,
                        sort_order: p.sort_order,
                      })
                    }
                    className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => del(p.id)}
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
