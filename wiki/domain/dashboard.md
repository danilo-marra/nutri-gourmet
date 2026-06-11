# Dashboard

**Summary**: Página inicial da área autenticada (`/app`); exibe KPIs e gráficos em tempo real a partir de seis endpoints de relatório, com vistas diferenciadas para [[supervisor]]/[[administrador]] e para [[operador]].

**Sources**: pages/app/index.tsx, pages/api/v1/reports/dashboard/

**Last updated**: 2026-06-11

---

## Perfis e vistas

O componente raiz (`pages/app/index.tsx`) detecta o perfil do usuário via `useUser` e renderiza uma de duas vistas:

- **SupervisorDashboard** — exibida para `supervisor` e `admin`
- **OperadorDashboard** — exibida para `operador`

Ambas usam SWR para buscar dados dos endpoints `GET /api/v1/reports/dashboard/*`. Os dados são carregados no cliente (CSR) após a sessão ser resolvida. Enquanto carregam, os KPI cards exibem animação de skeleton.

## Vista: Supervisor / Admin

### KPI cards

| Card                       | Fonte                | Badge                      |
| -------------------------- | -------------------- | -------------------------- |
| Receita hoje + qtd vendas  | `/dashboard/summary` | —                          |
| Receita esta semana + qtd  | `/dashboard/summary` | —                          |
| Receita este mês + qtd     | `/dashboard/summary` | —                          |
| Alunos com saldo negativo  | `/dashboard/summary` | 🔴 vermelho se `count > 0` |
| Fechamentos pendentes hoje | `/dashboard/summary` | 🟠 laranja se `count > 0`  |

### Seções

- **Gráfico de tendência** (últimos 7 dias) — `BarChart` (Recharts) com `useSyncExternalStore` como guard de hidratação; dados de `/dashboard/revenue-trend?days=7`
- **Receita por categoria** (30 dias) — barras de progresso com percentual calculado no cliente; dados de `/dashboard/category-breakdown?start_date=…&end_date=…`
- **Top 5 Produtos** (30 dias) — tabela com qtd e receita; dados de `/dashboard/top-products?…&limit=5`
- **Resumo por operador** (30 dias) — tabela com qtd de vendas e receita por operador; dados de `/dashboard/operator-summary?…`

Os parâmetros de data são calculados no cliente via `dateRange(29)` — retorna hoje e 30 dias atrás em formato `YYYY-MM-DD`.

## Vista: Operador

### KPI cards

| Card                      | Fonte                         | Detalhe                                |
| ------------------------- | ----------------------------- | -------------------------------------- |
| Vendas do turno / receita | `/dashboard/my-shift-summary` | Contagem e total do dia                |
| Status do fechamento      | `/dashboard/my-shift-summary` | "Fechado" (verde) / "Aberto" (laranja) |
| Alunos atendidos hoje     | `/dashboard/my-shift-summary` | Contagem + tabela nome/turma           |

## Endpoints

Todos ficam em `pages/api/v1/reports/dashboard/`. Requerem sessão autenticada.

| Endpoint                                           | Permissão                 | Obrigatórios             | Opcionais               |
| -------------------------------------------------- | ------------------------- | ------------------------ | ----------------------- |
| `GET /api/v1/reports/dashboard/summary`            | `read:report:financial`   | —                        | —                       |
| `GET /api/v1/reports/dashboard/revenue-trend`      | `read:report:financial`   | —                        | `days` (int, default 7) |
| `GET /api/v1/reports/dashboard/category-breakdown` | `read:report:financial`   | `start_date`, `end_date` | —                       |
| `GET /api/v1/reports/dashboard/top-products`       | `read:report:financial`   | `start_date`, `end_date` | `limit` (default 5)     |
| `GET /api/v1/reports/dashboard/operator-summary`   | `read:report:financial`   | `start_date`, `end_date` | —                       |
| `GET /api/v1/reports/dashboard/my-shift-summary`   | qualquer role autenticada | —                        | —                       |

`summary` retorna `{ revenue_today, count_today, revenue_week, count_week, revenue_month, count_month, count_negative_balances, count_pending_closes }`.

`my-shift-summary` retorna `{ revenue_today, count_today, cash_close: CashClose | null, students_served: StudentServed[] }`.

## Seed de demonstração

Para demonstrar o dashboard a clientes com dados realistas:

```bash
npm run seed:demo                                            # insere dados no banco dev
npm run seed:demo -- --clear                                 # limpa e reinseriu
npm run seed:demo -- --clear-only                            # só limpa, sem reinserir
ENV_PATH=.env.staging node infra/scripts/seed-demo.js --yes # staging/prod
```

O script (`infra/scripts/seed-demo.js`) cria 5 usuários com domínio `@demo.cantina` (2 supervisores, 3 operadores), 30 alunos, 15 produtos, ~939 vendas em 30 dias com tendência crescente, 86 fechamentos de caixa e créditos. KPIs esperados após o seed:

- 5 alunos com saldo negativo (badge vermelho)
- 2 fechamentos pendentes hoje — Carlos e Marcos (badge laranja)
- Tendência de receita crescente nos últimos 30 dias

A limpeza (`--clear-only`) usa `NOT EXISTS` para não remover produtos ou [[aluno|alunos]] reais que eventualmente compartilhem o mesmo nome com itens demo.

## Related pages

- [[relatorios]]
- [[supervisor]]
- [[operador]]
- [[administrador]]
- [[fechamento-de-caixa]]
- [[aluno]]
