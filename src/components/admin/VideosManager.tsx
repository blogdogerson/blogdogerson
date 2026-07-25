import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminListVideos, adminSaveVideo, adminDeleteVideo } from "@/lib/admin.functions";
import { VIDEO_SECTIONS } from "@/lib/categories";

interface Editing {
  id?: string;
  section: string;
  title: string;
  embed_url: string;
  orientation: "horizontal" | "vertical";
  active: boolean;
  sort_order: number;
  episode_number: string;
}

const EMPTY: Editing = {
  section: "podcast-cafezinho",
  title: "",
  embed_url: "",
  orientation: "horizontal",
  active: true,
  sort_order: 0,
  episode_number: "",
};


/** Convert common YouTube/Instagram URLs to embeddable URLs. */
function toEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}

export function VideosManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListVideos);
  const save = useServerFn(adminSaveVideo);
  const remove = useServerFn(adminDeleteVideo);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-videos"], queryFn: () => list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await save({ data: { ...editing, embed_url: toEmbed(editing.embed_url), episode_number: editing.episode_number.trim() || null } });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este vídeo?")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">{editing.id ? "Editar vídeo" : "Novo vídeo"}</h2>
          <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        </div>
        <select
          value={editing.section}
          onChange={(e) => {
            const section = e.target.value;
            const def = VIDEO_SECTIONS.find((s) => s.key === section);
            setEditing({ ...editing, section, orientation: (def?.orientation as Editing["orientation"]) ?? "vertical" });
          }}
          className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
        >
          {VIDEO_SECTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          placeholder={editing.section === "gramado-visao-de-futuro" ? "Nome do episódio" : "Título do vídeo"}
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        {editing.section === "gramado-visao-de-futuro" && (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Número do episódio
            </label>
            <input
              value={editing.episode_number}
              onChange={(e) => setEditing({ ...editing, episode_number: e.target.value })}
              placeholder="Ex.: 01, 02, 15"
              className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Deixe em branco para numerar automaticamente pela ordem.
            </p>
          </div>
        )}

        <input
          required
          value={editing.embed_url}
          onChange={(e) => setEditing({ ...editing, embed_url: e.target.value })}
          placeholder="Link do YouTube (vídeo ou Shorts)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="radio"
              checked={editing.orientation === "horizontal"}
              onChange={() => setEditing({ ...editing, orientation: "horizontal" })}
            />
            Horizontal
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="radio"
              checked={editing.orientation === "vertical"}
              onChange={() => setEditing({ ...editing, orientation: "vertical" })}
            />
            Vertical
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              className="h-4 w-4"
            />
            Ativo
          </label>
        </div>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar vídeo"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-black">Vídeos</h2>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo vídeo
        </button>
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.videos ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhum vídeo cadastrado. Adicione vídeos do Podcast Cafezinho, TV Gramado News e mais.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {(data?.videos ?? []).map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-secondary/50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{v.title || v.embed_url}</p>
                <p className="text-xs text-muted-foreground">
                  {VIDEO_SECTIONS.find((s) => s.key === v.section)?.label ?? v.section} · {v.orientation} ·{" "}
                  {v.active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <button
                onClick={() =>
                  setEditing({
                    id: v.id,
                    section: v.section,
                    title: v.title ?? "",
                    embed_url: v.embed_url,
                    orientation: v.orientation,
                    active: v.active,
                    sort_order: v.sort_order,
                    episode_number: v.episode_number ?? "",
                  })
                }

                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Editar
              </button>
              <button
                onClick={() => del(v.id)}
                className="grid h-8 w-8 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
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
