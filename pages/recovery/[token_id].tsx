import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import PasswordStrengthHelper from "@/components/PasswordStrengthHelper";

type PageState = "idle" | "loading" | "error";

interface ApiError {
  message: string;
  action?: string;
}

export default function ResetPassword() {
  const router = useRouter();
  const { token_id } = router.query;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [matchError, setMatchError] = useState(false);
  const [state, setState] = useState<PageState>("idle");
  const [apiError, setApiError] = useState<ApiError | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMatchError(false);
    setApiError(null);

    if (password !== confirm) {
      setMatchError(true);
      return;
    }

    setState("loading");

    try {
      const res = await fetch(`/api/v1/password/recovery/${token_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data);
        setState("error");
        return;
      }

      router.push("/login?recovered=1");
    } catch {
      setApiError({
        message: "Erro de conexão. Tente novamente.",
        action: "Verifique sua internet e tente novamente.",
      });
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
          <h2
            className="text-lg font-semibold text-fg-1 mb-2"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Nova senha
          </h2>
          <p className="text-sm text-fg-3 mb-6">
            Digite e confirme sua nova senha.
          </p>

          {state === "error" && apiError && (
            <div className="mb-4 px-4 py-3 rounded-md bg-danger-bg">
              <p className="text-sm font-medium text-danger">
                {apiError.message}
              </p>
              {apiError.action && (
                <p className="text-xs text-fg-3 mt-1">{apiError.action}</p>
              )}
              <Link
                href="/recovery"
                className="inline-block text-xs text-brand-teal hover:underline mt-2"
              >
                Solicitar novo link
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-fg-2 mb-1.5"
              >
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border rounded-[10px] px-3 py-2 text-sm text-fg-1 placeholder:text-fg-3 outline-none focus:border-brand-teal transition-colors"
              />
              <PasswordStrengthHelper
                password={password}
                onGenerate={(p) => {
                  setPassword(p);
                  setConfirm(p);
                }}
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-semibold text-fg-2 mb-1.5"
              >
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-[10px] px-3 py-2 text-sm text-fg-1 placeholder:text-fg-3 outline-none focus:border-brand-teal transition-colors ${
                  matchError ? "border-danger" : "border-border"
                }`}
              />
              {matchError && (
                <p className="text-xs text-danger mt-1">
                  As senhas não coincidem.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-medium text-sm rounded-lg py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-button)" }}
            >
              {state === "loading" ? "Salvando…" : "Redefinir senha"}
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
        </div>
      </div>
    </div>
  );
}
