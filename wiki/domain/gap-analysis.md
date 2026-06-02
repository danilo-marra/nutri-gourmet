# Gap Analysis — Consolidado de Entrega vs. Expectativa do Cliente

**Summary**: Cruzamento entre o que o cliente espera do sistema (raw/fluxo-cantina.md + raw/mapeamento-sistemas-atuais.md) e o que está implementado, com indicação do que pode ser entregue hoje, o que precisa de ajuste e o que está fora do escopo atual.

**Sources**: raw/fluxo-cantina.md, raw/mapeamento-sistemas-atuais.md, raw/possivel-integrar.md, raw/decisions/sistemas-externos.md, raw/decisions/eventos-integral.md

**Last updated**: 2026-06-02

---

## ✅ Entregável hoje (já implementado)

| Funcionalidade                                                                | Onde no sistema                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Venda direta no caixa (cash/card)                                             | `POST /api/v1/sales` + `pages/app/vendas.js`                          |
| Crédito manual de aluno (operador)                                            | `POST /api/v1/students/[id]/credits`                                  |
| Pacotes de crédito (supervisor/admin)                                         | `models/credit.js` + rotas de pacotes                                 |
| Fechamento de caixa por turno                                                 | `POST /api/v1/cash_closes`                                            |
| Gestão de alunos, produtos, usuários                                          | CRUD completo                                                         |
| RBAC Operador / Supervisor / Admin                                            | `models/authorization.js` com `can()` e `filterOutput()`              |
| Relatório de vendas por período                                               | `GET /api/v1/reports/sales`                                           |
| Relatório de créditos adicionados                                             | `GET /api/v1/reports/credits`                                         |
| Relatório de saldo por aluno                                                  | `GET /api/v1/reports/balances`                                        |
| Relatório de fechamentos de caixa                                             | `GET /api/v1/reports/cash-closes`                                     |
| Relatório de pacotes vigentes                                                 | `GET /api/v1/reports/packages`                                        |
| Dashboard: summary, revenue trend, top products, category, operator, my-shift | `GET /api/v1/reports/dashboard/*` (6 endpoints)                       |
| Auth completa (sessão, ativação, reset de senha)                              | `models/session`, `models/activation`, `models/passwordReset`         |
| Relatório de vendas por produto                                               | `GET /api/v1/reports/sales-by-product` + `pages/app/relatorios.js`    |
| Relatório de créditos consumidos                                              | `GET /api/v1/reports/credits-consumed` + `pages/app/relatorios.js`    |
| Relatório de consumo por aluno                                                | `GET /api/v1/reports/student-consumption` + `pages/app/relatorios.js` |
| Faturamento diário/mensal — exposição na UI                                   | `pages/app/relatorios.js` (seções Faturamento Diário/Mensal)          |

---

## ⚠️ Parcialmente coberto (ajuste ou complemento necessário)

| Funcionalidade                | Status atual                                    | O que falta                                                                     |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| **Dashboard com dados reais** | `pages/app/index.js` usa mocks (TODO no código) | Substituir mocks por chamadas reais aos endpoints de dashboard já implementados |

---

## ❌ Não implementado (fora do Phase 1 ou dependência externa)

| Funcionalidade                            | Complexidade | Caminho possível                                                              | Bloqueio                                                             |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Integração Stone** (webhook)            | Média        | Endpoint de webhook + validação de assinatura + chama `models/sale` existente | ⚠️ **Risco fiscal ativo** — P1 no roadmap                            |
| **Integração Vlupt** (recarga automática) | Média        | Endpoint de webhook que registra `credit_transaction`                         | Confirmar API/webhook com suporte — P2 no roadmap                    |
| **Módulo Integral** (faturamento)         | Média        | Tabela `recurring_invoices`; `is_full_time` já no schema                      | ⚠️ 10 parcelas/ano, NF-e mensal, 100% manual hoje — P4 no roadmap    |
| **Eventos escolares** (Fluxo 4)           | Média        | Tabelas `events` + `event_items`; entidade escola                             | ⚠️ ≥ 1–2/mês, cobrança manual, NF-e obrigatória — P3 no roadmap      |
| **Emissão fiscal (NFC-e / NF-e / DANFE)** | Muito Alta   | Provider externo (Plugnotas, NFe.io); habilitador de P1–P4                    | ⚠️ **Risco fiscal ativo** — P5 no roadmap                            |
| **Integração MarketUp** (push de venda)   | Alta         | API do MarketUp recebe dados de venda após registro                           | API limitada/fechada; decisão de substituição em aberto — P7         |
| **Controle de estoque próprio**           | Alta         | Tabela `stock_movements`, campo `quantity` em produtos                        | MarketUp cobre no curto prazo; melhoria desejada no médio prazo — P6 |
| **Multi-escola / multi-unidade**          | Muito Alta   | Schema multi-tenant, hierarquia de unidades                                   | Fora do Phase 1; sistema single-tenant                               |
| **Relatório: vendas por escola/unidade**  | Bloqueado    | Depende de multi-unidade                                                      | —                                                                    |
| **Relatório: recebimentos Stone**         | Bloqueado    | Depende de integração Stone                                                   | —                                                                    |
| **Relatório: estoque atual**              | Bloqueado    | Depende de controle de estoque                                                | —                                                                    |
| **Relatório: eventos realizados**         | Bloqueado    | Depende de módulo de eventos                                                  | —                                                                    |

---

## 🗑️ O que NÃO precisará ser construído (escopo reduzido)

| Item                          | Motivo                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Módulo de estoque próprio** | MarketUp cobre no curto prazo; construir só se MarketUp sair (decisão em aberto)   |
| **Módulo Stone complexo**     | Webhook Stone apenas chama `models/sale` existente; nenhuma tabela nova necessária |

**Nota**: "Emissão fiscal própria" e "Módulo de eventos dedicado" foram removidos desta seção — ambos entraram no backlog prioritário (P5 e P3, respectivamente) após Q&A com o cliente em 2026-06-02. Ver [[escopo]].

---

## ♻️ Reuso de infraestrutura existente

| Integração futura     | Infraestrutura atual que será reaproveitada                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| Stone webhook         | `models/sale` (create) + `POST /api/v1/sales` — basta criar o handler de webhook     |
| Vlupt webhook         | `models/credit` (createTransaction) + rota existente de créditos                     |
| Relatórios adicionais | `models/report` — novas funções de query; endpoints existentes com parâmetros extras |

---

## Decisões pendentes (bloqueiam implementação)

1. **MarketUp fica ou sai?** — define se precisamos de módulo fiscal/estoque próprio ou apenas envio de dados
2. **Vlupt tem API/webhook?** — define se recarga é automática ou manual (importação de arquivo); confirmar com suporte
3. **Schema `payment_method`** — antes de implementar Stone: adicionar `pix` + `link` ao enum, ou restringir Stone a `card`? Decisão afeta migrations e relatórios de fechamento de caixa. Ver [[integracao]] seção Stone.
4. **Provider fiscal** — qual serviço emitirá NF-e/NFC-e (Plugnotas, NFe.io etc.)? Necessário antes de P5.

**Resolvidas no Q&A 2026-06-02**: fiscal digital deve ser 100% automático (sem lançamento manual); eventos entram no Phase 2 (P3); Integral entra no Phase 2 (P4); estoque permanece no MarketUp no curto prazo.

---

## Related pages

- [[fluxo-operacional]]
- [[sistemas-externos]]
- [[integracao]]
- [[escopo]]
- [[relatorios]]
- [[venda]]
- [[credito]]
- [[eventos]]
- [[integral]]
- [[fiscal]]
