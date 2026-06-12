import { useState } from "react";
import useSWR from "swr";
import type { SyntheticEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";
import type { ProductCategory } from "@/types/index";

interface ProductRow {
  id: string;
  name: string;
  price: string;
  category: ProductCategory;
  active: boolean;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  lanche: "Lanche",
  bebida: "Bebida",
  vitamina: "Vitamina",
  refeicao: "Refeição",
  sobremesa: "Sobremesa",
};

const CATEGORY_BADGE: Record<ProductCategory, string> = {
  lanche: "bg-brand-orange-subtle text-brand-orange",
  bebida: "bg-brand-teal-subtle text-brand-teal",
  vitamina: "bg-brand-green-subtle text-brand-green",
  refeicao: "bg-brand-pix-subtle text-brand-pix",
  sobremesa: "bg-gray-bg text-fg-3",
};

const CATEGORIES: ProductCategory[] = [
  "lanche",
  "bebida",
  "vitamina",
  "refeicao",
  "sobremesa",
];

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

export default function ProdutosPage() {
  const { user } = useUser();

  const canRead = user?.features?.includes("read:product") ?? false;
  const canCreate = user?.features?.includes("create:product") ?? false;
  const canUpdate = user?.features?.includes("update:product") ?? false;
  const canDelete = user?.features?.includes("delete:product") ?? false;

  const {
    data: products = [],
    isLoading,
    mutate,
  } = useSWR<ProductRow[]>(canRead ? "/api/v1/products" : null, fetchJson);

  // form state
  const [formMode, setFormMode] = useState<null | "create" | ProductRow>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("lanche");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // deactivate confirmation
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(
    null,
  );
  const [deactivating, setDeactivating] = useState(false);

  function openCreate() {
    setName("");
    setPrice("");
    setCategory("lanche");
    setActive(true);
    setFormError(null);
    setFormMode("create");
  }

  function openEdit(p: ProductRow) {
    setName(p.name);
    setPrice(String(Number(p.price)));
    setCategory(p.category);
    setActive(p.active);
    setFormError(null);
    setFormMode(p);
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
      ? `/api/v1/products/${(formMode as ProductRow).id}`
      : "/api/v1/products";
    const method = isEdit ? "PATCH" : "POST";

    const body: Record<string, string | boolean> = {
      name,
      price,
      category,
    };
    if (isEdit) body.active = active;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Erro ao salvar produto.");
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

  async function handleDeactivate(id: string) {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/v1/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Erro ao desativar produto.");
        return;
      }
      await mutate();
    } catch {
      alert("Erro de comunicação. Tente novamente.");
    } finally {
      setDeactivating(false);
      setConfirmDeactivateId(null);
    }
  }

  const isEditing = formMode !== null && formMode !== "create";
  const formTitle = isEditing
    ? `Editar produto — ${(formMode as ProductRow).name}`
    : "Novo produto";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-semibold text-fg-1"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Produtos
        </h2>
        {canCreate && formMode === null && (
          <button
            onClick={openCreate}
            className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
          >
            Novo produto
          </button>
        )}
      </div>

      {/* Formulário */}
      {formMode !== null && (
        <SectionCard title={formTitle}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label className="text-xs text-fg-3 font-medium">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nome do produto"
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0,00"
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ProductCategory)
                  }
                  required
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand-teal focus:ring-brand-teal"
                />
                <label
                  htmlFor="active"
                  className="text-sm text-fg-1 select-none"
                >
                  Produto ativo
                </label>
              </div>
            )}
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
      <SectionCard title="Lista de produtos">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-bg-subtle animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-fg-3 text-center py-6">
            Nenhum produto cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-3 uppercase tracking-wide">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Categoria</th>
                  <th className="pb-2 pr-4 font-medium">Preço</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  {(canUpdate || canDelete) && (
                    <th className="pb-2 font-medium">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <>
                    <tr key={p.id} className="hover:bg-bg-subtle/50">
                      <td className="py-2.5 pr-4 font-medium text-fg-1">
                        {p.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE[p.category]}`}
                        >
                          {CATEGORY_LABELS[p.category]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-fg-1">
                        {fmt(p.price)}
                      </td>
                      <td className="py-2.5 pr-4">
                        {p.active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green-subtle text-brand-green">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-bg text-fg-3">
                            Inativo
                          </span>
                        )}
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            {canUpdate && (
                              <button
                                onClick={() => openEdit(p)}
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
                            {canDelete && p.active && (
                              <button
                                onClick={() =>
                                  setConfirmDeactivateId(
                                    confirmDeactivateId === p.id ? null : p.id,
                                  )
                                }
                                title="Desativar"
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
                                    d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414A6 6 0 006.524 5.11L14.89 13.476zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {confirmDeactivateId === p.id && (
                      <tr key={`confirm-${p.id}`} className="bg-red-50">
                        <td
                          colSpan={canUpdate || canDelete ? 5 : 4}
                          className="px-2 py-2"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-red-600 font-medium">
                              Desativar &quot;{p.name}&quot;? O produto não
                              aparecerá mais em novas vendas.
                            </span>
                            <button
                              onClick={() => handleDeactivate(p.id)}
                              disabled={deactivating}
                              className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              {deactivating ? "Desativando..." : "Confirmar"}
                            </button>
                            <button
                              onClick={() => setConfirmDeactivateId(null)}
                              className="px-3 py-1 border border-border text-xs text-fg-2 rounded hover:bg-bg-subtle"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

ProdutosPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
