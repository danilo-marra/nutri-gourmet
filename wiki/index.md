# Wiki — Sistema Integrado de Gestão de Cantina

Índice de todas as páginas da wiki. Mantido por Claude após cada operação de ingestão ou atualização.

---

## Fontes (raw/)

- [PRD — Sistema Integrado de Gestão de Cantina](prd-summary.md) — documento de requisitos original do projeto

## Decisões (raw/decisions/)

- [Aluno](../raw/decisions/aluno.md) — campos obrigatórios, período integral, saldo negativo
- [Produto](../raw/decisions/produto.md) — campos, categorias fixas, flag ativo, snapshot de preço
- [Venda](../raw/decisions/venda.md) — múltiplos itens, formas de pagamento, estorno
- [Crédito e Pacote](../raw/decisions/credito-pacote.md) — modelo R$, saldo negativo, pacote; validade, quem vende, múltiplos simultâneos
- [Operações](../raw/decisions/operacoes.md) — fechamento de caixa (relatório básico, delegação), criação de contas
- [Relatórios](../raw/decisions/relatorios.md) — 5 relatórios prioritários, permissões, granularidade de data
- [Supervisor](../raw/decisions/supervisor.md) — tabela de permissões completa; criação de conta via convite

## Domínio (domain/)

### Personas

- [Operador](domain/operador.md) — vendas, consumo, créditos e fechamento de caixa; sem acesso a dados financeiros globais
- [Supervisor](domain/supervisor.md) — estorno, pacotes, crédito negativo, relatórios, cadastros globais, gestão de operadores; criado via convite como operador
- [Administrador](domain/administrador.md) — acesso total, relatórios financeiros, cadastros

### Entidades

- [Aluno](domain/aluno.md) — campos: name, class, is_full_time, balance; regras de saldo negativo definidas
- [Produto](domain/produto.md) — campos: name, price, category (enum 5 valores), active; snapshot de preço na venda
- [Venda](domain/venda.md) — múltiplos itens (sales + sale_items); pagamento: credit/cash/card; estorno: supervisor/admin
- [Crédito](domain/credito.md) — saldo monetário R$; saldo negativo com confirmação do operador; pool único
- [Pacote](domain/pacote.md) — credita R$ no saldo; validade opcional (expires_at); apenas supervisor/admin registra; múltiplos permitidos
- [Fechamento de Caixa](domain/fechamento-de-caixa.md) — não bloqueante; gera resumo básico; supervisor/admin pode fechar em nome do operador

## Regras (rules/)

- [Escopo](rules/escopo.md) — o que está fora desta fase (mobile, fiscal, multi-unidade)
- [Segurança e Controle de Acesso](rules/seguranca.md) — visibilidade restrita por perfil; tabela de permissões por persona
- [UI/UX](rules/ui-ux.md) — estilo corporativo moderno, fundo claro, paleta azul e cinza
- [Relatórios](rules/relatorios.md) — 5 relatórios; supervisor/admin; tabela paginada; sem exportação nesta fase

---

## Log de operações

Ver [wiki/log.md](log.md) para o histórico completo de alterações.
