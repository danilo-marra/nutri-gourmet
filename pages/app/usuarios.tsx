import { useState } from "react";
import useSWR from "swr";
import type { SyntheticEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";
import type { UserRole } from "@/types/index";

interface UserRow {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  pending: "Pendente",
  operador: "Operador",
  supervisor: "Supervisor",
  admin: "Admin",
};

const ROLE_BADGE: Record<UserRole, string> = {
  pending: "bg-gray-bg text-fg-3",
  operador: "bg-brand-teal-subtle text-brand-teal",
  supervisor: "bg-brand-orange-subtle text-brand-orange",
  admin: "bg-brand-pix-subtle text-brand-pix",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

export default function UsuariosPage() {
  const { user } = useUser();

  const canRead = user?.features?.includes("read:user") ?? false;
  const canCreate = user?.features?.includes("create:user") ?? false;
  const canUpdateOthers =
    user?.features?.includes("update:user:others") ?? false;

  const currentRole = user?.role as UserRole | undefined;

  // Roles that the current user can assign
  const assignableRoles: UserRole[] =
    currentRole === "admin" ? ["operador", "supervisor"] : ["operador"];

  const {
    data: users = [],
    isLoading,
    mutate,
  } = useSWR<UserRow[]>(canRead ? "/api/v1/users" : null, fetchJson);

  // form state
  const [formMode, setFormMode] = useState<null | "create" | UserRow>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operador");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function openCreate() {
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("operador");
    setFormError(null);
    setSuccessMsg(null);
    setFormMode("create");
  }

  function openEdit(u: UserRow) {
    setRole(u.role);
    setFormError(null);
    setSuccessMsg(null);
    setFormMode(u);
  }

  function closeForm() {
    setFormMode(null);
    setFormError(null);
    setSuccessMsg(null);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);

    const isEdit = formMode !== null && formMode !== "create";

    try {
      if (isEdit) {
        const editUser = formMode as UserRow;
        const res = await fetch(`/api/v1/users/${editUser.username}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Erro ao atualizar usuário.");
          return;
        }
        await mutate();
        closeForm();
      } else {
        const res = await fetch("/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Erro ao criar usuário.");
          return;
        }
        await mutate();
        setSuccessMsg(
          `Usuário criado. Um e-mail de ativação foi enviado para ${email}.`,
        );
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("operador");
      }
    } catch {
      setFormError("Erro de comunicação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = formMode !== null && formMode !== "create";
  const editUser = isEditing ? (formMode as UserRow) : null;
  const formTitle = editUser
    ? `Alterar função — ${editUser.username}`
    : "Novo usuário";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-semibold text-fg-1"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Usuários
        </h2>
        {canCreate && formMode === null && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
          >
            Novo usuário
          </button>
        )}
      </div>

      {/* Formulário */}
      {formMode !== null && (
        <SectionCard title={formTitle}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-fg-3 font-medium">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="nome.sobrenome"
                    className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-fg-3 font-medium">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@email.com"
                    className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-fg-3 font-medium">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Senha temporária"
                    className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-fg-3 font-medium">
                    Função
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {isEditing && (
              <div className="flex flex-col gap-1 max-w-xs">
                <label className="text-xs text-fg-3 font-medium">Função</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {successMsg && (
              <p className="text-xs text-brand-green font-medium">
                {successMsg}
              </p>
            )}
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              {!successMsg && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
                >
                  {submitting
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar"
                      : "Criar usuário"}
                </button>
              )}
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-1.5 border border-border text-sm text-fg-2 rounded-md hover:bg-bg-subtle"
              >
                {successMsg ? "Fechar" : "Cancelar"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Tabela */}
      <SectionCard title="Lista de usuários">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-bg-subtle animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-fg-3 text-center py-6">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-3 uppercase tracking-wide">
                  <th className="pb-2 pr-4 font-medium">Usuário</th>
                  <th className="pb-2 pr-4 font-medium">Função</th>
                  <th className="pb-2 pr-4 font-medium">Cadastrado em</th>
                  {canUpdateOthers && (
                    <th className="pb-2 font-medium">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  const canEditThis =
                    canUpdateOthers &&
                    !isSelf &&
                    assignableRoles.includes(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-bg-subtle/50">
                      <td className="py-2.5 pr-4 font-medium text-fg-1">
                        {u.username}
                        {isSelf && (
                          <span className="ml-2 text-xs text-fg-3 font-normal">
                            (você)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-fg-2">
                        {fmtDate(u.created_at)}
                      </td>
                      {canUpdateOthers && (
                        <td className="py-2.5">
                          {canEditThis && (
                            <button
                              onClick={() => openEdit(u)}
                              title="Alterar função"
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
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

UsuariosPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
