import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Blog do Gerson" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      }
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar";
      setError(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já está cadastrado. Faça login."
            : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-soft px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-float">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand">
            <span className="font-display text-2xl font-black text-primary-foreground">G</span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-black">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Entre com sua conta" : "Crie a conta do administrador"}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none ring-ring focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none ring-ring focus:ring-2"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            disabled={loading}
            className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          className="mt-4 w-full text-center text-sm text-primary hover:underline"
        >
          {mode === "login" ? "Primeira vez? Criar conta" : "Já tenho conta — entrar"}
        </button>
      </div>
    </div>
  );
}
