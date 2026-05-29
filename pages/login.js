import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const { activated } = router.query;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data);
        return;
      }

      router.push("/");
    } catch {
      setError({
        message: "Erro de conexão. Tente novamente.",
        action: "Verifique sua internet e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Nutrigourmet"
            width={200}
            height={113}
            className="mb-3"
          />
          <p className="text-sm text-[var(--color-fg-3)] mt-1">
            Sistema da cantina
          </p>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] p-8">
          <h2
            className="text-lg font-semibold text-[var(--color-fg-1)] mb-6"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Entrar
          </h2>

          {activated && (
            <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-brand-green-subtle)] text-sm text-[var(--color-success-dark)] font-medium">
              Conta ativada com sucesso! Faça login.
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)]">
              <p className="text-sm font-medium text-[var(--color-danger)]">
                {error.message}
              </p>
              {error.action && (
                <p className="text-xs text-[var(--color-fg-3)] mt-1">
                  {error.action}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-[var(--color-border)] rounded-[10px] px-3 py-2 text-sm text-[var(--color-fg-1)] placeholder:text-[var(--color-fg-3)] outline-none focus:border-[var(--color-brand-teal)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[var(--color-border)] rounded-[10px] px-3 py-2 text-sm text-[var(--color-fg-1)] placeholder:text-[var(--color-fg-3)] outline-none focus:border-[var(--color-brand-teal)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green-hover)] text-white font-medium text-sm rounded-[var(--radius-lg)] py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-button)" }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/recovery"
              className="text-xs text-[var(--color-fg-3)] hover:text-[var(--color-brand-teal)] transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
