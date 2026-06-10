# Sistemas Externos Atuais

**Summary**: Os três sistemas que a cantina usa hoje — MarketUp (PDV/estoque/fiscal), Vlupt (carteira digital dos alunos) e Stone (gateway de pagamento) — seus papéis, problemas de integração e como deveriam se conectar ao sistema central.

**Sources**: raw/mapeamento-sistemas-atuais.md, raw/decisions/sistemas-externos.md

**Last updated**: 2026-06-10

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

### Status confirmado pelo cliente (Q&A 2026-06-02)

Permanece no stack por ora. Decisão de substituição depende da capacidade do novo sistema de se integrar ao caixa e aos meios de pagamento (link próprio + conciliação automática + caixa e faturamento unificados). Sem prazo definido. **Estoque**: continua no MarketUp no curto prazo; melhoria no médio prazo é desejada mas não bloqueante agora. (source: raw/decisions/sistemas-externos.md)

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

### Status confirmado pelo cliente (Q&A 2026-06-02)

Pais adicionam crédito via **app ou site da Vlupt**. Quando o pagamento é confirmado, a cantina vê a informação e o crédito fica disponível para o aluno. Processo hoje é **manual** — não há integração automática com o sistema central. API/webhook da Vlupt ainda pendente de confirmação com o suporte. (source: raw/decisions/sistemas-externos.md)

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

### Problema atual — risco fiscal ativo

Vendas via link Stone (Pix, cartão) **não estão sendo registradas** → faturamento subdeclarado → **risco fiscal ativo**. Meta do cliente: 100% das vendas registradas independente do canal. (source: raw/decisions/sistemas-externos.md)

### Papel no sistema unificado

Canal de pagamento externo. Implementado no PR #56: o webhook `order.paid` cria um registro em `pending_stone_payments`; o supervisor reconcilia manualmente, gerando uma `credit_transaction` tipo `stone` (crédito no saldo do aluno, não uma venda). Ver [[stone-webhook]] e [[integracao]].

---

## Cenários do sistema unificado

### Cenário 1 — Compra com crédito

Pai carrega R$ → sistema registra recarga → aluno compra → sistema reduz saldo → registra venda → baixa estoque → gera fiscal → atualiza relatórios. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md)

### Cenário 2 — Pagamento por link Stone

Empresa gera cobrança → cliente paga → Stone confirma → sistema recebe → registra venda → emite nota fiscal → atualiza financeiro. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md)

### Cenário 3 — Venda direta no caixa

Operador registra venda → baixa estoque → registra recebimento → emite documento fiscal → atualiza relatórios. **Tudo automaticamente.** (source: raw/mapeamento-sistemas-atuais.md) ✅ **Já implementado** (exceto emissão fiscal).

---

## Confirmações do Q&A (2026-06-02)

| Questão                  | Resposta                                                                          |
| ------------------------ | --------------------------------------------------------------------------------- |
| MarketUp fica ou sai?    | Em avaliação — depende da integração própria funcionar                            |
| Vlupt tem API/webhook?   | Pendente de confirmação com o suporte                                             |
| Stone tem webhook?       | ✅ Sim — API/webhook abertos (raw/possivel-integrar.md)                           |
| Quem emite NFC-e/NF-e?   | MarketUp hoje; objetivo: integração automática futura                             |
| Estoque no novo sistema? | MarketUp no curto prazo; melhoria no médio prazo                                  |
| BD central?              | Nosso sistema PostgreSQL é o livro-razão; MarketUp como retaguarda fiscal/estoque |

---

## Related pages

- [[fluxo-operacional]]
- [[integracao]]
- [[gap-analysis]]
- [[venda]]
- [[credito]]
