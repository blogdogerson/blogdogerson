import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, categoryToSlug } from "@/lib/categories";
import { RadioButton } from "./RadioPlayer";
import logoAsset from "@/assets/logo-blog-do-gerson.png.asset.json";
import gersonAsset from "@/assets/gerson-sorgetz.png.asset.json";

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-3 sm:gap-4" aria-label="Blog do Gerson — início">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 shadow-card transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16">
        <img
          src={gersonAsset.url}
          alt="Gerson Sorgetz"
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      <div className="relative min-w-0 overflow-hidden">
        <img
          src={logoAsset.url}
          alt="Blog do Gerson — Portal de Notícias"
          className="h-10 w-auto object-contain sm:h-14 md:h-16"
          loading="eager"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,oklch(1_0_0/0.55)_50%,transparent_65%)] bg-[length:250%_100%] animate-logo-shine" />
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setSearchOpen(false);
    setOpen(false);
    navigate({ to: "/busca", search: { q: query } });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md">
      {/* Top bar */}
      <div className="border-b bg-sky-soft">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4">
          <p className="hidden text-xs font-medium text-muted-foreground sm:block">
            Gramado, Canela e Região da Serra Gaúcha — desde 2005
          </p>
          <div className="flex items-center gap-2">
            <RadioButton />
            <Link
              to="/anuncie"
              className="rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Anuncie no Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:py-4">
        <Logo />
        <div className="flex items-center gap-1.5">
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

      {/* Nav */}
      <nav className={`${open ? "block" : "hidden"} border-t lg:block`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 lg:flex-row lg:items-center lg:gap-0 lg:py-0">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to="/editoria/$slug"
              params={{ slug: categoryToSlug(cat) }}
              onClick={() => setOpen(false)}
              activeProps={{ className: "text-primary after:scale-x-100" }}
              className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
            >
              {cat}
            </Link>
          ))}
          <span className="hidden flex-1 lg:block" />
          <Link
            to="/quem-escreve"
            onClick={() => setOpen(false)}
            activeProps={{ className: "text-primary" }}
            className="story-link px-0 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary lg:px-3 lg:py-3"
          >
            Quem escreve
          </Link>
        </div>
      </nav>
    </header>
  );
}
