import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Mail, Radio } from "lucide-react";
import { RADIO_STREAM_URL } from "@/lib/categories";
import { topicsQuery } from "@/lib/topics.functions";
import { NewsletterForm } from "./NewsletterForm";
import logoBrancoAsset from "@/assets/logo-blog-do-gerson-branco.png.asset.json";



export function Footer() {
  const { data: topicsData } = useQuery(topicsQuery);
  const topics = topicsData?.topics ?? [];
  return (
    <footer className="mt-16 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <Link to="/" aria-label="Blog do Gerson" className="inline-block">
            <img
              src={logoBrancoAsset.url}
              alt="Blog do Gerson"
              className="h-20 w-auto object-contain mix-blend-screen sm:h-24"
              loading="lazy"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-foreground/70">
            Jornalismo sério e comprometido com Gramado, Canela, Nova Petrópolis e Região desde
            2005. Editado pelo jornalista Gerson Sorgetz.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <a
              href="mailto:gerson@blogdogerson.com.br"
              className="inline-flex items-center gap-2 text-navy-foreground/80 transition-colors hover:text-navy-foreground"
            >
              <Mail className="h-4 w-4" /> gerson@blogdogerson.com.br
            </a>
            <a
              href="https://instagram.com/blogdogerson"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-navy-foreground/80 transition-colors hover:text-navy-foreground"
            >
              <Instagram className="h-4 w-4" /> @blogdogerson
            </a>
            <a
              href={RADIO_STREAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-navy-foreground/80 transition-colors hover:text-navy-foreground"
            >
              <Radio className="h-4 w-4" /> Rádio Gramado News ao vivo
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-navy-foreground/75">
            Editorias
          </h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  to="/editoria/$slug"
                  params={{ slug: categoryToSlug(cat) }}
                  className="text-navy-foreground/80 transition-colors hover:text-navy-foreground"
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/quem-escreve" className="text-navy-foreground/80 hover:text-navy-foreground">
                Perfil do Colunista
              </Link>
            </li>
            <li>
              <Link to="/anuncie" className="text-navy-foreground/80 hover:text-navy-foreground">
                Anuncie
              </Link>
            </li>
            <li>
              <Link to="/auth" className="text-navy-foreground/50 hover:text-navy-foreground">
                Painel administrativo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-navy-foreground/75">
            Newsletter
          </h3>
          <p className="mb-4 text-sm text-navy-foreground/70">
            Receba as principais notícias da região no seu e-mail.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-navy-foreground/70 sm:flex-row">
          <p>© {new Date().getFullYear()} Blog do Gerson — blogdogerson.com.br</p>
          <p>Todos os direitos reservados: Abimael Rodrigues @euabimael</p>
        </div>
      </div>
    </footer>
  );
}
