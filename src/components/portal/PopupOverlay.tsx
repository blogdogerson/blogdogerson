import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { getActivePopup, type Popup } from "@/lib/popups.functions";

const STORAGE_PREFIX = "popup-vista:";

export function PopupOverlay() {
  const { data } = useQuery({
    queryKey: ["active-popup"],
    queryFn: () => getActivePopup(),
    staleTime: 60_000,
  });

  const popup = data?.popup ?? null;
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!popup) return;
    try {
      if (sessionStorage.getItem(STORAGE_PREFIX + popup.id) === "1") return;
      sessionStorage.setItem(STORAGE_PREFIX + popup.id, "1");
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [popup?.id]);

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  };

  useEffect(() => {
    if (!visible || !popup) return;
    const t = setTimeout(close, Math.max(1, popup.duration_seconds) * 1000);
    return () => clearTimeout(t);
  }, [visible, popup?.duration_seconds]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!popup || !visible) return null;
  return <PopupContent popup={popup} closing={closing} onClose={close} />;
}

function PopupContent({
  popup,
  closing,
  onClose,
}: {
  popup: Popup;
  closing: boolean;
  onClose: () => void;
}) {
  const inner = (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-float"
      onClick={(e) => e.stopPropagation()}
    >
      {popup.image_url && (
        <div className="relative w-full flex-1 overflow-hidden bg-muted">
          <img
            src={popup.image_url}
            alt={popup.title || "Aviso"}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      {(popup.title || popup.content) && (
        <div className="space-y-2 p-5 sm:p-6">
          {popup.title && (
            <h2 className="font-display text-xl font-black leading-tight text-foreground">
              {popup.title}
            </h2>
          )}
          {popup.content && (
            <p className="text-sm leading-relaxed text-muted-foreground">{popup.content}</p>
          )}
        </div>
      )}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || "Aviso"}
      className={`fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="w-full max-w-[95vw]"
        style={{
          maxWidth: `min(95vw, ${popup.width_px}px)`,
          height: `min(85vh, ${popup.height_px}px)`,
        }}
      >
        {popup.link_url ? (
          <a
            href={popup.link_url}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {inner}
          </a>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
