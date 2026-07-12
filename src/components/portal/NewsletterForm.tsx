import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/portal.functions";

export function NewsletterForm({ variant = "inline" }: { variant?: "inline" | "footer" }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await subscribe({ data: { email: email.trim() } });
      if (res.ok) {
        setStatus("ok");
        setMessage(res.duplicate ? "Você já está cadastrado!" : "Cadastro realizado com sucesso!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(res.error ?? "Erro ao cadastrar.");
      }
    } catch {
      setStatus("error");
      setMessage("E-mail inválido ou erro de conexão.");
    }
  };

  const dark = variant === "footer";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu melhor e-mail"
        maxLength={255}
        className={`h-11 flex-1 rounded-xl border px-4 text-sm outline-none focus:ring-2 ${
          dark
            ? "border-navy-foreground/20 bg-navy-foreground/10 text-navy-foreground placeholder:text-navy-foreground/50 focus:ring-primary"
            : "bg-card ring-ring"
        }`}
      />
      <button
        disabled={status === "loading"}
        className="h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Cadastrar"}
      </button>
      {message && (
        <p
          className={`w-full text-xs sm:absolute sm:mt-12 ${
            status === "ok" ? "text-emerald-500" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
