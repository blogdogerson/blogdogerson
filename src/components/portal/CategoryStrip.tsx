import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/lib/categories";
import { categoryToSlug } from "@/lib/categories";
import { ArticleCard } from "./ArticleCard";

export function CategoryStrip({
  category,
  articles,
}: {
  category: string;
  articles: Article[];
}) {
  const pool = articles.filter((a) => a.category === category);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (pool.length <= 3) return;
    const t = setInterval(() => setOffset((o) => (o + 3) % pool.length), 9000);
    return () => clearInterval(t);
  }, [pool.length]);

  if (pool.length === 0) return null;

  const items = Array.from({ length: Math.min(3, pool.length) }, (_, i) => pool[(offset + i) % pool.length]);

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4 border-b pb-3">
        <h2 className="font-display text-xl font-black tracking-tight sm:text-2xl">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
          {category}
        </h2>
        <Link
          to="/editoria/$slug"
          params={{ slug: categoryToSlug(category) }}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div key={offset} className="grid animate-fade-up gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a, i) => (
          <ArticleCard key={a.id} article={a} compact={i > 0} />
        ))}
      </div>
    </section>
  );
}
