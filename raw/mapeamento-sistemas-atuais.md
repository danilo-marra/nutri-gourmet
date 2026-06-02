# MAPEAMENTO DOS SISTEMAS ATUAIS

## 1. MARKETUP (PDV, ESTOQUE E FISCAL)

### O que é

É o sistema principal da operação da cantina.

### O que entra nele

- Cadastro de produtos.
- Cadastro de preços.
- Entradas de mercadorias (notas fiscais de compra).
- Controle de estoque.
- Vendas realizadas diretamente no caixa.

### O que ele faz

- Baixa estoque automaticamente quando ocorre uma venda.
- Registra as vendas.
- Controla movimentação de produtos.
- Emite documentos fiscais.

### O que sai dele

- NFC-e (cupom fiscal).
- NF-e (DANFE).
- Relatórios de vendas.
- Relatórios de estoque.
- Relatórios fiscais.

### Problema atual

Nem todas as vendas passam por ele automaticamente.

Quando uma venda acontece por outros canais (Vlupt ou Stone), a informação não entra automaticamente no MarketUp.

Consequência:

- Necessidade de lançamentos manuais.
- Diferença entre faturamento real e faturamento registrado.
- Possibilidade de erros fiscais.

---

## 2. VLUPT (CRÉDITO DOS ALUNOS)

### O que é

Sistema de carteira digital utilizado pelos pais e alunos.

### Como funciona

Fluxo:

Pai → adiciona crédito → saldo fica disponível → aluno consome → saldo diminui.

### O que entra

- Recargas feitas pelos pais.
- Dados dos alunos.
- Dados dos responsáveis.

### O que ele faz

- Armazena saldo.
- Controla consumo.
- Identifica qual aluno realizou a compra.
- Registra movimentações de crédito.

### O que sai

- Histórico de recargas.
- Histórico de consumo.
- Saldos dos alunos.

### Problema atual

Quando o pai coloca crédito ou quando o aluno consome, essa movimentação não gera automaticamente registro fiscal e financeiro no sistema principal.

As informações ficam separadas.

---

## 3. STONE (PAGAMENTOS)

### O que é

Gateway de pagamento.

### Como funciona

Empresa → gera link → cliente paga → Stone processa → dinheiro é recebido.

### O que entra

- Valor da cobrança.
- Dados do cliente.
- Forma de pagamento.

### O que ele faz

- Processa cartão, Pix e outros meios.
- Aprova ou reprova pagamentos.
- Informa status da transação.

### O que sai

- Comprovante de pagamento.
- Confirmação de recebimento.
- Relatórios financeiros.

### Problema atual

Após o pagamento, a venda não é registrada automaticamente no sistema fiscal.

A nota fiscal depende de ação manual.

---

## COMO DEVERIA FUNCIONAR O SISTEMA UNIFICADO

## Cenário 1 – Compra na cantina usando crédito

Pai coloca R$ 100 no sistema
↓
Sistema registra a recarga
↓
Aluno compra um produto
↓
Sistema reduz saldo
↓
Sistema registra venda
↓
Sistema baixa estoque
↓
Sistema gera informações fiscais
↓
Sistema atualiza relatórios

Tudo automaticamente.

---

## Cenário 2 – Pagamento por link da Stone

Empresa gera cobrança
↓
Cliente paga
↓
Stone confirma pagamento
↓
Sistema recebe confirmação
↓
Sistema registra venda
↓
Sistema emite nota fiscal
↓
Sistema atualiza financeiro

Tudo automaticamente.

---

## Cenário 3 – Venda direta no caixa

Operador registra venda
↓
Sistema baixa estoque
↓
Sistema registra recebimento
↓
Sistema emite documento fiscal
↓
Sistema atualiza relatórios

Tudo automaticamente.

---

### PERGUNTAS IMPORTANTES PARA O DESENVOLVIMENTO

1. O MarketUp possui API para integração?
2. A Vlupt possui API para consulta de saldo, recargas e consumo?
3. A Stone possui webhook para avisar pagamentos aprovados?
4. O sistema novo emitirá NF-e/NFC-e diretamente ou continuará usando o MarketUp?
5. O estoque continuará sendo controlado pelo MarketUp ou pelo novo sistema?
6. Qual será o banco de dados central da operação?
