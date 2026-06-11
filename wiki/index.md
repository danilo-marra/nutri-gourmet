# Wiki — Sistema Integrado de Gestão de Cantina

Índice de todas as páginas da wiki. Mantido por Claude após cada operação de ingestão ou atualização.

---

## Fontes (raw/)

- [PRD — Sistema Integrado de Gestão de Cantina](prd-summary.md) — documento de requisitos original do projeto
- [Institucional — Cantina NutriGourmet](institucional.md) — identidade, equipe, missão/visão/valores, serviços, escolas e contatos

## Decisões (raw/decisions/)

- [Aluno](../raw/decisions/aluno.md) — campos obrigatórios, período integral, saldo negativo
- [Produto](../raw/decisions/produto.md) — campos, categorias fixas, flag ativo, snapshot de preço
- [Venda](../raw/decisions/venda.md) — múltiplos itens, formas de pagamento, estorno
- [Crédito e Pacote](../raw/decisions/credito-pacote.md) — modelo R$, saldo negativo, pacote; validade, quem vende, múltiplos simultâneos
- [Operações](../raw/decisions/operacoes.md) — fechamento de caixa (relatório básico, delegação), criação de contas
- [Relatórios](../raw/decisions/relatorios.md) — 5 relatórios prioritários, permissões, granularidade de data
- [Supervisor](../raw/decisions/supervisor.md) — tabela de permissões completa; criação de conta via convite
- [Sistemas Externos](../raw/decisions/sistemas-externos.md) — MarketUp/Vlupt/Stone: status confirmado pelo cliente; risco fiscal Stone; estoque curto prazo
- [Eventos e Integral](../raw/decisions/eventos-integral.md) — eventos ≥ 1–2/mês com NF-e; Integral 10 parcelas/ano, `is_full_time`

## Domínio (domain/)

### Personas

- [Operador](domain/operador.md) — vendas, consumo, créditos e fechamento de caixa; sem acesso a dados financeiros globais
- [Supervisor](domain/supervisor.md) — estorno, pacotes, crédito negativo, relatórios, cadastros globais, gestão de operadores; criado via convite como operador
- [Administrador](domain/administrador.md) — acesso total, relatórios financeiros, cadastros

### Operação e Integrações

- [Fluxo Operacional](domain/fluxo-operacional.md) — os 5 fluxos da cantina (crédito, venda direta, Stone, eventos, Integral) e os 12 relatórios desejados pelo cliente
- [Sistemas Externos](domain/sistemas-externos.md) — MarketUp, Vlupt e Stone: papéis, problemas atuais e como deveriam se integrar ao sistema central
- [Integração](domain/integracao.md) — estratégia técnica e prioridade de integração com cada sistema externo
- [Stone Webhook](domain/stone-webhook.md) — webhook Pagar.me + fila `pending_stone_payments` + reconciliação manual pelo supervisor (PR #56)
- [Gap Analysis](domain/gap-analysis.md) — consolidado: o que está entregue, o que precisa de ajuste e o que está fora do Phase 1

### Entidades

- [Aluno](domain/aluno.md) — campos: name, class, is_full_time, balance; regras de saldo negativo definidas
- [Produto](domain/produto.md) — campos: name, price, category (enum 5 valores), active; snapshot de preço na venda
- [Venda](domain/venda.md) — múltiplos itens (sales + sale_items); pagamento: credit/cash/card/pix; crédito insuficiente bloqueia; cancelamento (5 min) pelo operador; estorno sem prazo por supervisor/admin
- [Crédito](domain/credito.md) — saldo monetário R$; saldo negativo com confirmação do operador; pool único
- [Pacote](domain/pacote.md) — credita R$ no saldo; validade opcional (expires_at); apenas supervisor/admin registra; múltiplos permitidos
- [Fechamento de Caixa](domain/fechamento-de-caixa.md) — não bloqueante; gera resumo básico; supervisor/admin pode fechar em nome do operador
- [Recuperação de Senha](domain/recuperacao-de-senha.md) — fluxo self-service via email; token de uso único; expiração de 30 minutos; anti-enumeração
- [Eventos](domain/eventos.md) — módulo de eventos escolares; ciclo: solicitação → consumo → encerramento → NF-e → cobrança; ≥ 1–2/mês
- [Integral](domain/integral.md) — faturamento recorrente para alunos `is_full_time`; 10 parcelas/ano; NF-e mensal

## Regras (rules/)

- [Escopo](rules/escopo.md) — o que está fora desta fase (mobile, fiscal, multi-unidade)
- [Segurança e Controle de Acesso](rules/seguranca.md) — visibilidade restrita por perfil; tabela de permissões por persona
- [Rate Limiting](rules/rate-limiting.md) — proteção brute-force no login: sliding window 15 min / 10 tentativas por IP, armazenado em PostgreSQL
- [UI/UX](rules/ui-ux.md) — design system Nutrigourmet: paleta verde/teal/laranja, 6 fontes, tokens de cor; landing page (`/`) e app interno
- [Relatórios](rules/relatorios.md) — 8 endpoints de relatório (5 originais + 3 do PR #47); supervisor/admin; tabela paginada; sem exportação nesta fase
- [Fiscal](rules/fiscal.md) — regras de emissão (NFC-e presencial, NF-e digital/eventos/Integral); 100% cobertura de canal; P5 no roadmap

---

## Log de operações

Ver [wiki/log.md](log.md) para o histórico completo de alterações.
