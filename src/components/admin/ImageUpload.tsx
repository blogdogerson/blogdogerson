import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// 10 years in seconds — signed URLs act as effectively permanent public links.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;
const MAX_MB = 15;
// WhatsApp/Facebook só geram a prévia do link com imagens leves.
const SHARE_MAX_BYTES = 450_000;
const SHARE_MAX_WIDTH = 1600;

/** Redimensiona/comprime a imagem para que a prévia de compartilhamento funcione. */
async function compressForSharing(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size <= SHARE_MAX_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, SHARE_MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let blob: Blob | null = null;
    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
      if (blob && blob.size <= SHARE_MAX_BYTES) break;
    }
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}



interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  aspect?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Imagem",
  folder = "geral",
  aspect = "aspect-video",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Arquivo muito grande (máximo ${MAX_MB} MB).`);
      return;
    }
    const isImage = file.type.startsWith("image/") || /\.(gif|png|jpe?g|webp|avif)$/i.test(file.name);
    if (!isImage) {
      setError("Envie um arquivo de imagem (JPG, PNG, GIF ou WebP).");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const uploadFile = await compressForSharing(file);
      const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("uploads")
        .upload(path, uploadFile, {
          cacheControl: "31536000",
          contentType: uploadFile.type,
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("uploads")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Falha ao gerar link");
      onChange(signed.signedUrl);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-bold hover:bg-secondary disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Enviando..." : "Enviar imagem"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid h-8 w-8 place-items-center rounded-lg border text-destructive hover:bg-destructive/10"
              aria-label="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/gif,.gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />


      {value ? (
        <div className={`overflow-hidden rounded-xl bg-muted ${aspect}`}>
          <img src={value} alt="Prévia" className="h-full w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-sky-soft/60 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60 ${aspect}`}
        >
          <Upload className="h-6 w-6 text-primary/70" />
          <span>Clique para enviar do computador</span>
          <span className="text-xs">JPG, PNG, GIF ou WebP · até {MAX_MB} MB</span>
        </button>
      )}

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou cole uma URL de imagem"
        className="h-9 w-full rounded-lg border bg-card px-3 text-xs outline-none ring-ring focus:ring-2"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
