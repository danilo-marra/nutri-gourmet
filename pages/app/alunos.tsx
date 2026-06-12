import { useState, Fragment } from "react";
import useSWR from "swr";
import type { SyntheticEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";

interface StudentRow {
  id: string;
  name: string;
  class: string;
  is_full_time: boolean;
  balance: string;
  created_at: string;
}

function fmt(n: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n ?? 0));
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

export default function AlunosPage() {
  const { user } = useUser();

  const canRead = user?.features?.includes("read:student") ?? false;
  const canCreate = user?.features?.includes("create:student") ?? false;
  const canUpdate = user?.features?.includes("update:student") ?? false;
  const canDelete = user?.features?.includes("delete:student") ?? false;

  const {
    data: students = [],
    isLoading,
    mutate,
  } = useSWR<StudentRow[]>(canRead ? "/api/v1/students" : null, fetchJson);

  // form state
  const [formMode, setFormMode] = useState<null | "create" | StudentRow>(null);
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [isFullTime, setIsFullTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setName("");
    setCls("");
    setIsFullTime(false);
    setFormError(null);
    setFormMode("create");
  }

  function openEdit(s: StudentRow) {
    setName(s.name);
    setCls(s.class);
    setIsFullTime(s.is_full_time);
    setFormError(null);
    setFormMode(s);
  }

  function closeForm() {
    setFormMode(null);
    setFormError(null);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const isEdit = formMode !== null && formMode !== "create";
    const url = isEdit
      ? `/api/v1/students/${(formMode as StudentRow).id}`
      : "/api/v1/students";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, class: cls, is_full_time: isFullTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Erro ao salvar aluno.");
        return;
      }
      await mutate();
      closeForm();
    } catch {
      setFormError("Erro de comunicação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/students/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message || "Erro ao excluir aluno.");
        return;
      }
      await mutate();
      setConfirmDeleteId(null);
    } catch {
      setDeleteError("Erro de comunicação. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = formMode !== null && formMode !== "create";
  const formTitle = isEditing
    ? `Editar aluno — ${(formMode as StudentRow).name}`
    : "Novo aluno";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-semibold text-fg-1"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Alunos
        </h2>
        {canCreate && formMode === null && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
          >
            Novo aluno
          </button>
        )}
      </div>

      {/* Formulário */}
      {formMode !== null && (
        <SectionCard title={formTitle}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nome completo"
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium">Turma</label>
                <input
                  type="text"
                  value={cls}
                  onChange={(e) => setCls(e.target.value)}
                  required
                  placeholder="Ex: 3º A"
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_full_time"
                checked={isFullTime}
                onChange={(e) => setIsFullTime(e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-teal focus:ring-brand-teal"
              />
              <label
                htmlFor="is_full_time"
                className="text-sm text-fg-1 select-none"
              >
                Integral
              </label>
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
              >
                {submitting
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar"
                    : "Cadastrar"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-1.5 border border-border text-sm text-fg-2 rounded-md hover:bg-bg-subtle"
              >
                Cancelar
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Tabela */}
      <SectionCard title="Lista de alunos">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-bg-subtle animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-fg-3 text-center py-6">
            Nenhum aluno cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-3 uppercase tracking-wide">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Turma</th>
                  <th className="pb-2 pr-4 font-medium">Integral</th>
                  <th className="pb-2 pr-4 font-medium">Saldo</th>
                  {(canUpdate || canDelete) && (
                    <th className="pb-2 font-medium">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <Fragment key={s.id}>
                    <tr className="hover:bg-bg-subtle/50">
                      <td className="py-2.5 pr-4 font-medium text-fg-1">
                        {s.name}
                      </td>
                      <td className="py-2.5 pr-4 text-fg-2">{s.class}</td>
                      <td className="py-2.5 pr-4">
                        {s.is_full_time ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-teal-subtle text-brand-teal">
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-bg text-fg-3">
                            Não
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 pr-4 font-medium tabular-nums ${Number(s.balance) < 0 ? "text-red-500" : "text-brand-green"}`}
                      >
                        {fmt(s.balance)}
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            {canUpdate && (
                              <button
                                onClick={() => openEdit(s)}
                                title="Editar"
                                className="text-fg-3 hover:text-brand-teal transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setConfirmDeleteId(
                                    confirmDeleteId === s.id ? null : s.id,
                                  );
                                }}
                                title="Excluir"
                                className="text-fg-3 hover:text-red-500 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {confirmDeleteId === s.id && (
                      <tr className="bg-red-50">
                        <td
                          colSpan={canUpdate || canDelete ? 5 : 4}
                          className="px-2 py-2"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-red-600 font-medium">
                                Excluir &quot;{s.name}&quot;? Esta ação é
                                irreversível.
                              </span>
                              {!deleteError && (
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  disabled={deleting}
                                  className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50"
                                >
                                  {deleting ? "Excluindo..." : "Confirmar"}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-3 py-1 border border-border text-xs text-fg-2 rounded hover:bg-bg-subtle"
                              >
                                Cancelar
                              </button>
                            </div>
                            {deleteError && (
                              <p className="text-xs text-red-600">
                                {deleteError}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

AlunosPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
