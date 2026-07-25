import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Menu, PenLine, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { topicsQuery } from "@/lib/topics.functions";
import { RadioButton } from "./RadioPlayer";
// Dark theme: use the white version of the wordmark
import logoAsset from "@/assets/logo-blog-do-gerson-branco.png.asset.json";
import gersonAsset from "@/assets/gerson-sorgetz.png.asset.json";

// Reveal the wordmark in 4 horizontal bands (top rule, subtitle,
// main "Blog do Gerson", bottom rule + tagline), each fading in with stagger.
const LOGO_BANDS: Array<{ clip: string; delay: string }> = [
  { clip: "inset(0 0 88% 0)", delay: "0.05s" },      // top rule
  { clip: "inset(6% 0 66% 0)", delay: "0.3s" },      // "PORTAL DE NOTÍCIAS"
  { clip: "inset(28% 0 22% 0)", delay: "0.55s" },    // "Blog do Gerson"
  { clip: "inset(74% 0 0 0)", delay: "0.85s" },      // bottom rule + tagline
];

function AnimatedLogo({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`relative block w-auto transition-all duration-300 ${
        compact ? "h-9 sm:h-11" : "h-12 sm:h-20 md:h-24"
      }`}
    >
      {/* mix-blend-screen: o fundo preto do PNG desaparece sobre o tema escuro,
          sem retângulo demarcando a imagem */}
      <img
        src={logoAsset.url}
        alt="Blog do Gerson — Portal de Notícias · Opinião e informação com credibilidade"
        className="block h-full w-auto object-contain opacity-0"
        loading="eager"
        aria-hidden={false}
      />
      {LOGO_BANDS.map((b, i) => (
        <img
          key={i}
          src={logoAsset.url}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-auto object-contain mix-blend-screen animate-logo-band"
          style={{ clipPath: b.clip, animationDelay: b.delay }}
        />
      ))}
      {/* Brilho que percorre apenas as letras (máscara de luminância do próprio logo) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden animate-logo-shine bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.75)_50%,transparent_60%)] bg-[length:250%_100%] supports-[mask-mode:luminance]:block"
        style={{
          maskImage: `url(${logoAsset.url})`,
          maskMode: "luminance",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "left center",
          animationDelay: "1.4s",
        }}
      />
    </span>
  );
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`group mx-auto flex flex-row items-center transition-all duration-300 ${
        compact ? "gap-3" : "gap-3 sm:gap-5"
      }`}
      aria-label="Blog do Gerson — início"
    >
      <div className="relative shrink-0">
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,oklch(0.72_0.14_245),oklch(0.6_0.18_255),oklch(0.85_0.09_230),oklch(0.72_0.14_245))] opacity-70 blur-[6px] transition-opacity duration-300 group-hover:opacity-100"
        />
        <div
          className={`relative overflow-hidden rounded-full ring-2 ring-card shadow-float transition-all duration-300 group-hover:scale-105 ${
            compact ? "h-10 w-10 sm:h-12 sm:w-12" : "h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24"
          }`}
        >
          <img
            src={gersonAsset.url}
            alt="Gerson Sorgetz"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>
      <div className="relative min-w-0 overflow-hidden">
        <AnimatedLogo compact={compact} />
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { data: topicsData } = useQuery(topicsQuery);
  const topics = topicsData?.topics ?? [];

  useEffect(() => {
    // Dois limites diferentes (histerese) para o header não ficar "piscando":
    // só encolhe depois de rolar bastante e só volta perto do topo.
    const onScroll = () =>
      setScrolled((prev) => (prev ? window.scrollY > 40 : window.scrollY > 160));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setSearchOpen(false);
    setOpen(false);
    navigate({ to: "/busca", search: { q: query } });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/70 bg-card/85 shadow-card backdrop-blur-xl"
          : "border-transparent bg-card/70 backdrop-blur-md"
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.97_0.02_240/0.6),transparent)]" />
        <svg
          className="absolute inset-x-0 bottom-0 h-10 w-full"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
        >
          <path
            className="animate-wave-slow"
            fill="oklch(0.72 0.14 245 / 0.12)"
            d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z"
          />
        </svg>
      </div>

      <div
        className={`overflow-hidden border-b border-border/60 bg-gradient-to-r from-sky-soft via-transparent to-sky-soft transition-all duration-300 ${
          scrolled ? "max-h-0 border-transparent opacity-0" : "max-h-9 opacity-100"
        }`}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4">
          <p className="hidden text-xs font-medium text-muted-foreground sm:block">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot align-middle" />
            Gramado, Canela e Região da Serra Gaúcha — desde 2005
          </p>
          <div className="flex items-center gap-2">
            <RadioButton />
            <a
              href="https://www.instagram.com/gersonsorgetz"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Gerson Sorgetz"
              className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 text-primary transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/anuncie"
              className="rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Anuncie no Blog
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 transition-all duration-300 ${
          scrolled ? "py-2" : "py-3 sm:py-4"
        }`}
      >
        <div className="hidden md:block" />
        <Logo compact={scrolled} />
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to="/colunistas"
            className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-primary-foreground md:inline-flex"
          >
            <PenLine className="h-3.5 w-3.5" /> Colunistas
          </Link>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Pesquisar"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t bg-card px-4 py-3 animate-fade-up">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar notícias..."
              maxLength={120}
              className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none ring-ring focus:ring-2"
            />
            <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Buscar
            </button>
          </form>
        </div>
      )}

      <nav
        className={`${
          open ? "block" : "hidden"
        } border-t border-border/60 bg-background shadow-card lg:block lg:bg-transparent lg:shadow-none`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 lg:flex-row lg:items-center lg:gap-0 lg:py-0">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            onClick={() => setOpen(false)}
            activeProps={{ className: "text-primary" }}
            className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
          >
            Início
          </Link>
          {topics.map((t) => (
            <Link
              key={t.id}
              to="/editoria/$slug"
              params={{ slug: t.slug }}
              onClick={() => setOpen(false)}
              activeProps={{ className: "text-primary after:scale-x-100" }}
              className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
            >
              {t.name}
            </Link>
          ))}
          <span className="hidden flex-1 lg:block" />
          <Link
            to="/colunistas"
            onClick={() => setOpen(false)}
            activeProps={{ className: "text-primary" }}
            className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
          >
            Colunistas
          </Link>
          <Link
            to="/"
            hash="videos"
            onClick={() => setOpen(false)}
            className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
          >
            Vídeos
          </Link>
          <Link
            to="/quem-escreve"
            onClick={() => setOpen(false)}
            activeProps={{ className: "text-primary" }}
            className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
          >
            Perfil do Colunista
          </Link>
        </div>
      </nav>
    </header>
  );
}
