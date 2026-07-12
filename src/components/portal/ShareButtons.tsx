import { Check, Facebook, Instagram, Link2, Send } from "lucide-react";
import { useState } from "react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.13c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/noticia/${slug}` : `/noticia/${slug}`;
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const btn =
    "grid h-9 w-9 place-items-center rounded-full transition-all hover:scale-110 hover:shadow-card";

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`https://api.whatsapp.com/send?text=${text}%20${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no WhatsApp"
        className={`${btn} bg-[oklch(0.72_0.19_150)] text-primary-foreground`}
      >
        <WhatsAppIcon className="h-4.5 w-4.5" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no Facebook"
        className={`${btn} bg-[oklch(0.5_0.17_262)] text-primary-foreground`}
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={`https://t.me/share/url?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no Telegram"
        className={`${btn} bg-[oklch(0.65_0.13_235)] text-primary-foreground`}
      >
        <Send className="h-4 w-4" />
      </a>
      <a
        href="https://www.instagram.com/blogdogerson"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram do Blog do Gerson"
        className={`${btn} bg-gradient-brand text-primary-foreground`}
      >
        <Instagram className="h-4 w-4" />
      </a>
      <button onClick={copy} aria-label="Copiar link" className={`${btn} bg-secondary text-foreground`}>
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
