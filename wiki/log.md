# Wiki Log

Append-only record of all wiki operations.

---

## 2026-05-29 — Auditoria de segurança (skill `security-check`)

**Páginas wiki atualizadas:** `wiki/rules/seguranca.md` — nova seção "Achados de auditoria (skill `security-check`)".

**O que foi feito:** primeira execução da skill `security-check` (auditoria OWASP Top 10) sobre o repo. Registrado na wiki: o 🔴 corrigido (escalada de privilégio no `PATCH /users/[username]`, PR #29) e as dívidas 🟡 conscientemente adiadas — sem rate limit no login (issue #30) e lógica de role inline nos handlers de `users` (contradiz a regra "nunca permissão inline").

**Não alterado (justificado):** sem mudança em páginas de domínio — achados são sobre implementação/segurança, não sobre regras de negócio novas.

---

## 2026-05-28 — PR #27: adição de índices FK em todas as tabelas de domínio

**CLAUDE.md atualizado:** Sem alterações necessárias — nenhum novo modelo, endpoint ou helper.

**Páginas wiki atualizadas:** Nenhuma — mudança puramente de infraestrutura de banco de dados.

**O que foi feito:** Migration `1779996263448_add-fk-indexes` adiciona 9 índices em colunas FK que o PostgreSQL não indexa automaticamente: `sessions.user_id`, `sales.student_id`, `sales.operator_id`, `sales.reversed_by`, `sale_items.sale_id`, `sale_items.product_id`, `credit_transactions.student_id`, `credit_transactions.operator_id`, `cash_closes.closed_by_id`. Detectado via skill `/perf` (auditoria de cobertura de índices). Índice `reversed_by` adicionado após revisão de código P2 (Codex).

**Não alterado (justificado):** `CREATE INDEX CONCURRENTLY` não aplicado — requer `{ transaction: false }` na migration e as tabelas estão vazias em dev/prod. Nota salva em memória para aplicar antes do primeiro deploy com volume real.

---

## 2026-05-28 — PR #25: remoção de graphify-out/ do rastreamento git

**`.gitignore` atualizado:**

- `graphify-out/` adicionado — artefatos gerados pelo graphify não pertencem ao repositório.

**Rastreamento removido:**

- `git rm -r --cached graphify-out/` aplicado para desrastrear os 78 arquivos já comitados no PR #24. Arquivos locais preservados; apenas o índice git foi limpo.

**Não alterado:** nenhuma página wiki afetada — mudança puramente de infraestrutura do repositório.

---

## 2026-05-28 — PR #24: cobertura de teste para saldo parcialmente insuficiente

**Arquivo alterado:**

- `tests/integration/api/v1/sales/post.test.js` — adicionado teste `"Deve retornar 400 quando saldo parcial é insuficiente (balance < total)"`.

**Cenário coberto:** aluno com R$5 de saldo tenta comprar produto de R$10 via `credit`. Verifica que a venda é bloqueada com `ValidationError` e que o saldo permanece intacto após a tentativa.

**Motivação:** o teste anterior (`"saldo insuficiente"`) cobria apenas `balance = 0`. O novo teste cobre o caminho mais realista em produção — saldo existe, mas é insuficiente para o total — confirmando o comportamento documentado em [[venda]] (bloqueio + proteção atômica `WHERE balance >= total`).

**Não alterado:** nenhuma página wiki afetada — comportamento já estava documentado em `wiki/domain/venda.md`.

---

## 2026-05-28 — Sincronização pré-frontend: passwordReset + email PT-BR + DATABASE_URL

**CLAUDE.md atualizado:**

- Adicionado `passwordReset` à lista de models.
- Adicionado `deleteAllEmails` à lista de helpers do orchestrator.

**Páginas wiki criadas:**

- `wiki/domain/recuperacao-de-senha.md` — fluxo completo de recuperação de senha, endpoints POST e PATCH, segurança (anti-enumeração, consumo atômico, expiração 30 min).

**Páginas wiki atualizadas:**

- `wiki/index.md` — adicionada entrada para `recuperacao-de-senha.md` na seção Entidades.

**Não alterado (justificado):**

- `wiki/rules/seguranca.md` — tabela de permissões não cobre fluxos anônimos; recuperação de senha não requer feature flag.

---

## 2026-05-28 — PR #16: gestão de contas de operador pelo supervisor

**CLAUDE.md atualizado:**

- Linha da tabela "Operations": corrigido "admin → email invite" para "supervisor/admin → email invite", refletindo que supervisores agora também podem criar contas.

**Páginas wiki atualizadas:**

- `wiki/domain/supervisor.md` — adicionada seção "Implementação — Gestão de contas de Operador" com tabela dos três endpoints (`GET`, `POST`, `PATCH /api/v1/users`) e suas restrições de role.
- `wiki/domain/operador.md` — seção "Criação da conta" atualizada para incluir Supervisor como criador possível.

**Não alterado (justificado):**

- `wiki/rules/seguranca.md` — tabela de permissões já refletia corretamente as permissões de gestão de contas; nenhuma alteração necessária.
- `wiki/domain/administrador.md` — `[needs verification]` sobre criação da conta de admin não é resolvido por este PR; mantido sem alteração.

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

## 2026-05-27 — Implementação do módulo de Vendas + lint da wiki

**Arquivo de decisão atualizado (1):**

- `raw/decisions/venda.md` — adicionadas decisões: saldo insuficiente bloqueia a venda; estorno via soft delete (`reversed_at`/`reversed_by`); operador cancela própria venda em até 5 minutos

**CLAUDE.md atualizado:**

- `models/` — adicionado `sale`
- `tests/orchestrator.js` — adicionado `createSale(studentId, operatorId, overrides?)`

**Páginas wiki corrigidas (lint):**

- `wiki/domain/venda.md` — schema atualizado (reversed_at, reversed_by, updated_at); seção Estorno substituída por tabela Cancelamento/Estorno com regras de janela; nova seção Saldo Insuficiente
- `wiki/domain/aluno.md` — seção Saldo Negativo desambiguada: regra de crédito vs. regra de venda
- `wiki/domain/credito.md` — seção Saldo Negativo desambiguada; seção Adição de Crédito atualizada para presente (módulo implementado)
- `wiki/domain/operador.md` — resolvidas duas `[needs verification]`: criação de conta (convite por e-mail) e cancelamento de vendas (5 min)
- `wiki/rules/seguranca.md` — tabela de permissões: linha "Estornar vendas" separada em "Cancelar própria venda (5 min)" (✅ operador) e "Estornar qualquer venda" (❌ operador)
- `wiki/index.md` — descrição de Venda atualizada

---

## 2026-05-27 — Q&A de domínio: Supervisor

**Arquivo de decisão criado (1):**

- `raw/decisions/supervisor.md` — tabela de permissões completa; criação da conta via convite (mesmo fluxo do operador)

**Páginas wiki atualizadas (3):**

- `wiki/domain/supervisor.md` — removidas `[needs verification]`; permissões, restrições e criação de conta documentados
- `wiki/rules/seguranca.md` — tabela de permissões expandida com coluna Supervisor totalmente preenchida e novas linhas (estorno, pacotes, crédito negativo, delegação de caixa, gestão de operadores)
- `wiki/index.md` — descrição do Supervisor corrigida; entrada para `raw/decisions/supervisor.md` adicionada

---

## 2026-05-27 — Correção RBAC: read:report:financial para supervisor

**`models/authorization.js` atualizado:**

- `read:report:financial` movido de `ADMIN_FEATURES` exclusivo para `SUPERVISOR_FEATURES` — alinha com a decisão de que todos os 5 relatórios são acessíveis por supervisor e admin

**`wiki/rules/relatorios.md` atualizado:**

- Aviso de inconsistência removido; nota de implementação adicionada

---

## 2026-05-27 — Implementação do módulo de Fechamento de Caixa + lint da wiki

**CLAUDE.md atualizado:**

- `models/` — adicionado `cash_close`
- `tests/orchestrator.js` — adicionado `createCashClose(operatorId, closedById, overrides?)`

**Páginas wiki corrigidas (lint):**

- `wiki/domain/fechamento-de-caixa.md` — seção Implementação adicionada: endpoints POST/GET, parâmetros, constraint de duplicata
- `wiki/domain/produto.md` — linha de abertura corrigida: produtos são cadastrados por supervisor **ou** admin (não só admin)
- `wiki/rules/relatorios.md` — aviso de inconsistência adicionado: `read:report:financial` é só admin no RBAC, mas decisão diz todos os 5 são supervisor+; sinalizado para resolver antes de implementar relatórios

**Não alterado (justificado):**

- `wiki/domain/administrador.md` — `[needs verification]` sobre criação e multiplicidade da conta admin permanecem; sem fonte nova que resolva
- `wiki/rules/ui-ux.md` — não é órfã; `prd-summary.md` linka via `[[ui-ux]]`

---

## 2026-05-28 — Implementação do módulo de Relatórios (PR #14)

**CLAUDE.md atualizado:**

- `models/` — adicionado `report`

**`wiki/rules/relatorios.md` atualizado:**

- Seção "Implementação" adicionada: tabela com os 5 endpoints, split de permissões (`read:report:financial` vs `read:report:operational`), parâmetros obrigatórios/opcionais e formato de resposta de cada endpoint
- "Last updated" atualizado para 2026-05-28

**`wiki/domain/fechamento-de-caixa.md` atualizado:**

- `[[relatorios]]` adicionado em Related pages (o endpoint `GET /api/v1/reports/cash-closes` usa dados de fechamentos)

---

## 2026-05-27 — Remoção de guard dead code em crédito

**Código alterado (1):**

- `pages/api/v1/students/[id]/credits/index.js` — removida guarda de saldo negativo no `postHandler`; com vendas bloqueando quando `balance < total`, o saldo nunca fica negativo por operação normal, tornando o guard inacessível

**Páginas wiki atualizadas (2):**

- `wiki/domain/credito.md` — seção Saldo Negativo simplificada; removida menção à guarda defensiva
- `wiki/domain/aluno.md` — seção Saldo Negativo simplificada; removida menção à guarda em `credit.js`
