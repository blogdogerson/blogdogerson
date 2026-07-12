import { createFileRoute } from "@tanstack/react-router";
import { Mail, Mic, Newspaper, Radio } from "lucide-react";
import { NewsletterForm } from "@/components/portal/NewsletterForm";
import { RADIO_STREAM_URL } from "@/lib/categories";

export const Route = createFileRoute("/_portal/quem-escreve")({
  head: () => ({
    meta: [
      { title: "Quem escreve — Gerson Sorgetz | Blog do Gerson" },
      {
        name: "description",
        content:
          "Gerson Sorgetz: jornalista, blogueiro, influencer e editor do Blog do Gerson. Um dos jornalistas mais atuantes em Gramado, desde 2005.",
      },
      { property: "og:title", content: "Quem escreve — Gerson Sorgetz" },
      {
        property: "og:description",
        content: "Jornalista, blogueiro, influencer e editor do Blog do Gerson.",
      },
    ],
    links: [{ rel: "canonical", href: "/quem-escreve" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-gradient-brand shadow-float md:h-48 md:w-48">
          <span className="font-display text-7xl font-black text-primary-foreground">GS</span>
        </div>
        <div>
          <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-primary">
            Quem escreve
          </p>
          <h1 className="mt-1 font-display text-4xl font-black sm:text-5xl">Gerson Sorgetz</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Jornalista, blogueiro, influencer e editor do Blog do Gerson.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="mailto:gerson@blogdogerson.com.br"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" /> gerson@blogdogerson.com.br
            </a>
            <a
              href={RADIO_STREAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <Radio className="h-4 w-4" /> Rádio Gramado News
            </a>
          </div>
        </div>
      </header>

      <div className="prose-lg mt-12 space-y-5 text-lg leading-relaxed text-foreground/85">
        <p>
          Um dos jornalistas mais atuantes em Gramado. Foi colunista político do Jornal Integração
          por sete anos e do Jornal de Gramado por mais um período. No rádio jornalismo foi âncora do
          programa <strong>"Redação Sorriso"</strong> na Rádio Sorriso FM durante 3,5 anos e foi
          âncora do programa <strong>"Studio Gramado News"</strong> na Rádio Gramado FM. Sempre com a
          liderança no horário de rádio jornalismo.
        </p>
        <p>
          Atualmente atuando na área do jornalismo com o <strong>Blog do Gerson desde 2005</strong>,
          radio-jornalismo com o <strong>Podcast Cafezinho</strong> na Rádio Gramado News e
          Assessorias de Imprensa, e com uma presença forte em portais de comunicação próprios como{" "}
          <strong>blogdogerson.com.br</strong> e <strong>radiogramadonews.com.br</strong>, além de
          milhares de seguidores no Instagram do Blog e fanpage do Blog do Gerson.
        </p>
        <p>
          São anos de reconhecimento a um trabalho sério e comprometido com muito profissionalismo e
          dedicação.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Newspaper, label: "Blog do Gerson", desc: "Jornalismo diário desde 2005" },
          { icon: Mic, label: "Podcast Cafezinho", desc: "Rádio Gramado News" },
          { icon: Radio, label: "Rádio Gramado News", desc: "radiogramadonews.com.br" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-card p-5 text-center shadow-card">
            <item.icon className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-2 font-display font-black">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-sky-soft p-8 text-center">
        <h2 className="font-display text-2xl font-black">Receba as notícias por e-mail</h2>
        <p className="mt-1 text-muted-foreground">Cadastre-se na newsletter do Blog do Gerson.</p>
        <div className="mx-auto mt-5 flex justify-center">
          <NewsletterForm />
        </div>
      </div>
    </div>
  );
}
