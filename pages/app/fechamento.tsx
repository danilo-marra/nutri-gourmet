import { useState } from "react";
import useSWR from "swr";
import type { SyntheticEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";

interface CashCloseRow {
  id: string;
  operator_id: string;
  operator_username: string;
  closed_by_id: string | null;
  date: string;
  total_sales: string;
  total_credit: string;
  total_cash: string;
  total_card: string;
  total_pix: string;
  created_at: string;
}

interface UserRow {
  id: string;
  username: string;
  role: string;
}

function fmt(n: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n ?? 0));
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Erro ao buscar dados.");
  return body;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3
          className="text-sm font-semibold text-fg-1"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function FechamentoPage() {
  const { user } = useUser();

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(today());
  const [operatorId, setOperatorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = user?.features?.includes("create:cash_close") ?? false;
  const canRead = user?.features?.includes("read:cash_close") ?? false;

  const {
    data: closes = [],
    isLoading: loadingCloses,
    mutate: mutateCloses,
  } = useSWR<CashCloseRow[]>(canRead ? "/api/v1/cash_closes" : null, fetchJson);

  const { data: users = [], isLoading: loadingUsers } = useSWR<UserRow[]>(
    canRead ? "/api/v1/users" : null,
    fetchJson,
  );

  const operators = users.filter(
    (u) => u.role === "operador" || u.role === "supervisor",
  );

  function handleOpenForm() {
    setDate(today());
    setOperatorId("");
    setFormError(null);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setFormError(null);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const body: Record<string, string> = { date };
      if (canRead && operatorId) body.operator_id = operatorId;

      const res = await fetch("/api/v1/cash_closes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.message?.includes("já existe")) {
          setFormError(
            "Já existe um fechamento para este operador nesta data.",
          );
        } else {
          setFormError(data.message || "Erro ao registrar fechamento.");
        }
        return;
      }

      await mutateCloses();
      handleCloseForm();
    } catch {
      setFormError("Erro de comunicação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-semibold text-fg-1"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Fechamento de caixa
        </h2>
        {canCreate && !showForm && (
          <button
            onClick={handleOpenForm}
            className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
          >
            Registrar fechamento
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <SectionCard title="Novo fechamento">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operador — apenas supervisor+ */}
            {canRead && (
              <div className="flex flex-col gap-1 max-w-sm">
                <label className="text-xs text-fg-3 font-medium">
                  Operador
                </label>
                <select
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  disabled={loadingUsers}
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">
                    {loadingUsers ? "Carregando..." : "Meu próprio turno"}
                  </option>
                  {operators.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Data */}
            <div className="flex flex-col gap-1 max-w-sm">
              <label className="text-xs text-fg-3 font-medium">Data</label>
              <input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-1.5 border border-border text-sm text-fg-2 rounded-md hover:bg-gray-bg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Fechar caixa"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Histórico — supervisor+ */}
      {canRead && (
        <SectionCard title="Histórico de fechamentos">
          {loadingCloses && (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-bg rounded animate-pulse" />
              ))}
            </div>
          )}
          {!loadingCloses && closes.length === 0 && (
            <p className="text-sm text-fg-3 text-center py-6">
              Nenhum fechamento registrado.
            </p>
          )}
          {!loadingCloses && closes.length > 0 && (
            <div className="-mx-4 -mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-bg border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                      Operador
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Crédito
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Dinheiro
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Cartão
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Pix
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                      Registrado em
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {closes.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border last:border-0 ${
                        i % 2 === 1 ? "bg-gray-bg/50" : ""
                      }`}
                    >
                      <td
                        className="px-4 py-2 text-fg-1 font-medium"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmtDate(c.date)}
                      </td>
                      <td className="px-4 py-2 text-fg-2">
                        {c.operator_username}
                      </td>
                      <td
                        className="px-4 py-2 text-right font-semibold text-fg-1"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(c.total_sales)}
                      </td>
                      <td
                        className="px-4 py-2 text-right text-fg-2"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(c.total_credit)}
                      </td>
                      <td
                        className="px-4 py-2 text-right text-fg-2"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(c.total_cash)}
                      </td>
                      <td
                        className="px-4 py-2 text-right text-fg-2"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(c.total_card)}
                      </td>
                      <td
                        className="px-4 py-2 text-right text-fg-2"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(c.total_pix)}
                      </td>
                      <td
                        className="px-4 py-2 text-right text-xs text-fg-3"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmtDateTime(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

FechamentoPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
