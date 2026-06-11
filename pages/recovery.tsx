import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

type PageState = "idle" | "loading" | "success" | "error";

export default function Recovery() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<PageState>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");

    try {
      const res = await fetch("/api/v1/password/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Erro inesperado.");
      }

      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Nutrigourmet"
            width={200}
            height={113}
            className="mb-3"
          />
          <p className="text-sm text-fg-3 mt-1">Sistema da cantina</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {state === "success" ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-green-subtle flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-brand-green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-fg-1 mb-2">
                Verifique seu e-mail
              </h2>
              <p className="text-sm text-fg-2 mb-6">
                Se o endereço informado estiver cadastrado, você receberá um
                link de recuperação em breve.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-brand-teal hover:underline"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2
                className="text-lg font-semibold text-fg-1 mb-2"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Recuperar senha
              </h2>
              <p className="text-sm text-fg-3 mb-6">
                Informe o e-mail da sua conta e enviaremos um link de
                recuperação.
              </p>

              {state === "error" && (
                <div className="mb-4 px-4 py-3 rounded-md bg-danger-bg">
                  <p className="text-sm font-medium text-danger">
                    Erro de conexão. Tente novamente.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-fg-2 mb-1.5"
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
                    className="w-full border border-border rounded-[10px] px-3 py-2 text-sm text-fg-1 placeholder:text-fg-3 outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-medium text-sm rounded-lg py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-button)" }}
                >
                  {state === "loading" ? "Enviando…" : "Enviar link"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-xs text-fg-3 hover:text-brand-teal transition-colors"
                >
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
