import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Eye, Mail, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_portal/anuncie")({
  head: () => ({
    meta: [
      { title: "Anuncie no Blog do Gerson — Alcance Gramado e Região" },
      {
        name: "description",
        content:
          "Anuncie no Blog do Gerson e alcance milhares de leitores em Gramado, Canela e Região da Serra Gaúcha.",
      },
      { property: "og:title", content: "Anuncie no Blog do Gerson" },
    ],
    links: [{ rel: "canonical", href: "/anuncie" }],
  }),
  component: AdvertisePage,
});

function AdvertisePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="text-center">
        <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-primary">
          Publicidade
        </p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-6xl">
          Anuncie no <span className="text-gradient-brand">Blog do Gerson</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Sua marca ao lado do jornalismo mais atuante de Gramado, Canela e Região — com mais de 20
          anos de credibilidade e milhares de leitores diários.
        </p>
      </header>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Eye, title: "Grande audiência", desc: "Milhares de leitores por dia na Serra Gaúcha" },
          { icon: BarChart3, title: "Público qualificado", desc: "Moradores, empresários e turistas da região" },
          { icon: Megaphone, title: "Formatos variados", desc: "Banner topo, lateral e entre notícias" },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-card p-6 text-center shadow-card hover-lift">
            <f.icon className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 font-display text-lg font-black">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-navy p-10 text-center text-navy-foreground">
        <h2 className="font-display text-3xl font-black">Vamos conversar?</h2>
        <p className="mx-auto mt-2 max-w-xl text-navy-foreground/70">
          Entre em contato e receba a tabela de valores e formatos disponíveis para o seu anúncio.
        </p>
        <a
          href="mailto:gerson@blogdogerson.com.br?subject=Quero%20anunciar%20no%20Blog%20do%20Gerson"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <Mail className="h-5 w-5" /> gerson@blogdogerson.com.br
        </a>
      </div>
    </div>
  );
}
