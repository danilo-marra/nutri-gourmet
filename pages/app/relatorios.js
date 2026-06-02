import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";

const CATEGORY_LABELS = {
  lanche: "Lanche",
  bebida: "Bebida",
  vitamina: "Vitamina",
  refeicao: "Refeição",
  sobremesa: "Sobremesa",
};

const PAYMENT_LABELS = {
  credit: "Crédito",
  cash: "Dinheiro",
  card: "Cartão",
};

function fmt(n) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n ?? 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  return today().slice(0, 8) + "01";
}

function SectionCard({ title, children }) {
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

function DateInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-fg-3 font-medium">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
      />
    </div>
  );
}

function SubmitButton({ loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
    >
      {loading ? "Carregando..." : "Gerar"}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 py-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 bg-gray-bg rounded animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-fg-3 text-center py-6">
      Nenhum dado para o período selecionado.
    </p>
  );
}

function HintState() {
  return (
    <p className="text-sm text-fg-3 text-center py-6">
      Configure o período acima e clique em Gerar.
    </p>
  );
}

function ErrorState({ message }) {
  return <p className="text-sm text-red-500 text-center py-6">{message}</p>;
}

async function fetchJson(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Erro ao buscar dados.");
  return body;
}

function FaturamentoDiario() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchJson(
        `/api/v1/reports/dashboard/revenue-trend?days=${days}`,
      );
      setData(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard title="Faturamento Diário">
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-fg-3 font-medium">Período</label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data && data.length === 0 && <EmptyState />}
      {!loading && !error && data && data.length > 0 && (
        <div className="-mx-4 -mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-bg border-b border-border">
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Data
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Receita
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.date}
                  className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                >
                  <td className="px-4 py-2.5 text-fg-2">{row.date}</td>
                  <td
                    className="px-4 py-2.5 text-fg-1 font-medium text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {fmt(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function FaturamentoMensal() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [year, m] = month.split("-");
      const startDate = `${year}-${m}-01`;
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      const endDate = `${year}-${m}-${String(lastDay).padStart(2, "0")}`;
      const result = await fetchJson(
        `/api/v1/reports/sales?start_date=${startDate}&end_date=${endDate}`,
      );
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard title="Faturamento Mensal">
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-fg-3 font-medium">Mês</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-fg-1 bg-bg-card focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-1.5 bg-brand-teal text-white text-sm font-medium rounded-md hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data && data.by_payment_method.length === 0 && (
        <EmptyState />
      )}
      {!loading && !error && data && data.by_payment_method.length > 0 && (
        <div className="-mx-4 -mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-bg border-b border-border">
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Forma de pagamento
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Qtd vendas
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.by_payment_method.map((row, i) => (
                <tr
                  key={row.payment_method}
                  className={`border-b border-border ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                >
                  <td className="px-4 py-2.5 text-fg-1">
                    {PAYMENT_LABELS[row.payment_method] ?? row.payment_method}
                  </td>
                  <td
                    className="px-4 py-2.5 text-fg-2 text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {row.sale_count}
                  </td>
                  <td
                    className="px-4 py-2.5 text-fg-1 font-medium text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {fmt(row.total_amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-brand-green/5">
                <td className="px-4 py-2.5 font-semibold text-fg-1" colSpan={2}>
                  Total geral
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-brand-green text-right"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {fmt(data.grand_total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function VendasPorProduto() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchJson(
        `/api/v1/reports/sales-by-product?start_date=${startDate}&end_date=${endDate}`,
      );
      setData(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Vendas por Produto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 items-end mb-4"
      >
        <DateInput label="De" value={startDate} onChange={setStartDate} />
        <DateInput label="Até" value={endDate} onChange={setEndDate} />
        <SubmitButton loading={loading} />
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data === null && <HintState />}
      {!loading && !error && data !== null && data.length === 0 && (
        <EmptyState />
      )}
      {!loading && !error && data !== null && data.length > 0 && (
        <div className="-mx-4 -mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-bg border-b border-border">
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Produto
                </th>
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Categoria
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Qtd
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Receita
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.product_id}
                  className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                >
                  <td className="px-4 py-2.5 text-fg-1">{row.product_name}</td>
                  <td className="px-4 py-2.5 text-fg-2">
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </td>
                  <td
                    className="px-4 py-2.5 text-fg-2 text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {row.qty_sold}
                  </td>
                  <td
                    className="px-4 py-2.5 text-fg-1 font-medium text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {fmt(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function CreditosConsumidos() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchJson(
        `/api/v1/reports/credits-consumed?start_date=${startDate}&end_date=${endDate}`,
      );
      setData(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Créditos Consumidos por Aluno">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 items-end mb-4"
      >
        <DateInput label="De" value={startDate} onChange={setStartDate} />
        <DateInput label="Até" value={endDate} onChange={setEndDate} />
        <SubmitButton loading={loading} />
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data === null && <HintState />}
      {!loading && !error && data !== null && data.length === 0 && (
        <EmptyState />
      )}
      {!loading && !error && data !== null && data.length > 0 && (
        <div className="-mx-4 -mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-bg border-b border-border">
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Aluno
                </th>
                <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                  Turma
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Nº vendas
                </th>
                <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                  Total consumido
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.student_id}
                  className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                >
                  <td className="px-4 py-2.5 text-fg-1">{row.student_name}</td>
                  <td className="px-4 py-2.5 text-fg-2">{row.class}</td>
                  <td
                    className="px-4 py-2.5 text-fg-2 text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {row.sale_count}
                  </td>
                  <td
                    className="px-4 py-2.5 text-fg-1 font-medium text-right"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {fmt(row.total_consumed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export default function RelatoriosPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.features?.includes("read:report:financial")) {
      router.replace("/app");
    }
  }, [user, router]);

  if (!user || !user.features?.includes("read:report:financial")) return null;

  return (
    <div className="space-y-4">
      <FaturamentoDiario />
      <FaturamentoMensal />
      <VendasPorProduto />
      <CreditosConsumidos />
    </div>
  );
}

RelatoriosPage.getLayout = (page) => <AppShell>{page}</AppShell>;
