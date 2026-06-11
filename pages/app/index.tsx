import { useSyncExternalStore } from "react";
import type { ReactElement, ReactNode } from "react";
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
import type { SessionUser } from "@/types/index";

// TODO: substituir por chamadas reais a /api/v1/reports/dashboard/*
const MOCK_SUMMARY = {
  revenue_today: 1247.5,
  credits_added_today: 380.0,
  sales_count_today: 87,
  average_ticket: 14.33,
  active_students: 342,
};

const MOCK_REVENUE_TREND = [
  { day: "Seg", revenue: 980 },
  { day: "Ter", revenue: 1120 },
  { day: "Qua", revenue: 840 },
  { day: "Qui", revenue: 1247 },
  { day: "Sex", revenue: 1080 },
  { day: "Sab", revenue: 760 },
  { day: "Dom", revenue: 520 },
];

const MOCK_CATEGORY_BREAKDOWN = [
  { category: "Refeição", total: 580.0, pct: 46 },
  { category: "Lanche", total: 320.0, pct: 26 },
  { category: "Bebida", total: 187.5, pct: 15 },
  { category: "Vitamina", total: 103.0, pct: 8 },
  { category: "Sobremesa", total: 57.0, pct: 5 },
];

const MOCK_TOP_PRODUCTS = [
  { name: "Almoço Completo", count: 42, revenue: 580.0 },
  { name: "Suco Natural", count: 35, revenue: 157.5 },
  { name: "Vitamina de Fruta", count: 28, revenue: 126.0 },
  { name: "Lanche de Queijo", count: 24, revenue: 96.0 },
  { name: "Brigadeiro", count: 18, revenue: 54.0 },
];

const MOCK_OPERATOR_SUMMARY = [
  { username: "carlos.m", sales_count: 38, total_revenue: 584.0 },
  { username: "joana.p", sales_count: 31, total_revenue: 423.5 },
  { username: "marcos.l", sales_count: 18, total_revenue: 240.0 },
];

// TODO: substituir por chamada real a /api/v1/reports/dashboard/my-shift-summary
const MOCK_SHIFT = {
  my_sales_count: 38,
  my_revenue: 584.0,
  my_credits_added: 120.0,
};

const CATEGORY_COLORS = [
  "bg-brand-green",
  "bg-brand-teal",
  "bg-brand-orange",
  "bg-[#8b5cf6]",
  "bg-[#ec4899]",
];

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}

function KpiCard({
  label,
  value,
  sub,
  valueClass = "text-fg-1",
}: KpiCardProps) {
  return (
    <div className="bg-bg-card rounded-lg border border-border shadow-sm p-4">
      <p className="text-xs font-medium text-fg-3 mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${valueClass}`}
        style={{ fontFamily: "var(--font-data)" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-fg-3 mt-1">{sub}</p>}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function SectionCard({ title, children, className = "" }: SectionCardProps) {
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

function SupervisorDashboard({ mounted }: { mounted: boolean }) {
  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Receita hoje"
          value={fmt(MOCK_SUMMARY.revenue_today)}
          sub="+12% vs ontem"
          valueClass="text-brand-green"
        />
        <KpiCard
          label="Créditos adicionados"
          value={fmt(MOCK_SUMMARY.credits_added_today)}
          sub="8 transações"
          valueClass="text-brand-teal"
        />
        <KpiCard
          label="Vendas hoje"
          value={`${MOCK_SUMMARY.sales_count_today} vendas`}
          sub={`ticket médio ${fmt(MOCK_SUMMARY.average_ticket)}`}
          valueClass="text-brand-orange"
        />
        <KpiCard
          label="Alunos ativos"
          value={String(MOCK_SUMMARY.active_students)}
          sub="com saldo positivo"
          valueClass="text-[#8b5cf6]"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Receita — últimos 7 dias" className="col-span-2">
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={MOCK_REVENUE_TREND}
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
          ) : (
            <div className="h-[180px] bg-gray-bg rounded animate-pulse" />
          )}
        </SectionCard>

        <SectionCard title="Vendas por categoria">
          <div className="space-y-3">
            {MOCK_CATEGORY_BREAKDOWN.map((cat, i) => (
              <div key={cat.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-fg-2">{cat.category}</span>
                  <span className="text-fg-1 font-medium">
                    {fmt(cat.total)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-bg rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${CATEGORY_COLORS[i]}`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Top 5 Produtos" className="col-span-2">
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
                {MOCK_TOP_PRODUCTS.map((p, i) => (
                  <tr
                    key={p.name}
                    className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-fg-1">{p.name}</td>
                    <td
                      className="px-4 py-2.5 text-fg-2 text-right"
                      style={{ fontFamily: "var(--font-data)" }}
                    >
                      {p.count}
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
        </SectionCard>

        <SectionCard title="Resumo por Operador">
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
                {MOCK_OPERATOR_SUMMARY.map((op, i) => (
                  <tr
                    key={op.username}
                    className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-gray-bg" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-fg-1">{op.username}</td>
                    <td
                      className="px-4 py-2.5 text-fg-2 text-right"
                      style={{ fontFamily: "var(--font-data)" }}
                    >
                      {op.sales_count}
                    </td>
                    <td
                      className="px-4 py-2.5 text-fg-1 font-medium text-right"
                      style={{ fontFamily: "var(--font-data)" }}
                    >
                      {fmt(op.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function OperadorDashboard({ user }: { user: SessionUser }) {
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
          value={`${MOCK_SHIFT.my_sales_count} vendas`}
          sub={fmt(MOCK_SHIFT.my_revenue)}
          valueClass="text-brand-green"
        />
        <KpiCard
          label="Créditos que adicionei"
          value={fmt(MOCK_SHIFT.my_credits_added)}
          sub="hoje"
          valueClass="text-brand-teal"
        />
      </div>
    </div>
  );
}

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
