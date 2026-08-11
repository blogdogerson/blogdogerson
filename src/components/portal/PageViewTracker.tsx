import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function kindFromPath(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/noticia/") || /^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "noticia";
  if (path.startsWith("/coluna/")) return "coluna";
  if (path.startsWith("/colunista/")) return "colunista";
  if (path.startsWith("/editoria/")) return "editoria";
  if (path.startsWith("/videos/")) return "video";
  if (path.startsWith("/busca")) return "busca";
  return "pagina";
}

/** Registra os acessos de cada página para o relatório do painel administrativo. */
export function PageViewTracker() {
  const location = useLocation();
  const path = location.pathname;
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path.startsWith("/admin") || path.startsWith("/minhas-colunas") || path.startsWith("/auth")) return;
    if (lastPath.current === path) return;
    lastPath.current = path;

    const timer = window.setTimeout(() => {
      const title = (document.title || "").slice(0, 300);
      let referrer: string | null = null;
      try {
        referrer = document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : null;
      } catch {
        referrer = null;
      }
      void supabase
        .from("page_views")
        .insert({ path: path.slice(0, 512), kind: kindFromPath(path), title, referrer })
        .then(() => undefined);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [path]);

  return null;
}
