# Wiki Log

Append-only record of all wiki operations.

---

## 2026-06-10 — PR #66: migração TypeScript do frontend (PR4, encerra issue #59)

**Branch**: 59-ts-pr4-frontend
**PR**: #66

**What changed**: Os 14 arquivos do frontend foram convertidos para `.tsx`/`.ts` (PR4, última fase da issue #59): `hooks/useUser.ts`, `components/AppShell.tsx`, `pages/_app.tsx` (padrão `NextPageWithLayout`), páginas públicas e as 8 páginas de `pages/app/`. Novidades de tipos: `SessionUser` em `types/index.ts` (formato wire de `GET /api/v1/user`) e `types/css.d.ts` (exigência do TS 6 para imports de CSS). Zero mudança de runtime; `allowJs` permanece no tsconfig porque o Next 14 o re-adiciona enquanto tests/scripts/migrations ficam em JS.

Wiki pages updated:

- `rules/relatorios.md` — 5 refs `pages/app/relatorios.js` → `.tsx`
- `rules/ui-ux.md` — refs `_app`, `AppShell`, `useUser` → `.tsx`/`.ts`; nota sobre TypeScript no frontend e tipo `SessionUser`
- `domain/fluxo-operacional.md` — 2 refs `relatorios.js` → `.tsx`
- `domain/gap-analysis.md` — refs `vendas`, `creditos`, `relatorios` (×4) e `index` → `.tsx`

Lint fixes (achados não relacionados ao PR #66):

- `rules/ui-ux.md` — tabela de superfícies: `/app/creditos` e `/app/relatorios` estavam como "Placeholder", mas são páginas implementadas (PRs #47/#56); nota de imagens placeholder (`picsum.photos`) atualizada — a landing usa fotos reais de `public/cantina/`
- `domain/gap-analysis.md` — linha "Venda direta no caixa" citava `pages/app/vendas` como entregue, contradizendo `ui-ux.md` (a UI é stub); corrigido para apontar só a API
- `domain/fluxo-operacional.md` — Fluxo 3 (Stone) dizia "passo 5 depende de integração Stone", mas o webhook + fila existem desde o PR #56; status atualizado para parcial com link para [[stone-webhook]]
- `rules/relatorios.md` — formas de pagamento do relatório de vendas: `credit/cash/card` → inclui `pix` (existe desde o PR #56; mesmo desvio corrigido no índice pelo lint do PR #64)

**Não alterado (justificado):** entradas históricas deste log mantêm os nomes `.js` da época; `raw/` é imutável. Com isso, a migração TypeScript (#59) está 100% refletida na wiki.

---

## 2026-06-10 — PR #64: migração TypeScript das rotas de API (pages/api/v1/)

**Branch**: 59-ts-pr3-api
**PR**: #64

**What changed**: As 35 rotas de `pages/api/v1/**` foram convertidas de `.js` para `.ts` (PR3 da issue #59). Apenas tipos — handlers tipados com `NextApiRequest`/`NextApiResponse`, casts em params dinâmicos e `validateDate` como assertion function. Zero mudança de comportamento, contrato da API v1 intacto.

Wiki pages updated:

- `rules/seguranca.md` — ref do check inline de role: `pages/api/v1/users/index.js:18` → `index.ts:19`
- `domain/stone-webhook.md` — heading "Modelo `stoneWebhook.js`" → `.ts` (resíduo do PR2 detectado no lint)

Lint fixes (achados não relacionados ao PR #64):

- `index.md` — descrição de Venda atualizada: `credit/cash/card` → `credit/cash/card/pix` (pix existe desde o PR #56; índice estava defasado)
- `domain/sistemas-externos.md` — seção "Papel no sistema unificado" da Stone reescrita: dizia que o webhook criaria uma _venda_ (`payment_method: 'card'`), contradizendo `stone-webhook.md`/`integracao.md` — o implementado é fila `pending_stone_payments` + reconciliação manual → `credit_transaction` tipo `stone`

**Não alterado (justificado):** referências a `pages/app/*.js`, `hooks/useUser.js`, `components/AppShell.js` e `pages/_app.js` continuam corretas — frontend só migra no PR4; entradas históricas deste log mantêm os nomes `.js` da época.

---

## 2026-06-09 — PRs #60/#62: migração TypeScript (tooling + infra/ + models/)

**CLAUDE.md atualizado:**

- Referências de arquivos convertidos `.js` → `.ts`: `models/{session,authorization,activation}`, `infra/{controller,errors,database,email,webserver}` (seções Constitution authority e Repo layout)
- Linha do pre-commit já refletia lint-staged (commit anterior na branch)

**Páginas wiki atualizadas (5):**

- `wiki/domain/gap-analysis.md` — refs `models/credit.js`, `models/authorization.js`, `models/stoneWebhook.js` → `.ts`
- `wiki/rules/seguranca.md` — ref `models/authorization.js` → `.ts`
- `wiki/domain/operador.md` — ref `models/activation.js` → `.ts`
- `wiki/domain/supervisor.md` — refs `models/activation.js` e `models/authorization.js` → `.ts`
- `wiki/domain/recuperacao-de-senha.md` — Sources: `models/passwordReset.js` → `.ts`

**Páginas wiki criadas:** Nenhuma — refactor sem mudança de domínio.

**Não alterado (justificado):** entradas históricas deste log mantêm os nomes `.js` da época; `raw/` é imutável.

---

## 2026-06-09 — PR #56: webhook Stone/Pagar.me + reconciliação de crédito

**CLAUDE.md atualizado:**

- `models/*` — adicionado `stoneWebhook`

**Páginas wiki criadas (1):**

- `wiki/domain/stone-webhook.md` — fluxo completo: webhook `POST /webhooks/stone/payment`, fila `pending_stone_payments`, reconciliação `POST /stone-payments/[id]/match`, autenticação Basic Auth, RBAC e limitações

**Páginas wiki atualizadas (6):**

- `wiki/domain/venda.md` — `pix` adicionado à lista de `payment_method`
- `wiki/domain/credito.md` — tipo `stone` adicionado ao enum de `credit_transactions`; fluxo de reconciliação Stone documentado; link para `[[stone-webhook]]`
- `wiki/rules/seguranca.md` — nova linha na tabela de permissões: "Ver/reconciliar pagamentos Stone" (supervisor/admin)
- `wiki/domain/gap-analysis.md` — Stone movido de ❌ para ✅; "Relatório: recebimentos Stone" atualizado para ⚠️ Parcial; decisão pendente de `payment_method` marcada como resolvida; 🗑️ e ♻️ atualizados
- `wiki/domain/integracao.md` — seção Stone reescrita: estratégia futura substituída pelo que foi implementado; tabela de prioridade atualizada; decisão de idempotência marcada como resolvida
- `wiki/index.md` — entrada para `stone-webhook.md` adicionada

**Não alterado (justificado):**

- `wiki/domain/fluxo-operacional.md` — tabela dos 12 relatórios não mudou; Stone ainda não tem relatório dedicado
- `wiki/rules/relatorios.md` — nenhum novo endpoint de relatório entregue no PR #56

---

## 2026-06-02 — Q&A com o cliente: sistemas externos, fiscal, eventos e módulo Integral

**Fontes**: respostas diretas do cliente (dono da cantina) em sessão de Q&A.

**Arquivos de decisão criados (2):**

- `raw/decisions/sistemas-externos.md`
- `raw/decisions/eventos-integral.md`

**Páginas wiki criadas (3):**

- `wiki/domain/eventos.md`
- `wiki/domain/integral.md`
- `wiki/rules/fiscal.md`

**Páginas wiki atualizadas (5):**

- `wiki/domain/sistemas-externos.md` — seção "Perguntas abertas" substituída por confirmações do Q&A; risco fiscal Stone documentado
- `wiki/domain/integracao.md` — urgência fiscal adicionada à Stone; Vlupt app/site confirmado; tabela de prioridades atualizada
- `wiki/domain/fluxo-operacional.md` — Fluxo 4 detalhado com ciclo completo; Fluxo 5 (Integral) adicionado
- `wiki/rules/escopo.md` — fiscal, eventos e Integral elevados a backlog prioritário (⚠️)
- `wiki/domain/gap-analysis.md` — Integral adicionado; urgências P1–P5 documentadas; decisões resolvidas registradas

**Principais confirmações do Q&A:**

- Stone: risco fiscal ativo (vendas não registradas); 100% de cobertura de canal é meta do cliente.
- Vlupt: pais usam app/site; processo hoje manual; API/webhook pendente de confirmação.
- MarketUp: permanece por ora; substituição depende de integração própria funcionar.
- Eventos: ≥ 1–2/mês, cobrança manual, NF-e obrigatória — P3 no roadmap.
- Integral: 10 parcelas/ano, NF-e mensal, `is_full_time` já no schema — P4 no roadmap.

---

## 2026-06-02 — PR #47: relatórios parciais complementados (issue #46)

**Páginas wiki atualizadas (3):**

- `wiki/domain/gap-analysis.md` — 4 itens movidos de ⚠️ para ✅: vendas por produto, consumo por aluno, créditos consumidos e faturamento diário/mensal. Seção ⚠️ mantém apenas "Dashboard com dados reais".
- `wiki/rules/relatorios.md` — Summary atualizado (5 → 8 endpoints); tabela de endpoints expandida com `sales-by-product`, `credits-consumed`, `student-consumption`; tabela dos 12 relatórios atualizada: #3, #4, #6 passam de ⚠️/❌ para ✅.
- `wiki/domain/fluxo-operacional.md` — tabela dos 12 relatórios sincronizada: #3, #4, #6 passam para ✅; #7 e #8 atualizados para citar `pages/app/relatorios.js`.

**O que foi entregue no PR #47:**

- `models/report.js` — adicionadas `salesByProduct()`, `creditsConsumed()`, `studentConsumption()`
- `pages/api/v1/reports/sales-by-product/index.js` — novo endpoint (criado)
- `pages/api/v1/reports/credits-consumed/index.js` — novo endpoint (criado)
- `pages/api/v1/reports/student-consumption/index.js` — novo endpoint (criado)
- `pages/app/relatorios.js` — reconstruído do stub; 5 seções: Faturamento Diário, Faturamento Mensal, Vendas por Produto, Créditos Consumidos, Consumo por Aluno
- Testes de integração criados para os 3 novos endpoints (25 testes novos)

**Issue #46 fechada.**

---

## 2026-06-02 — PR #42: AppShell + dashboard com dados mock (issue #40)

**CLAUDE.md atualizado:**

- Stack: adicionados `recharts`, `swr` e menção ao padrão `getLayout`
- Repo layout: adicionadas entradas para `pages/app/**`, `hooks/useUser.js` e `components/AppShell.js`

**Páginas wiki atualizadas:**

- `wiki/rules/ui-ux.md` — seção Superfícies expandida: tabela de rotas `/app/**` com status; seção "Área autenticada" documentando `AppShell`, `getLayout` e proteção de rotas via `useUser`

**Não alterado (justificado):** páginas de domínio e segurança não foram afetadas — PR #42 é exclusivamente frontend sem mudança de regras de negócio, endpoints ou RBAC.

---

## 2026-05-30 — Ingestão: Media Kit Cantina NutriGourmet

**Página criada:**

- `wiki/institucional.md` — identidade institucional completa: apresentação, equipe fundadora (Caroline, Ana Paz, Álvaro), nutricionista (Georgia Garrido), missão/visão/valores, serviços, diferenciais, 5 escolas atendidas e contatos por unidade.

**Observações:** PDF com 362 páginas predominantemente visuais; o texto extraído via `pdftotext` resultou em ~110 linhas. As citações pessoais dos sócios estavam em layers sobrepostos no design e não foram extraídas com fidelidade — marcadas como `[INSERIR MANUALMENTE]`.

**`wiki/index.md`** atualizado: entrada para `institucional.md` adicionada na seção Fontes.

---

## 2026-05-30 — PR #35: landing page de marketing (`/`)

**CLAUDE.md atualizado:**

- Stack: fontes adicionadas — Dancing Script (`--font-tagline`) e Inter (`--font-data`)

**Páginas wiki atualizadas:**

- `wiki/rules/ui-ux.md` — nova seção "Superfícies" (landing/login/app); tabela de paleta expandida com `--color-brand-teal-hover`, `--color-accent-yellow`, `--color-gray-bg-section`; tabela de tipografia expandida com Dancing Script e Inter; seção "Intenção" diferencia landing page (pais/diretores, paleta quente) do app interno (operadores/gestores)
- `wiki/index.md` — descrição de ui-ux.md atualizada (removia "paleta azul e cinza" que nunca foi implementada)

**Não alterado (justificado):** páginas de domínio e segurança não foram afetadas — PR #35 é exclusivamente frontend/marketing sem mudança de regras de negócio, endpoints ou RBAC.

---

## 2026-05-29 — PR #33: frontend de autenticação + design system (Tailwind v4)

**CLAUDE.md atualizado:**

- Stack: adicionado bullet de frontend (Tailwind CSS v4, tokens `@theme`, fontes via `next/font`)
- Comandos: adicionado `npm run seed:admin` com descrição de uso e variáveis
- infra/: adicionado `scripts/seed-admin.js` ao bullet

**Páginas wiki atualizadas:**

- `wiki/rules/ui-ux.md` — reescrita com a implementação real: paleta Nutrigourmet (verde/teal/laranja), tabela de tokens, tipografia (Fredoka/Poppins/Figtree/Plus Jakarta Sans), diretrizes de radii/sombra/botão. A versão anterior descrevia "paleta azul e cinza" que nunca foi implementada.

**Não alterado (justificado):** páginas de domínio (`operador`, `supervisor`, `administrador`, etc.) não foram afetadas — PR #33 toca apenas frontend e infra de seed, sem mudança de regras de negócio.

---

## 2026-05-29 — Sincronização: correção da escalada de privilégio (PR #29)

**Páginas wiki atualizadas:** `wiki/rules/seguranca.md`.

**O que foi feito:** alinhada a seção "Achados de auditoria" ao que o PR #29 efetivamente entregou. O PR de docs anterior (PR #31) foi mergeado antes do fix e registrava como dívida 🟡 a "lógica de role inline nos 2 handlers"; o PR #29 removeu esses caps inline e centralizou em `authorization.canAssignRole()` (PATCH + POST). Atualizado: o item 🔴 agora cita PATCH+POST e `canAssignRole`; o item de role inline virou "resíduo" (resta só o filtro de leitura em `users/index.js:18`); seção Implementação ganhou bullet de `canAssignRole`.

**Não alterado:** CLAUDE.md (sem novo model/helper — `canAssignRole` é função de model já listado); issue #30 (rate limit) segue como dívida aberta.

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

---

## 2026-06-02 — Ingestão dos documentos operacionais do cliente (fluxo-cantina, mapeamento-sistemas, possivel-integrar)

**Fontes ingeridas (3):**

- `raw/fluxo-cantina.md` — 4 fluxos operacionais + princípio fiscal + 12 relatórios desejados
- `raw/mapeamento-sistemas-atuais.md` — MarketUp, Vlupt e Stone: papéis, problemas de integração e cenários do sistema unificado
- `raw/possivel-integrar.md` — avaliação preliminar do potencial de integração de cada sistema

**Páginas wiki criadas (4):**

- `wiki/domain/fluxo-operacional.md` — os 4 fluxos, os 12 relatórios com status de implementação, princípio de automação total
- `wiki/domain/sistemas-externos.md` — descrição de MarketUp/Vlupt/Stone, seus problemas atuais e papel no sistema unificado
- `wiki/domain/integracao.md` — estratégia técnica e prioridade de integração; Stone (alta), Vlupt (média), MarketUp (baixa)
- `wiki/domain/gap-analysis.md` — consolidado completo: entregável hoje / ajuste necessário / fora do Phase 1 / o que não precisará ser construído

**Páginas wiki atualizadas (2):**

- `wiki/rules/escopo.md` — nova seção comparando expectativa do cliente vs. Phase 1; link para gap-analysis
- `wiki/rules/relatorios.md` — nova seção com tabela dos 12 relatórios desejados vs. 5 implementados no Phase 1

**Índice atualizado:**

- `wiki/index.md` — nova seção "Operação e Integrações" com as 4 páginas criadas

**Principais insights do gap analysis:**

- Venda direta e crédito interno já cobrem os fluxos 1 (parcial) e 2 do cliente
- Stone pode ser integrado com webhook leve reutilizando `models/sale` — sem módulo novo
- Vlupt requer confirmação de API antes de planejar; crédito interno já está na arquitetura correta
- MarketUp permanece responsável por estoque e fiscal — módulo de estoque próprio desnecessário enquanto MarketUp estiver no stack
- 5 dos 12 relatórios desejados estão implementados; 3 são parcialmente cobertos por endpoints existentes
