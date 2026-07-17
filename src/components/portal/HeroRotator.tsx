import { useEffect, useState } from "react";
import { HeroCard } from "./ArticleCard";
import type { Article } from "@/lib/categories";

export function HeroRotator({ articles }: { articles: Article[] }) {
  const items = articles.slice(0, 5);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 6500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[i % items.length];

  return (
    <div className="relative">
      <div key={current.id} className="animate-fade-up">
        <HeroCard article={current} />
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Notícia em destaque ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i % items.length ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
