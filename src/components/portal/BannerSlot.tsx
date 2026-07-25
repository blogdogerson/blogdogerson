import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Banner } from "@/lib/categories";

function BannerFrame({
  banner,
  className,
  fit = "cover",
}: {
  banner: Banner;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const img = (
    <img
      src={banner.image_url}
      alt={banner.title || "Anúncio"}
      loading="lazy"
      className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
    />
  );
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-navy shadow-card hover-lift ${className ?? ""}`}
    >
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noreferrer sponsored" aria-label={banner.title || "Anúncio"} className="block h-full w-full">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}

function Placeholder({ className, tall }: { className?: string; tall?: boolean }) {
  return (
    <Link
      to="/anuncie"
      className={`group flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-primary/25 bg-sky-soft text-center transition-colors hover:border-primary/50 ${
        tall ? "min-h-52" : "min-h-24"
      } ${className ?? ""}`}
    >
      <span className="font-display text-sm font-black uppercase tracking-widest text-primary/70 group-hover:text-primary">
        Anuncie aqui
      </span>
      <span className="text-xs text-muted-foreground">Blog do Gerson · fale conosco</span>
    </Link>
  );
}

/** Rotating top banner (carousel with auto-advance). */
export function TopBannerCarousel({ banners }: { banners: Banner[] }) {
  const items = banners.filter((b) => b.position === "top");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return <Placeholder tall className="mx-auto w-full max-w-6xl" />;

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Leaderboard grande (base 970×250) — mantém a proporção do banner em qualquer tela
          para não cortar no mobile. `object-contain` evita corte lateral. */}
      <BannerFrame
        banner={items[index % items.length]}
        fit="contain"
        className="aspect-[970/250] w-full"
      />
      {items.length > 1 && (
        <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index % items.length ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Fixed 300×300 square banners stacked — left rail next to the category segments. */
export function SquareBannerStack({ banners, max = 20 }: { banners: Banner[]; max?: number }) {
  const items = banners
    .filter((b) => b.active && b.position === "sidebar")
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, max);

  if (items.length === 0)
    return (
      <div className="mx-auto w-full max-w-[300px] lg:mx-0">
        <Placeholder tall className="aspect-square" />
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col gap-4 lg:mx-0">
      {items.map((b) => (
        <BannerFrame key={b.id} banner={b} className="aspect-square w-full" />
      ))}
    </div>
  );
}

export function SidebarBanners({ banners, max = 4 }: { banners: Banner[]; max?: number }) {
  const items = banners.filter((b) => b.position === "sidebar").slice(0, max);
  if (items.length === 0)
    return (
      <div className="space-y-4">
        <Placeholder tall />
      </div>
    );
  return (
    <div className="space-y-4">
      {items.map((b) => (
        <BannerFrame key={b.id} banner={b} />
      ))}
    </div>
  );
}

export function InlineBanner({ banners, index = 0 }: { banners: Banner[]; index?: number }) {
  const items = banners.filter((b) => b.position === "inline");
  if (items.length === 0) return <Placeholder />;
  const banner = items[index % items.length];
  return <BannerFrame banner={banner} className="aspect-[4/1] sm:aspect-[8/1]" />;
}
