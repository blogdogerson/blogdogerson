import { useEffect } from "react";

/**
 * Proteção básica de conteúdo do portal:
 * - bloqueia menu de contexto (botão direito) fora de campos de formulário
 * - bloqueia cópia/recorte e arrastar imagens
 * - bloqueia atalhos comuns (Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, F12...)
 *
 * Observação: é uma barreira contra cópia casual — não impede quem realmente
 * insistir (o navegador sempre consegue ler o HTML).
 */
function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest("input, textarea, select, [contenteditable='true']");
}

export function ContentProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const k = e.key.toLowerCase();
      if (e.key === "F12") return e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "u", "s", "p"].includes(k)) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("content-protected");

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("content-protected");
    };
  }, []);

  return null;
}
