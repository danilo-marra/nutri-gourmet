import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import type { SyntheticEvent, ReactElement, ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";
import type { PaymentMethod } from "@/types/index";

// Wire-format types (JSON: DECIMALs e timestamps chegam como string)
interface SaleItemRow {
  id: string;
  product_id: string;
  qty: number;
  unit_price: string;
}

interface SaleRow {
  id: string;
  student_id: string | null;
  operator_id: string;
  payment_method: PaymentMethod;
  total: string;
  reversed_at: string | null;
  reversed_by: string | null;
  created_at: string;
  items: SaleItemRow[];
}

interface StudentRow {
  id: string;
  name: string;
  class: string;
  balance: string;
  is_full_time: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  price: string;
  category: string;
  active: boolean;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  credit: "Crédito",
  cash: "Dinheiro",
  card: "Cartão",
  pix: "Pix",
};

const PAYMENT_BADGE: Record<PaymentMethod, string> = {
  credit: "bg-brand-teal-subtle text-brand-teal",
  cash: "bg-brand-green-subtle text-brand-green",
  card: "bg-brand-orange-subtle text-brand-orange",
  pix: "bg-brand-pix-subtle text-brand-pix",
};

const CANCEL_MS = 5 * 60 * 1000;

function fmt(n: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n ?? 0));
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
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

export default function VendasPage() {
  const { user } = useUser();

  // form state
  const [showForm, setShowForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // cancel/reverse confirmation state
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // stable "now" refreshed every 30s so 5-min window button appears/disappears correctly
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // data
  const {
    data: sales = [],
    isLoading: loadingSales,
    mutate: mutateSales,
  } = useSWR<SaleRow[]>("/api/v1/sales", fetchJson);

  const { data: students = [], isLoading: loadingStudents } = useSWR<
    StudentRow[]
  >("/api/v1/students", fetchJson);

  const { data: products = [], isLoading: loadingProducts } = useSWR<
    ProductRow[]
  >("/api/v1/products", fetchJson);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students],
  );

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const todaySales = useMemo(() => {
    const today = new Date(now).toDateString();
    return sales.filter((s) => new Date(s.created_at).toDateString() === today);
  }, [sales, now]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products],
  );

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [pid, qty]) => {
      const p = productMap[pid];
      return p ? sum + parseFloat(p.price) * qty : sum;
    }, 0);
  }, [cart, productMap]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([pid, qty]) => ({ product_id: pid, qty })),
    [cart],
  );

  const canCreate = user?.features?.includes("create:sale") ?? false;
  const canReverseAny = user?.features?.includes("delete:sale") ?? false;
  const canCancelSelf = user?.features?.includes("delete:sale:self") ?? false;

  function showCancelButton(sale: SaleRow): boolean {
    if (sale.reversed_at) return false;
    if (canReverseAny) return true;
    if (canCancelSelf && sale.operator_id === user?.id) {
      return now - new Date(sale.created_at).getTime() <= CANCEL_MS;
    }
    return false;
  }

  function isSupervisorAction(sale: SaleRow): boolean {
    return (
      canReverseAny &&
      (!canCancelSelf ||
        sale.operator_id !== user?.id ||
        now - new Date(sale.created_at).getTime() > CANCEL_MS)
    );
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: qty };
    });
  }

  function handleOpenForm() {
    setShowForm(true);
    setPaymentMethod("credit");
    setSelectedStudentId("");
    setCart({});
    setFormError(null);
  }

  function handleCloseForm() {
    setShowForm(false);
    setCart({});
    setFormError(null);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cartItems.length === 0) {
      setFormError("Adicione ao menos um produto à venda.");
      return;
    }
    if (paymentMethod === "credit" && !selectedStudentId) {
      setFormError("Selecione o aluno para pagamento via crédito.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/v1/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: paymentMethod === "credit" ? selectedStudentId : null,
          payment_method: paymentMethod,
          items: cartItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Erro ao registrar venda.");
        return;
      }
      await mutateSales();
      handleCloseForm();
    } catch {
      setFormError("Erro de comunicação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCancel(saleId: string) {
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/v1/sales/${saleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        setCancelError(body.message || "Erro ao cancelar venda.");
        return;
      }
      setConfirmCancelId(null);
      await mutateSales();
    } catch {
      setCancelError("Erro de comunicação. Tente novamente.");
    } finally {
      setCanceling(false);
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
          Vendas de hoje
        </h2>
        {canCreate && !showForm && (
          <button
            onClick={handleOpenForm}
            className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90"
          >
            Nova venda
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <SectionCard title="Nova venda">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Forma de pagamento */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-fg-3 font-medium">
                Forma de pagamento
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {(["credit", "cash", "card", "pix"] as PaymentMethod[]).map(
                  (m) => (
                    <label
                      key={m}
                      className="flex items-center gap-1.5 text-sm text-fg-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={m}
                        checked={paymentMethod === m}
                        onChange={() => {
                          setPaymentMethod(m);
                          if (m !== "credit") setSelectedStudentId("");
                        }}
                        className="accent-brand-teal"
                      />
                      {PAYMENT_LABELS[m]}
                    </label>
                  ),
                )}
              </div>
            </div>

            {/* Seleção de aluno (só para crédito) */}
            {paymentMethod === "credit" && (
              <div className="flex flex-col gap-1 max-w-sm">
                <label className="text-xs text-fg-3 font-medium">Aluno</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={loadingStudents}
                  className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">
                    {loadingStudents ? "Carregando..." : "Selecione um aluno"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.class} (saldo: {fmt(s.balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Carrinho de produtos */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-fg-3 font-medium">Produtos</span>
              {loadingProducts ? (
                <div className="space-y-1 pt-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 bg-gray-bg rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="-mx-4 mt-1 border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-bg border-b border-border">
                        <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                          Produto
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                          Preço
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-fg-3">
                          Qtd
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProducts.map((p, i) => {
                        const qty = cart[p.id] ?? 0;
                        const subtotal = parseFloat(p.price) * qty;
                        return (
                          <tr
                            key={p.id}
                            className={`border-b border-border last:border-0 ${
                              i % 2 === 1 ? "bg-gray-bg/50" : ""
                            } ${qty > 0 ? "" : "opacity-60"}`}
                          >
                            <td className="px-4 py-2 text-fg-1">
                              <span>{p.name}</span>
                              <span className="ml-1.5 text-xs text-fg-3">
                                {p.category}
                              </span>
                            </td>
                            <td
                              className="px-4 py-2 text-right text-fg-2"
                              style={{ fontFamily: "var(--font-data)" }}
                            >
                              {fmt(p.price)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setQty(p.id, qty - 1)}
                                  disabled={qty === 0}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-border text-fg-2 hover:bg-gray-bg disabled:opacity-30"
                                >
                                  −
                                </button>
                                <span
                                  className="w-6 text-center text-sm text-fg-1"
                                  style={{ fontFamily: "var(--font-data)" }}
                                >
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQty(p.id, qty + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-border text-fg-2 hover:bg-gray-bg"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td
                              className="px-4 py-2 text-right font-medium text-fg-1"
                              style={{ fontFamily: "var(--font-data)" }}
                            >
                              {qty > 0 ? fmt(subtotal) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total */}
            {cartItems.length > 0 && (
              <div className="flex justify-end">
                <p className="text-sm font-semibold text-fg-1">
                  Total:{" "}
                  <span
                    className="text-brand-teal"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {fmt(cartTotal)}
                  </span>
                </p>
              </div>
            )}

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
                disabled={submitting || cartItems.length === 0}
                className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Registrar venda"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Lista de vendas */}
      <SectionCard title="Vendas de hoje">
        {loadingSales && (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-bg rounded animate-pulse" />
            ))}
          </div>
        )}
        {!loadingSales && todaySales.length === 0 && (
          <p className="text-sm text-fg-3 text-center py-6">
            Nenhuma venda registrada hoje.
          </p>
        )}
        {!loadingSales && todaySales.length > 0 && (
          <div className="-mx-4 -mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-bg border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                    Hora
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                    Aluno
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                    Itens
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-fg-3">
                    Pagamento
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                    Total
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-fg-3">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {todaySales.map((sale, i) => {
                  const student = sale.student_id
                    ? studentMap[sale.student_id]
                    : null;
                  const itemsSummary = sale.items
                    .map((it) => {
                      const name = productMap[it.product_id]?.name ?? "Produto";
                      return `${it.qty}× ${name}`;
                    })
                    .join(", ");
                  const isConfirming = confirmCancelId === sale.id;
                  const isSupervisor = isSupervisorAction(sale);

                  return (
                    <tr
                      key={sale.id}
                      className={`border-b border-border last:border-0 ${
                        i % 2 === 1 ? "bg-gray-bg/50" : ""
                      } ${sale.reversed_at ? "opacity-50" : ""}`}
                    >
                      <td
                        className="px-4 py-2 text-fg-2 text-xs"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmtTime(sale.created_at)}
                      </td>
                      <td className="px-4 py-2 text-fg-1">
                        {student ? (
                          <span>
                            {student.name}
                            <span className="ml-1 text-xs text-fg-3">
                              {student.class}
                            </span>
                          </span>
                        ) : (
                          <span className="text-fg-3">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-fg-2 text-xs max-w-[200px]">
                        <span title={itemsSummary} className="block truncate">
                          {itemsSummary || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_BADGE[sale.payment_method]}`}
                        >
                          {PAYMENT_LABELS[sale.payment_method]}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2 text-right font-medium text-fg-1"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(sale.total)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {sale.reversed_at ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-bg text-fg-3">
                            Estornada
                          </span>
                        ) : isConfirming ? (
                          <div className="flex items-center justify-end gap-2">
                            {cancelError && (
                              <span className="text-xs text-red-500 mr-1">
                                {cancelError}
                              </span>
                            )}
                            <span className="text-xs text-fg-2">
                              Confirmar?
                            </span>
                            <button
                              onClick={() => handleConfirmCancel(sale.id)}
                              disabled={canceling}
                              className="px-2 py-0.5 text-xs text-white bg-danger rounded hover:bg-danger/90 disabled:opacity-50"
                            >
                              {canceling ? "..." : "Sim"}
                            </button>
                            <button
                              onClick={() => {
                                setConfirmCancelId(null);
                                setCancelError(null);
                              }}
                              className="px-2 py-0.5 text-xs border border-border rounded hover:bg-gray-bg"
                            >
                              Não
                            </button>
                          </div>
                        ) : showCancelButton(sale) ? (
                          <button
                            onClick={() => {
                              setConfirmCancelId(sale.id);
                              setCancelError(null);
                            }}
                            className={`text-xs font-medium px-2 py-0.5 rounded border ${
                              isSupervisor
                                ? "border-danger text-danger hover:bg-danger/10"
                                : "border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                            }`}
                          >
                            {isSupervisor ? "Estornar" : "Cancelar"}
                          </button>
                        ) : null}
                      </td>
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

VendasPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
