# Sistemas Externos Atuais

**Summary**: Os três sistemas que a cantina usa hoje — MarketUp (PDV/estoque/fiscal), Vlupt (carteira digital dos alunos) e Stone (gateway de pagamento) — seus papéis, problemas de integração e como deveriam se conectar ao sistema central.

**Sources**: raw/mapeamento-sistemas-atuais.md

**Last updated**: 2026-06-02

---

## 1. MarketUp — PDV, Estoque e Fiscal

### O que faz

- Cadastro de produtos e preços
- Entradas de mercadorias (notas fiscais de compra)
- Controle de estoque (baixa automática por venda)
- Emissão de NFC-e (cupom fiscal) e NF-e (DANFE)
- Relatórios de vendas, estoque e fiscais

### Problema atual

Nem todas as vendas passam por ele automaticamente. Quando uma venda acontece via Vlupt ou Stone, a informação não entra no MarketUp automaticamente → lançamentos manuais → diferença entre faturamento real e registrado → risco de erros fiscais. (source: raw/mapeamento-sistemas-atuais.md)

### Papel no sistema unificado

Continua responsável por estoque e emissão fiscal. O sistema central deve alimentá-lo com dados de venda (via API ou exportação) em vez de replicar suas funções. Ver [[gap-analysis]] — "módulo de controle de estoque" não será construído enquanto MarketUp cumprir essa função.

---

## 2. Vlupt — Crédito dos Alunos

### O que faz

- Plataforma de carteira digital para pais e alunos
- Pai adiciona crédito → saldo disponível → aluno consome → saldo diminui
- Armazena saldo, controla consumo, identifica aluno, registra movimentações

### Saídas

Histórico de recargas, histórico de consumo, saldos dos alunos.

### Problema atual

Quando o pai carrega crédito ou o aluno consome, essa movimentação não gera automaticamente registro fiscal e financeiro no sistema principal. As informações ficam separadas. (source: raw/mapeamento-sistemas-atuais.md)

### Papel no sistema unificado

Canal de pagamento e interface com o pai/aluno. O sistema central mantém o livro-razão de crédito; a Vlupt envia webhook a cada recarga → sistema registra `credit_transaction`. A arquitetura atual já está correta para isso; falta confirmar se a Vlupt oferece API/webhook. Ver [[integracao]].

---

## 3. Stone — Gateway de Pagamento

### O que faz

- Processa cartão, Pix e outros meios
- Empresa gera link de cobrança → cliente paga → Stone processa → dinheiro recebido
- Aprova/reprova pagamentos, informa status da transação

### Saídas

Comprovante de pagamento, confirmação de recebimento, relatórios financeiros.

### Problema atual

Após o pagamento, a venda não é registrada automaticamente no sistema fiscal. A nota fiscal depende de ação manual. (source: raw/mapeamento-sistemas-atuais.md)

### Papel no sistema unificado

Canal de pagamento externo. Ao confirmar um pagamento, envia webhook → sistema cria venda com `payment_method: 'card'` via infraestrutura já existente. Não há necessidade de módulo Stone dedicado — o webhook chama o modelo de sale existente. Ver [[integracao]].

---

## Cenários do sistema unificado

### Cenário 1 — Compra com crédito

Pai carrega R$ → sistema registra recarga → aluno compra → sistema reduz saldo → registra venda → baixa estoque → gera fiscal → atualiza relatórios. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md)

### Cenário 2 — Pagamento por link Stone

Empresa gera cobrança → cliente paga → Stone confirma → sistema recebe → registra venda → emite nota fiscal → atualiza financeiro. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md)

### Cenário 3 — Venda direta no caixa

Operador registra venda → baixa estoque → registra recebimento → emite documento fiscal → atualiza relatórios. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md) ✅ **Já implementado** (exceto emissão fiscal).

---

## Perguntas abertas

As seguintes perguntas do cliente ainda precisam de resposta para decisão de escopo: (source: raw/mapeamento-sistemas-atuais.md)

1. O MarketUp possui API para integração?
2. A Vlupt possui API para consulta de saldo, recargas e consumo?
3. A Stone possui webhook para avisar pagamentos aprovados? (**Sim** — confirmado em raw/possivel-integrar.md)
4. O sistema novo emitirá NF-e/NFC-e diretamente ou continuará usando o MarketUp?
5. O estoque continuará sendo controlado pelo MarketUp ou pelo novo sistema?
6. Qual será o banco de dados central da operação?

---

## Related pages

- [[fluxo-operacional]]
- [[integracao]]
- [[gap-analysis]]
- [[venda]]
- [[credito]]
