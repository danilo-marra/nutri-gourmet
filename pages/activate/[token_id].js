import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export default function Activate() {
  const router = useRouter();
  const { token_id } = router.query;
  const [status, setStatus] = useState(STATUS.LOADING);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token_id) return;

    async function activate() {
      try {
        const res = await fetch(`/api/v1/activations/${token_id}`, {
          method: "PATCH",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data);
          setStatus(STATUS.ERROR);
          return;
        }

        setStatus(STATUS.SUCCESS);
      } catch {
        setError({
          message: "Erro de conexão ao tentar ativar a conta.",
          action: "Tente novamente em alguns instantes.",
        });
        setStatus(STATUS.ERROR);
      }
    }

    activate();
  }, [token_id]);

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
          <h1
            className="text-2xl font-bold text-[var(--color-fg-1)]"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            Nutrigourmet
          </h1>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] p-8 text-center">
          {status === STATUS.LOADING && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-[var(--color-gray-bg)] border-t-[var(--color-brand-green)] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[var(--color-fg-2)]">
                Ativando sua conta…
              </p>
            </>
          )}

          {status === STATUS.SUCCESS && (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--color-brand-green-subtle)] flex items-center justify-center mx-auto mb-4">
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
              <h2 className="text-base font-semibold text-[var(--color-fg-1)] mb-2">
                Conta ativada!
              </h2>
              <p className="text-sm text-[var(--color-fg-2)] mb-6">
                Sua conta foi ativada com sucesso. Você já pode fazer login.
              </p>
              <Link
                href="/login?activated=1"
                className="inline-block w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green-hover)] text-white font-medium text-sm rounded-[var(--radius-lg)] py-2.5 transition-colors"
                style={{ fontFamily: "var(--font-button)" }}
              >
                Ir para o login
              </Link>
            </>
          )}

          {status === STATUS.ERROR && (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-danger)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[var(--color-fg-1)] mb-2">
                Não foi possível ativar
              </h2>
              {error && (
                <p className="text-sm text-[var(--color-fg-2)] mb-2">
                  {error.message}
                </p>
              )}
              {error?.action && (
                <p className="text-xs text-[var(--color-fg-3)] mb-6">
                  {error.action}
                </p>
              )}
              <Link
                href="/login"
                className="inline-block text-sm text-[var(--color-brand-teal)] hover:underline"
              >
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
