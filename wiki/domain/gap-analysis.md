# Gap Analysis — Consolidado de Entrega vs. Expectativa do Cliente

**Summary**: Cruzamento entre o que o cliente espera do sistema (raw/fluxo-cantina.md + raw/mapeamento-sistemas-atuais.md) e o que está implementado, com indicação do que pode ser entregue hoje, o que precisa de ajuste e o que está fora do escopo atual.

**Sources**: raw/fluxo-cantina.md, raw/mapeamento-sistemas-atuais.md, raw/possivel-integrar.md

**Last updated**: 2026-06-02

---

## ✅ Entregável hoje (já implementado)

| Funcionalidade                                                                | Onde no sistema                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Venda direta no caixa (cash/card)                                             | `POST /api/v1/sales` + `pages/app/vendas.js`                  |
| Crédito manual de aluno (operador)                                            | `POST /api/v1/students/[id]/credits`                          |
| Pacotes de crédito (supervisor/admin)                                         | `models/credit.js` + rotas de pacotes                         |
| Fechamento de caixa por turno                                                 | `POST /api/v1/cash_closes`                                    |
| Gestão de alunos, produtos, usuários                                          | CRUD completo                                                 |
| RBAC Operador / Supervisor / Admin                                            | `models/authorization.js` com `can()` e `filterOutput()`      |
| Relatório de vendas por período                                               | `GET /api/v1/reports/sales`                                   |
| Relatório de créditos adicionados                                             | `GET /api/v1/reports/credits`                                 |
| Relatório de saldo por aluno                                                  | `GET /api/v1/reports/balances`                                |
| Relatório de fechamentos de caixa                                             | `GET /api/v1/reports/cash-closes`                             |
| Relatório de pacotes vigentes                                                 | `GET /api/v1/reports/packages`                                |
| Dashboard: summary, revenue trend, top products, category, operator, my-shift | `GET /api/v1/reports/dashboard/*` (6 endpoints)               |
| Auth completa (sessão, ativação, reset de senha)                              | `models/session`, `models/activation`, `models/passwordReset` |

---

## ⚠️ Parcialmente coberto (ajuste ou complemento necessário)

| Funcionalidade                              | Status atual                                                         | O que falta                                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Vendas por produto** (relatório dedicado) | `topProducts` existe como widget de dashboard com parâmetros de data | Expor como relatório gerencial com paginação; ou documentar que o endpoint de dashboard já atende |
| **Consumo por aluno**                       | Derivável das vendas filtrando por `student_id`                      | Endpoint dedicado `/reports/student-consumption` ou parâmetro `student_id` em `/reports/sales`    |
| **Créditos consumidos**                     | Implícito em vendas com `payment_method=credit`                      | Relatório separado ou adicionar coluna `consumed` ao endpoint de créditos                         |
| **Dashboard com dados reais**               | `pages/app/index.js` usa mocks (TODO no código)                      | Substituir mocks por chamadas reais aos endpoints de dashboard já implementados                   |
| **Faturamento diário/mensal**               | `revenueTrend` e `salesByPeriod` cobrem isso                         | Nenhum ajuste técnico; só garantir que a UI exponha os filtros corretos                           |

---

## ❌ Não implementado (fora do Phase 1 ou dependência externa)

| Funcionalidade                            | Complexidade | Caminho possível                                                              | Bloqueio                                                      |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Integração Stone** (webhook)            | Média        | Endpoint de webhook + validação de assinatura + chama `models/sale` existente | Nenhum — Stone tem API aberta                                 |
| **Integração Vlupt** (recarga automática) | Média        | Endpoint de webhook que registra `credit_transaction`                         | Confirmar se Vlupt tem API/webhook                            |
| **Integração MarketUp** (push de venda)   | Alta         | API do MarketUp recebe dados de venda após registro                           | API do MarketUp é limitada/fechada; precisa de acesso técnico |
| **Controle de estoque próprio**           | Alta         | Tabela `stock_movements`, campo `quantity` em produtos                        | Desnecessário enquanto MarketUp cobre isso                    |
| **Emissão fiscal (NFC-e / NF-e / DANFE)** | Muito Alta   | Sistema fiscal dedicado ou integração MarketUp                                | Explicitamente fora do Phase 1; MarketUp já emite             |
| **Eventos escolares** (Fluxo 4)           | Média        | Modelar como venda especial + conta de escola                                 | Emissão de NF-e é requisito do fluxo; fora do Phase 1         |
| **Multi-escola / multi-unidade**          | Muito Alta   | Schema multi-tenant, hierarquia de unidades                                   | Fora do Phase 1; sistema single-tenant                        |
| **Relatório: vendas por escola/unidade**  | Bloqueado    | Depende de multi-unidade                                                      | —                                                             |
| **Relatório: recebimentos Stone**         | Bloqueado    | Depende de integração Stone                                                   | —                                                             |
| **Relatório: estoque atual**              | Bloqueado    | Depende de controle de estoque                                                | —                                                             |
| **Relatório: eventos realizados**         | Bloqueado    | Depende de módulo de eventos                                                  | —                                                             |

---

## 🗑️ O que NÃO precisará ser construído (escopo reduzido)

| Item                           | Motivo                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Módulo de estoque próprio**  | MarketUp continua como PDV/estoque/fiscal; nosso sistema envia dados, não replica a função |
| **Emissão fiscal própria**     | Mesma razão; nota é emitida no MarketUp ou num sistema fiscal dedicado                     |
| **Módulo de eventos dedicado** | Pode ser modelado como venda especial vinculada a uma conta de escola quando/se necessário |
| **Módulo Stone complexo**      | Webhook Stone apenas chama `models/sale` existente; nenhuma tabela nova necessária         |

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
2. **Vlupt tem API/webhook?** — define se recarga é automática ou manual (importação de arquivo)
3. **Escopo de eventos escolares** — incluir no Phase 2 ou tratar como fora de escopo definitivo?

---

## Related pages

- [[fluxo-operacional]]
- [[sistemas-externos]]
- [[integracao]]
- [[escopo]]
- [[relatorios]]
- [[venda]]
- [[credito]]
