import { useEffect, useState } from "react";

/**
 * Vinheta de abertura da home.
 * Aparece uma vez por visita (sessionStorage), com botão "Pular",
 * e some sozinha quando o vídeo termina.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("intro-vista") === "1") return;
      sessionStorage.setItem("intro-vista", "1");
      setVisible(true);
    } catch {
      // sem sessionStorage (modo privado antigo): mostra mesmo assim
      setVisible(true);
    }
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 500);
  };

  // Segurança: se o vídeo não carregar/terminar, fecha sozinho
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(close, 12000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-navy transition-opacity duration-500 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="Vinheta de abertura do Blog do Gerson"
    >
      <video
        src="/intro-blog-do-gerson.mp4"
        autoPlay
        muted
        playsInline
        onEnded={close}
        onError={close}
        className="h-full w-full object-cover"
      />
      <button
        onClick={close}
        className="absolute bottom-6 right-6 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-black/60"
      >
        Pular introdução
      </button>
    </div>
  );
}
