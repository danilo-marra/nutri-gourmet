import { useState, useEffect } from "react";
import useSWR from "swr";
import type { FormEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";
import type { CreditType } from "@/types/index";

const TYPE_LABELS: Record<CreditType, string> = {
  manual: "Manual",
  stone: "Link Stone",
  package: "Pacote",
};

const TYPE_BADGE: Record<CreditType, string> = {
  stone: "bg-brand-orange-subtle text-brand-orange",
  package: "bg-brand-teal-subtle text-brand-teal",
  manual: "bg-gray-bg text-fg-3",
};

// Wire formats (JSON): DECIMALs and timestamps chegam como string
interface StudentRow {
  id: string;
  name: string;
  class: string;
  is_full_time: boolean;
  balance: string;
}

interface CreditRow {
  id: string;
  type: CreditType;
  amount: string;
  balance_after: string;
  stone_payment_id: string | null;
  created_at: string;
}

function fmt(n: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n ?? 0));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Erro ao buscar dados.");
  return body;
}

interface CreditForm {
  amount: string;
  type: CreditType;
  stone_payment_id: string;
  expires_at: string;
}

const EMPTY_FORM: CreditForm = {
  amount: "",
  type: "manual",
  stone_payment_id: "",
  expires_at: "",
};

export default function CreditosPage() {
  const { user } = useUser();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreditForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreatePackage = user?.features?.includes("create:package");
  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) ?? null;

  const typeOptions: CreditType[] = canCreatePackage
    ? ["manual", "stone", "package"]
    : ["manual", "stone"];

  useEffect(() => {
    fetchJson<StudentRow[]>("/api/v1/students")
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, []);

  const {
    data: credits = [],
    isLoading: loadingCredits,
    mutate: mutateCredits,
  } = useSWR<CreditRow[]>(
    selectedStudentId ? `/api/v1/students/${selectedStudentId}/credits` : null,
    fetchJson,
  );

  async function refreshStudents() {
    try {
      const data = await fetchJson<StudentRow[]>("/api/v1/students");
      setStudents(data);
    } catch {
      // refresh is best-effort; stale balance is acceptable
    }
  }

  function handleTypeChange(type: CreditType) {
    setForm((f) => ({ ...f, type, stone_payment_id: "", expires_at: "" }));
    setError(null);
  }

  function handleCancel() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;

    if (form.type === "stone" && !form.stone_payment_id.trim()) {
      setError("Informe o Id do link de pagamento Stone.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const body: {
      amount: number;
      type: CreditType;
      stone_payment_id?: string;
      expires_at?: string;
    } = { amount: Number(form.amount), type: form.type };
    if (form.type === "stone")
      body.stone_payment_id = form.stone_payment_id.trim();
    if (form.type === "package" && form.expires_at)
      body.expires_at = `${form.expires_at}T00:00:00.000Z`;

    try {
      const res = await fetch(`/api/v1/students/${selectedStudentId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erro ao registrar crédito.");
        return;
      }
      await mutateCredits();
      await refreshStudents();
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setError("Erro de comunicação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Selecionar aluno">
        <div className="flex flex-col gap-1 max-w-sm">
          <label className="text-xs text-fg-3 font-medium">Aluno</label>
          <select
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setShowForm(false);
              setError(null);
            }}
            disabled={loadingStudents}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">
              {loadingStudents ? "Carregando..." : "Selecione um aluno"}
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.class}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {selectedStudent && (
        <>
          <div className="bg-bg-card rounded-lg border border-border shadow-sm px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p
                className="text-sm font-semibold text-fg-1"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                {selectedStudent.name}
              </p>
              <p className="text-xs text-fg-3 mt-0.5">
                Turma {selectedStudent.class}
                {selectedStudent.is_full_time ? " · Integral" : ""}
                {" · Saldo: "}
                <span className="font-medium text-fg-2">
                  {fmt(selectedStudent.balance)}
                </span>
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setError(null);
                }}
                className="shrink-0 px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
              >
                Adicionar crédito
              </button>
            )}
          </div>

          {showForm && (
            <SectionCard title="Adicionar crédito">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-fg-3 font-medium">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="0,00"
                      className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-fg-3 font-medium">
                      Tipo
                    </label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {typeOptions.map((t) => (
                        <label
                          key={t}
                          className="flex items-center gap-1.5 text-sm text-fg-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="type"
                            value={t}
                            checked={form.type === t}
                            onChange={() => handleTypeChange(t)}
                            className="accent-brand-teal"
                          />
                          {TYPE_LABELS[t]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {form.type === "stone" && (
                  <div className="flex flex-col gap-1 max-w-sm">
                    <label className="text-xs text-fg-3 font-medium">
                      Id do link Stone
                    </label>
                    <input
                      type="text"
                      required
                      value={form.stone_payment_id}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stone_payment_id: e.target.value,
                        }))
                      }
                      placeholder="pl_..."
                      className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal font-mono"
                    />
                    <p className="text-xs text-fg-3">
                      Copie o &ldquo;Id do link de pagamento&rdquo; no app
                      Stone.
                    </p>
                  </div>
                )}

                {form.type === "package" && (
                  <div className="flex flex-col gap-1 max-w-xs">
                    <label className="text-xs text-fg-3 font-medium">
                      Validade (opcional)
                    </label>
                    <input
                      type="date"
                      value={form.expires_at}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, expires_at: e.target.value }))
                      }
                      className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-1.5 border border-border text-sm text-fg-2 rounded-md hover:bg-gray-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard title="Histórico de créditos">
            {loadingCredits && (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-bg rounded animate-pulse"
                  />
                ))}
              </div>
            )}
            {!loadingCredits && credits.length === 0 && (
              <p className="text-sm text-fg-3 text-center py-6">
                Nenhum crédito registrado para este aluno.
              </p>
            )}
            {!loadingCredits && credits.length > 0 && (
              <div className="-mx-4 -mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-bg border-b border-border">
                      <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                        Data
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                        Saldo após
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                        Id Stone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border last:border-0 hover:bg-gray-bg/50"
                      >
                        <td className="px-4 py-2 text-fg-2 text-xs">
                          {fmtDate(c.created_at)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[c.type] ?? TYPE_BADGE.manual}`}
                          >
                            {TYPE_LABELS[c.type] ?? c.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-fg-1">
                          {fmt(c.amount)}
                        </td>
                        <td className="px-4 py-2 text-right text-fg-2">
                          {fmt(c.balance_after)}
                        </td>
                        <td
                          className="px-4 py-2 text-fg-3 font-mono text-xs"
                          title={c.stone_payment_id ?? ""}
                        >
                          {c.stone_payment_id
                            ? `${c.stone_payment_id.slice(0, 14)}…`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

CreditosPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
