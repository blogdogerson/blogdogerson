import { useRef, useState } from "react";
import {
  Bold,
  Eye,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  Loader2,
  Pencil,
  Quote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toDisplayHtml } from "@/lib/richtext";

// 10 anos — links assinados funcionam como links públicos permanentes.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  folder?: string;
  required?: boolean;
}

/**
 * Editor de texto com barra de formatação simples.
 * Escreva normalmente (Enter duplo = novo parágrafo); selecione um trecho e
 * use os botões para negrito, itálico, subtítulo, citação, link e imagem.
 */
export function RichTextArea({
  value,
  onChange,
  placeholder,
  rows = 16,
  folder = "conteudo",
  required,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const insert = (before: string, after: string, fallback: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart ?? value.length;
    const e = ta.selectionEnd ?? value.length;
    const sel = value.slice(s, e) || fallback;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };

  const insertLink = () => {
    const url = window.prompt("Endereço do link (https://...):");
    if (!url) return;
    insert(`<a href="${url}" target="_blank" rel="noreferrer">`, "</a>", "clique aqui");
  };

  const insertImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (máximo 5 MB).");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Envie um arquivo de imagem.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("uploads")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("uploads")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Falha ao gerar link");
      insert(`\n\n<img src="${signed.signedUrl}" alt="" />\n\n`, "", "");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const btn =
    "inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-2.5 text-xs font-bold hover:bg-secondary disabled:opacity-60";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => insert("<strong>", "</strong>", "texto em negrito")} className={btn} title="Negrito">
          <Bold className="h-3.5 w-3.5" /> Negrito
        </button>
        <button type="button" onClick={() => insert("<em>", "</em>", "texto em itálico")} className={btn} title="Itálico">
          <Italic className="h-3.5 w-3.5" /> Itálico
        </button>
        <button type="button" onClick={() => insert("\n\n<h2>", "</h2>\n\n", "Subtítulo")} className={btn} title="Subtítulo">
          <Heading2 className="h-3.5 w-3.5" /> Subtítulo
        </button>
        <button type="button" onClick={() => insert("\n\n<blockquote>", "</blockquote>\n\n", "citação")} className={btn} title="Citação">
          <Quote className="h-3.5 w-3.5" /> Citação
        </button>
        <button type="button" onClick={insertLink} className={btn} title="Link">
          <Link2 className="h-3.5 w-3.5" /> Link
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={btn}
          title="Inserir imagem no texto"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {uploading ? "Enviando..." : "Imagem"}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`${btn} ${preview ? "border-primary text-primary" : ""}`}
        >
          {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? "Editar" : "Visualizar"}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && insertImage(e.target.files[0])}
      />

      {preview ? (
        <div
          className="article-body min-h-40 w-full rounded-xl border bg-card p-5"
          dangerouslySetInnerHTML={{ __html: toDisplayHtml(value) }}
        />
      ) : (
        <textarea
          ref={taRef}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-xl border bg-card p-4 text-sm leading-relaxed outline-none ring-ring focus:ring-2"
        />
      )}

      <p className="text-xs text-muted-foreground">
        Dica: deixe uma linha em branco entre parágrafos. Selecione um trecho e use os botões
        para formatar. "Imagem" envia a foto e coloca no ponto onde o cursor está.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
