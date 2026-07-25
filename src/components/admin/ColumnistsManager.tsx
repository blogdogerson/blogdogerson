import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDown, ArrowUp, KeyRound, Plus, Trash2, UserX } from "lucide-react";
import {
  adminListColumnists,
  adminSaveColumnist,
  adminDeleteColumnist,
  adminReorderColumnists,
  type Columnist,
} from "@/lib/columnists.functions";
import { adminCreateColumnistLogin, adminUnlinkColumnistUser } from "@/lib/admin.functions";
import { ImageUpload } from "./ImageUpload";

interface Editing {
  id?: string;
  name: string;
  slug: string;
  specialty: string;
  bio: string;
  avatar_url: string;
  latest_title: string;
  latest_excerpt: string;
  link_url: string;
  accent_color: string;
  active: boolean;
  sort_order: number;
}

const EMPTY: Editing = {
  name: "",
  slug: "",
  specialty: "Coluna Social",
  bio: "",
  avatar_url: "",
  latest_title: "",
  latest_excerpt: "",
  link_url: "",
  accent_color: "#3b82f6",
  active: true,
  sort_order: 0,
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ColumnistsManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListColumnists);
  const save = useServerFn(adminSaveColumnist);
  const remove = useServerFn(adminDeleteColumnist);
  const reorder = useServerFn(adminReorderColumnists);
  const createLogin = useServerFn(adminCreateColumnistLogin);
  const unlinkLogin = useServerFn(adminUnlinkColumnistUser);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loginBusy, setLoginBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-columnists"], queryFn: () => list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-columnists"] });
    queryClient.invalidateQueries({ queryKey: ["columnists"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const move = async (index: number, direction: -1 | 1) => {
    const items = data?.columnists ?? [];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // optimistic
    queryClient.setQueryData(["admin-columnists"], {
      columnists: ids.map((id, i) => ({ ...items.find((c) => c.id === id)!, sort_order: i })),
    });
    const res = await reorder({ data: { ids } });
    if (!res.ok) setMessage(res.error ?? "Erro ao reordenar");
    refresh();
  };

  const handleCreateLogin = async (c: Columnist) => {
    const email = window.prompt(
      `E-mail de acesso para ${c.name}\n(o colunista usará este e-mail para logar em /auth)`,
    );
    if (!email) return;
    const password = window.prompt(
      "Senha inicial (mínimo 8 caracteres).\nAnote e envie ao colunista — ele pode trocar depois.",
    );
    if (!password || password.length < 8) {
      alert("Senha muito curta. Use ao menos 8 caracteres.");
      return;
    }
    setLoginBusy(c.id);
    try {
      const res = await createLogin({ data: { columnistId: c.id, email, password } });
      if (res.ok) {
        alert(
          `Login pronto!\n\nE-mail: ${res.email}\nSenha: ${password}\n\nO colunista deve entrar em /auth com esses dados e será levado ao painel dele.`,
        );
        refresh();
      } else {
        alert(res.error ?? "Não foi possível criar o login.");
      }
    } finally {
      setLoginBusy(null);
    }
  };

  const handleUnlinkLogin = async (c: Columnist) => {
    if (!confirm(`Remover o login vinculado a ${c.name}? A conta continua existindo, mas perde o acesso ao painel do colunista.`)) return;
    setLoginBusy(c.id);
    try {
      await unlinkLogin({ data: { columnistId: c.id } });
      refresh();
    } finally {
      setLoginBusy(null);
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
          avatar_url: editing.avatar_url || null,
          link_url: editing.link_url || null,
        },
      });
      if (res.ok) {
        setEditing(null);
        refresh();
      } else setMessage(res.error ?? "Erro ao salvar");
    } catch (err: any) {
      setMessage(err?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este colunista?")) return;
    await remove({ data: { id } });
    refresh();
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {editing.id ? "Editar colunista" : "Novo colunista"}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={editing.name}
            onChange={(e) => {
              const name = e.target.value;
              setEditing({
                ...editing,
                name,
                slug: editing.id ? editing.slug : slugify(name),
              });
            }}
            placeholder="Nome do colunista"
            className="h-11 rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
          />
          <input
            required
            value={editing.slug}
            onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
            placeholder="slug-url (identificador)"
            className="h-11 rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        <input
          required
          value={editing.specialty}
          onChange={(e) => setEditing({ ...editing, specialty: e.target.value })}
          placeholder="Especialidade (ex: Coluna Social, Opinião)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />

        <textarea
          value={editing.bio}
          onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
          placeholder="Bio curta (até 2000 caracteres)"
          rows={3}
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
        />

        <ImageUpload
          value={editing.avatar_url}
          onChange={(url) => setEditing({ ...editing, avatar_url: url })}
          label="Foto de perfil"
          folder="colunistas"
          aspect="aspect-square"
        />

        <div className="rounded-2xl border bg-sky-soft/40 p-4">
          <p className="mb-2 font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
            Última coluna (destaque)
          </p>
          <input
            value={editing.latest_title}
            onChange={(e) => setEditing({ ...editing, latest_title: e.target.value })}
            placeholder="Título da última coluna"
            className="mb-2 h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
          />
          <textarea
            value={editing.latest_excerpt}
            onChange={(e) => setEditing({ ...editing, latest_excerpt: e.target.value })}
            placeholder="Resumo/chamada da última coluna"
            rows={2}
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        <input
          value={editing.link_url}
          onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
          placeholder="Link para o conteúdo do colunista (opcional)"
          className="h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none ring-ring focus:ring-2"
        />

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-xl border bg-card px-4 text-sm">
            <span className="font-semibold">Cor</span>
            <input
              type="color"
              value={editing.accent_color}
              onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })}
              className="h-8 w-10 cursor-pointer rounded border"
            />
          </label>
          <input
            type="number"
            value={editing.sort_order}
            onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })}
            placeholder="Ordem"
            className="h-11 rounded-xl border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <label className="flex items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold">
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
          {saving ? "Salvando..." : "Salvar colunista"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-black">Colunistas</h2>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo colunista
        </button>
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Carregando...</p>
      ) : (data?.columnists ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nenhum colunista cadastrado.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.columnists ?? []).map((c: Columnist, idx: number) => {
            const total = (data?.columnists ?? []).length;
            return (
            <div
              key={c.id}
              className="overflow-hidden rounded-2xl border bg-card"
              style={{ borderColor: `${c.accent_color}33` }}
            >
              <div
                className="h-1.5 w-full"
                style={{ background: c.accent_color }}
              />
              <div className="flex items-start gap-3 p-4">
                <div
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                  style={{ background: `${c.accent_color}22` }}
                >
                  {c.avatar_url && (
                    <img src={c.avatar_url} alt={c.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: c.accent_color }}
                  >
                    {c.specialty}
                  </p>
                  <p className="truncate font-display font-black">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.active ? "Ativo" : "Inativo"} · ordem {c.sort_order}
                  </p>
                  {(c as any).user_id ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <KeyRound className="h-3 w-3" /> Login ativo
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sem login
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setEditing({
                          ...EMPTY,
                          ...c,
                          avatar_url: c.avatar_url ?? "",
                          link_url: c.link_url ?? "",
                        })
                      }
                      className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleCreateLogin(c)}
                      disabled={loginBusy === c.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                      title={(c as any).user_id ? "Redefinir senha do login" : "Criar login para o colunista"}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {(c as any).user_id ? "Trocar senha" : "Criar login"}
                    </button>
                    {(c as any).user_id && (
                      <button
                        onClick={() => handleUnlinkLogin(c)}
                        disabled={loginBusy === c.id}
                        className="grid h-8 w-8 place-items-center rounded-lg border text-muted-foreground hover:bg-secondary"
                        title="Desvincular login"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => del(c.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
