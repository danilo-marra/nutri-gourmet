# Wiki Log

Append-only record of all wiki operations.

---

## 2026-05-27 — Ingestão inicial: raw/prd.md

**Páginas criadas (13):**

- `wiki/prd-summary.md` — resumo do PRD com links para todas as entidades
- `wiki/domain/operador.md`
- `wiki/domain/supervisor.md`
- `wiki/domain/administrador.md`
- `wiki/domain/aluno.md`
- `wiki/domain/produto.md`
- `wiki/domain/venda.md`
- `wiki/domain/credito.md`
- `wiki/domain/pacote.md`
- `wiki/domain/fechamento-de-caixa.md`
- `wiki/rules/escopo.md`
- `wiki/rules/seguranca.md`
- `wiki/rules/ui-ux.md`

**Páginas de infraestrutura criadas:**

- `wiki/index.md`
- `wiki/log.md`

**Observações:** Várias entidades de domínio (aluno, produto, venda, crédito, pacote) estão marcadas com `[needs verification]` pois o PRD não define seus campos ou regras de negócio com precisão suficiente para implementação.

---

## 2026-05-27 — Q&A de domínio: Aluno, Produto, Venda, Crédito/Pacote, Operações

**Arquivos de decisão criados (5):**

- `raw/decisions/aluno.md` — campos obrigatórios, is_full_time, regra de saldo negativo
- `raw/decisions/produto.md` — campos, 5 categorias fixas, flag ativo, snapshot de preço
- `raw/decisions/venda.md` — múltiplos itens (sale_items), formas de pagamento, estorno
- `raw/decisions/credito-pacote.md` — modelo R$, saldo negativo com trava de operador, pacote como crédito no pool
- `raw/decisions/operacoes.md` — fechamento de caixa não bloqueante, criação de contas via convite e-mail

**Páginas wiki atualizadas (6):**

- `wiki/domain/aluno.md` — campos e regras de saldo negativo preenchidos
- `wiki/domain/produto.md` — campos, categorias e preço histórico preenchidos
- `wiki/domain/venda.md` — schema de sale_items, formas de pagamento e estorno preenchidos
- `wiki/domain/credito.md` — modelo R$ e regras de saldo negativo preenchidos
- `wiki/domain/pacote.md` — modelo de crédito R$ preenchido; validade e responsável ainda `[needs verification]`
- `wiki/domain/fechamento-de-caixa.md` — obrigatoriedade preenchida; relatório e delegação ainda `[needs verification]`

**`wiki/index.md`** atualizado com seção "Decisões (raw/decisions/)" e descrições revisadas das entidades.

---

## 2026-05-27 — Q&A de domínio: Pacote, Fechamento de Caixa, Relatórios

**Arquivos de decisão atualizados (2):**

- `raw/decisions/credito-pacote.md` — adicionadas seções: validade do pacote (expires_at opcional), quem pode registrar (supervisor/admin), múltiplos simultâneos permitidos
- `raw/decisions/operacoes.md` — adicionadas seções: relatório básico do fechamento (total por pagamento + operador) e delegação (supervisor/admin pode fechar em nome do operador)

**Arquivo de decisão criado (1):**

- `raw/decisions/relatorios.md` — 5 relatórios prioritários (vendas por período, créditos adicionados, saldo por aluno, fechamentos de caixa, pacotes vigentes); permissões, granularidade de data, formato de saída

**Páginas wiki atualizadas (2):**

- `wiki/domain/pacote.md` — removidas `[needs verification]`; validade, quem registra e múltiplos simultâneos documentados
- `wiki/domain/fechamento-de-caixa.md` — removidas `[needs verification]`; relatório básico e delegação documentados

**Página wiki criada (1):**

- `wiki/rules/relatorios.md` — nova página de regras para os 5 relatórios desta fase

**`wiki/index.md`** atualizado: entradas para `raw/decisions/relatorios.md` e `wiki/rules/relatorios.md`; descrições de Pacote e Fechamento de Caixa revisadas.

---

## 2026-05-27 — Q&A de domínio: Supervisor

**Arquivo de decisão criado (1):**

- `raw/decisions/supervisor.md` — tabela de permissões completa; criação da conta via convite (mesmo fluxo do operador)

**Páginas wiki atualizadas (3):**

- `wiki/domain/supervisor.md` — removidas `[needs verification]`; permissões, restrições e criação de conta documentados
- `wiki/rules/seguranca.md` — tabela de permissões expandida com coluna Supervisor totalmente preenchida e novas linhas (estorno, pacotes, crédito negativo, delegação de caixa, gestão de operadores)
- `wiki/index.md` — descrição do Supervisor corrigida; entrada para `raw/decisions/supervisor.md` adicionada
