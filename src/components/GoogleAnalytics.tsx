import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const GOOGLE_ANALYTICS_ID = "G-DR1C2MQH0V";
const PRODUCTION_HOSTS = new Set([
  "blogdogerson.com.br",
  "www.blogdogerson.com.br",
]);

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function initializeGoogleAnalytics() {
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(this: unknown, ..._args: unknown[]) {
    window.dataLayer?.push(Array.prototype.slice.call(arguments));
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GOOGLE_ANALYTICS_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);
}

export function GoogleAnalytics() {
  const href = useRouterState({
    select: (state) => state.location.href,
  });

  useEffect(() => {
    if (!PRODUCTION_HOSTS.has(window.location.hostname)) return;

    initializeGoogleAnalytics();
    window.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title,
    });
  }, [href]);

  return null;
}
