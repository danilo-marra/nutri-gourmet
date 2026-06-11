import { useSyncExternalStore } from "react";
import type { ReactElement, ReactNode } from "react";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AppShell from "@/components/AppShell";
import { useUser } from "@/hooks/useUser";
import type { SessionUser, ProductCategory } from "@/types/index";

// ── API types ──────────────────────────────────────────────────────────────────

interface DashboardSummary {
  revenue_today: string;
  count_today: number;
  revenue_week: string;
  count_week: number;
  revenue_month: string;
  count_month: number;
  count_negative_balances: number;
  count_pending_closes: number;
}

interface RevenueTrendRow {
  date: string;
  total: string;
}

interface CategoryRow {
  category: ProductCategory;
  qty_sold: number;
  revenue: string;
}

interface TopProductRow {
  product_id: string;
  product_name: string;
  category: ProductCategory;
  qty_sold: number;
  revenue: string;
}

interface OperatorRow {
  operator_id: string;
  operator_username: string;
  sale_count: number;
  revenue: string;
}

interface CashClose {
  id: string;
  date: string;
  total_sales: string;
}

interface StudentServed {
  id: string;
  name: string;
  class: string;
}

interface ShiftSummary {
  revenue_today: string;
  count_today: number;
  cash_close: CashClose | null;
  students_served: StudentServed[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar dados.");
  return res.json();
}

function fmt(n: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n ?? 0));
}

function fmtShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function dateRange(daysAgo: number) {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - daysAgo * 86400000)
    .toISOString()
    .slice(0, 10);
  return { today, from };
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  lanche: "Lanche",
  bebida: "Bebida",
  vitamina: "Vitamina",
  refeicao: "Refeição",
  sobremesa: "Sobremesa",
};

const CATEGORY_COLORS = [
  "bg-brand-green",
  "bg-brand-teal",
  "bg-brand-orange",
  "bg-[#8b5cf6]",
  "bg-[#ec4899]",
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  badge?: { text: string; cls: string } | null;
  loading?: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  valueClass = "text-fg-1",
  badge,
  loading,
}: KpiCardProps) {
  return (
    <div className="bg-bg-card rounded-lg border border-border shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-fg-3">{label}</p>
        {badge && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-7 mt-1 bg-gray-bg rounded animate-pulse" />
      ) : (
        <p
          className={`text-2xl font-bold ${valueClass}`}
          style={{ fontFamily: "var(--font-data)" }}
        >
          {value}
        </p>
      )}
      {sub && <p className="text-xs text-fg-3 mt-1">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-bg-card rounded-lg border border-border shadow-sm overflow-hidden ${className}`}
    >
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

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-bg rounded animate-pulse" />
      ))}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-fg-3 text-center py-6">
      Sem dados para o período.
    </p>
  );
}

// ── Supervisor Dashboard ───────────────────────────────────────────────────────

function SupervisorDashboard({ mounted }: { mounted: boolean }) {
  const { today, from } = dateRange(29);

  const { data: summary } = useSWR<DashboardSummary>(
    "/api/v1/reports/dashboard/summary",
    fetcher,
  );
  const { data: trend } = useSWR<RevenueTrendRow[]>(
    "/api/v1/reports/dashboard/revenue-trend?days=7",
    fetcher,
  );
  const { data: categories } = useSWR<CategoryRow[]>(
    `/api/v1/reports/dashboard/category-breakdown?start_date=${from}&end_date=${today}`,
    fetcher,
  );
  const { data: topProducts } = useSWR<TopProductRow[]>(
    `/api/v1/reports/dashboard/top-products?start_date=${from}&end_date=${today}&limit=5`,
    fetcher,
  );
  const { data: operators } = useSWR<OperatorRow[]>(
    `/api/v1/reports/dashboard/operator-summary?start_date=${from}&end_date=${today}`,
    fetcher,
  );

  const totalCatRevenue =
    categories?.reduce((s, c) => s + Number(c.revenue), 0) ?? 0;

  const negativeBadge =
    summary && summary.count_negative_balances > 0
      ? {
          text: String(summary.count_negative_balances),
          cls: "bg-danger-subtle text-danger",
        }
      : null;

  const pendingBadge =
    summary && summary.count_pending_closes > 0
      ? {
          text: String(summary.count_pending_closes),
          cls: "bg-brand-orange-subtle text-brand-orange",
        }
      : null;

  return (
    <div className="space-y-4">
      {/* KPI row 1 — receita */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Receita hoje"
          value={fmt(summary?.revenue_today)}
          sub={summary ? `${summary.count_today} vendas` : undefined}
          valueClass="text-brand-green"
          loading={!summary}
        />
        <KpiCard
          label="Receita esta semana"
          value={fmt(summary?.revenue_week)}
          sub={summary ? `${summary.count_week} vendas` : undefined}
          valueClass="text-brand-teal"
          loading={!summary}
        />
        <KpiCard
          label="Receita este mês"
          value={fmt(summary?.revenue_month)}
          sub={summary ? `${summary.count_month} vendas` : undefined}
          valueClass="text-brand-orange"
          loading={!summary}
        />
      </div>

      {/* KPI row 2 — alertas */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          label="Alunos com saldo negativo"
          value={summary ? String(summary.count_negative_balances) : "—"}
          badge={negativeBadge}
          valueClass={
            summary?.count_negative_balances ? "text-danger" : "text-fg-1"
          }
          loading={!summary}
        />
        <KpiCard
          label="Fechamentos pendentes hoje"
          value={summary ? String(summary.count_pending_closes) : "—"}
          badge={pendingBadge}
          valueClass={
            summary?.count_pending_closes ? "text-brand-orange" : "text-fg-1"
          }
          loading={!summary}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Receita — últimos 7 dias" className="col-span-2">
          {!mounted || !trend ? (
            <div className="h-[180px] bg-gray-bg rounded animate-pulse" />
          ) : trend.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center">
              <Empty />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={trend.map((r) => ({
                  day: fmtShortDate(r.date),
                  revenue: Number(r.total),
                }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e1e2" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#8a8c90" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8a8c90" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [fmt(Number(v)), "Receita"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e1e1e2",
                  }}
                />
                <Bar dataKey="revenue" fill="#5bbf4e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Receita por categoria (30 dias)">
          {!categories ? (
            <Skeleton rows={5} />
          ) : categories.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {categories.map((cat, i) => {
                const pct =
                  totalCatRevenue > 0
                    ? Math.round((Number(cat.revenue) / totalCatRevenue) * 100)
                    : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-fg-2">
                        {CATEGORY_LABELS[cat.category] ?? cat.category}
                      </span>
                      <span className="text-fg-1 font-medium">
                        {fmt(cat.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-bg rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Top 5 Produtos (30 dias)" className="col-span-2">
          {!topProducts ? (
            <Skeleton />
          ) : topProducts.length === 0 ? (
            <Empty />
          ) : (
            <div className="-mx-4 -mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-bg border-b border-border">
                    <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                      Produto
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
                  {topProducts.map((p, i) => (
                    <tr
                      key={p.product_id}
                      className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-fg-1">
                        {p.product_name}
                      </td>
                      <td
                        className="px-4 py-2.5 text-fg-2 text-right"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {p.qty_sold}
                      </td>
                      <td
                        className="px-4 py-2.5 text-fg-1 font-medium text-right"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Resumo por Operador (30 dias)">
          {!operators ? (
            <Skeleton />
          ) : operators.length === 0 ? (
            <Empty />
          ) : (
            <div className="-mx-4 -mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-bg border-b border-border">
                    <th className="text-left text-xs font-semibold text-fg-3 px-4 py-2">
                      Operador
                    </th>
                    <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                      Qtd
                    </th>
                    <th className="text-right text-xs font-semibold text-fg-3 px-4 py-2">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, i) => (
                    <tr
                      key={op.operator_id}
                      className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-fg-1">
                        {op.operator_username}
                      </td>
                      <td
                        className="px-4 py-2.5 text-fg-2 text-right"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {op.sale_count}
                      </td>
                      <td
                        className="px-4 py-2.5 text-fg-1 font-medium text-right"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {fmt(op.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ── Operator Dashboard ─────────────────────────────────────────────────────────

function OperadorDashboard({ user }: { user: SessionUser }) {
  const { data: shift } = useSWR<ShiftSummary>(
    "/api/v1/reports/dashboard/my-shift-summary",
    fetcher,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-2">
        Bom dia,{" "}
        <span className="font-semibold text-fg-1">{user.username}</span>! Aqui
        está o resumo do seu turno.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Minhas vendas hoje"
          value={shift ? `${shift.count_today} vendas` : "—"}
          sub={shift ? fmt(shift.revenue_today) : undefined}
          valueClass="text-brand-green"
          loading={!shift}
        />
        <KpiCard
          label="Fechamento de caixa"
          value={shift ? (shift.cash_close ? "Fechado" : "Aberto") : "—"}
          valueClass={
            !shift
              ? "text-fg-1"
              : shift.cash_close
                ? "text-brand-green"
                : "text-brand-orange"
          }
          loading={!shift}
        />
        <KpiCard
          label="Alunos atendidos"
          value={shift ? String(shift.students_served.length) : "—"}
          sub="hoje"
          valueClass="text-[#8b5cf6]"
          loading={!shift}
        />
      </div>

      {shift && shift.students_served.length > 0 && (
        <SectionCard title="Alunos atendidos hoje">
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
                </tr>
              </thead>
              <tbody>
                {shift.students_served.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-fg-1">{s.name}</td>
                    <td className="px-4 py-2.5 text-fg-2">{s.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!user) return null;

  const isFinancialUser = user.features?.includes("read:report:financial");

  return isFinancialUser ? (
    <SupervisorDashboard mounted={mounted} />
  ) : (
    <OperadorDashboard user={user} />
  );
}

DashboardPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
