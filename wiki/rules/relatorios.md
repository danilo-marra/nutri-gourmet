# Relatórios

**Summary**: Oito endpoints de relatório — 5 originais do Phase 1 + 3 adicionados no PR #47 (vendas por produto, créditos consumidos, consumo por aluno). Todos acessíveis por supervisor e admin.

**Sources**: raw/decisions/relatorios.md

**Last updated**: 2026-06-11

---

## Permissões

Todos os relatórios são acessíveis por [[supervisor]] e [[administrador]]. O [[operador]] não acessa relatórios. (source: raw/decisions/relatorios.md)

`SUPERVISOR_FEATURES` inclui tanto `read:report:operational` quanto `read:report:financial`.

## Relatórios disponíveis

### Vendas por período

Total de vendas filtrado por data (dia/semana/mês). Agrupa por forma de pagamento (`credit`, `cash`, `card`, `pix` — pix adicionado no PR #56). (source: raw/decisions/relatorios.md)

### Créditos adicionados

Histórico de créditos manuais e de [[pacote|pacotes]] por [[aluno]]. Filtrável por aluno e por período. (source: raw/decisions/relatorios.md)

### Saldo por aluno

Lista de todos os [[aluno|alunos]] com saldo atual. Destaca saldos negativos para identificação rápida. (source: raw/decisions/relatorios.md)

### Fechamentos de caixa

Histórico de [[fechamento-de-caixa|fechamentos]] por operador e por data. Exibe status `pending` para dias sem fechamento. (source: raw/decisions/relatorios.md)

### Pacotes vigentes

Lista de [[pacote|pacotes]] ativos (`expires_at IS NULL OR expires_at > NOW()`). Exibe aluno, valor creditado e data de expiração quando definida. (source: raw/decisions/relatorios.md)

## Granularidade de data

Filtro por data suporta seleção de dia, semana ou mês. Sem granularidade de hora — o sistema opera em turno único diário. (source: raw/decisions/relatorios.md)

## Formato de saída

Visualização em tela (tabela paginada). Exportação (CSV, PDF) fora do escopo desta fase. (source: raw/decisions/relatorios.md)

## Implementação

Todos os endpoints ficam em `pages/api/v1/reports/`. Permissões divididas em dois grupos:

- **`read:report:financial`** — supervisor + admin: vendas, créditos, saldo por aluno
- **`read:report:operational`** — supervisor + admin: fechamentos de caixa, pacotes vigentes

| Endpoint                                  | Permissão                 | Parâmetros obrigatórios               | Parâmetros opcionais                           |
| ----------------------------------------- | ------------------------- | ------------------------------------- | ---------------------------------------------- |
| `GET /api/v1/reports/sales`               | `read:report:financial`   | `start_date`, `end_date` (YYYY-MM-DD) | —                                              |
| `GET /api/v1/reports/credits`             | `read:report:financial`   | `start_date`, `end_date`              | `student_id` (UUID)                            |
| `GET /api/v1/reports/balances`            | `read:report:financial`   | —                                     | —                                              |
| `GET /api/v1/reports/cash-closes`         | `read:report:operational` | —                                     | `start_date`, `end_date`, `operator_id` (UUID) |
| `GET /api/v1/reports/packages`            | `read:report:operational` | —                                     | —                                              |
| `GET /api/v1/reports/sales-by-product`    | `read:report:financial`   | `start_date`, `end_date` (YYYY-MM-DD) | —                                              |
| `GET /api/v1/reports/credits-consumed`    | `read:report:financial`   | `start_date`, `end_date` (YYYY-MM-DD) | —                                              |
| `GET /api/v1/reports/student-consumption` | `read:report:financial`   | `start_date`, `end_date` (YYYY-MM-DD) | —                                              |

`/reports/sales` retorna `{ by_payment_method: [...], grand_total }`. Os demais retornam arrays. `/reports/cash-closes` inclui dias sem fechamento com `status: "pending"` via CTE. `/reports/sales-by-product` e `/reports/credits-consumed` e `/reports/student-consumption` retornam arrays ordenados por `revenue DESC` / `total_consumed DESC`.

## 12 relatórios desejados pelo cliente (comparativo)

O cliente listou 12 relatórios como necessários para a operação (source: raw/fluxo-cantina.md). Status atualizado após PR #47:

| #   | Relatório desejado     | Status                                                                           |
| --- | ---------------------- | -------------------------------------------------------------------------------- |
| 1   | Vendas por escola      | ❌ requer multi-unidade                                                          |
| 2   | Vendas por unidade     | ❌ requer multi-unidade                                                          |
| 3   | Vendas por produto     | ✅ `GET /api/v1/reports/sales-by-product` + `pages/app/relatorios.tsx`           |
| 4   | Consumo por aluno      | ✅ `GET /api/v1/reports/student-consumption` + `pages/app/relatorios.tsx`        |
| 5   | Créditos carregados    | ✅ `GET /api/v1/reports/credits`                                                 |
| 6   | Créditos consumidos    | ✅ `GET /api/v1/reports/credits-consumed` + `pages/app/relatorios.tsx`           |
| 7   | Faturamento diário     | ✅ `GET /api/v1/reports/dashboard/revenue-trend` + `pages/app/relatorios.tsx`    |
| 8   | Faturamento mensal     | ✅ `GET /api/v1/reports/sales` (filtro por mês) + `pages/app/relatorios.tsx`     |
| 9   | Recebimentos Stone     | ⚠️ parcial — dados em `pending_stone_payments` (PR #56); falta endpoint dedicado |
| 10  | Eventos realizados     | ❌ requer módulo de eventos                                                      |
| 11  | Estoque atual          | ❌ requer controle de estoque (no MarketUp por ora)                              |
| 12  | Produtos mais vendidos | ✅ `GET /api/v1/reports/dashboard/top-products`                                  |

Ver [[fluxo-operacional]] e [[gap-analysis]] para o contexto completo.

## Related pages

- [[supervisor]]
- [[administrador]]
- [[venda]]
- [[credito]]
- [[pacote]]
- [[fechamento-de-caixa]]
- [[aluno]]
