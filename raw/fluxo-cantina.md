# FLUXO COMPLETO DA OPERAÇÃO DA CANTINA

## VISÃO GERAL

                    ┌───────────────┐
                    │     PAIS      │
                    └───────┬───────┘
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼

     RECARGA VLUPT     LINK STONE      FATURAMENTO
                                          ESCOLAS

            │               │                │
            ▼               ▼                ▼

     ┌─────────────────────────────────────────┐
     │           SISTEMA CENTRAL               │
     │ (Novo sistema a ser desenvolvido)       │
     └─────────────────────────────────────────┘

            │               │                │
            ▼               ▼                ▼

      ESTOQUE       FINANCEIRO      DOCUMENTOS
                                       FISCAIS

            │               │                │
            └───────┬───────┴───────┬────────┘
                    ▼               ▼

             RELATÓRIOS      DASHBOARD
               GERENCIAIS

---

### FLUXO 1 - CRÉDITO DOS ALUNOS

Pai adiciona crédito
│
▼
VLUPT registra pagamento
│
▼
Sistema Central recebe informação
│
▼
Atualiza saldo do aluno
│
▼
Aluno compra na cantina
│
▼
Sistema registra venda
│
├── Baixa estoque
│
├── Atualiza financeiro
│
├── Atualiza histórico do aluno
│
└── Gera informações fiscais

---

### FLUXO 2 - VENDA DIRETA NO CAIXA

Operador registra venda
│
▼
Sistema Central
│
├── Baixa estoque
│
├── Registra recebimento
│
├── Atualiza relatórios
│
└── Emite NFC-e

---

### FLUXO 3 - PAGAMENTO POR LINK STONE

Funcionário cria cobrança
│
▼
Cliente recebe link
│
▼
Cliente realiza pagamento
│
▼
Stone confirma pagamento
│
▼
Sistema Central recebe confirmação
│
├── Registra receita
│
├── Identifica cliente
│
├── Atualiza financeiro
│
└── Emite nota fiscal

---

### FLUXO 4 - EVENTOS ESCOLARES

Escola solicita evento
│
▼
Pedido é criado
│
▼
Sistema registra consumo
│
▼
Evento é encerrado
│
▼
Sistema calcula valor total
│
▼
Emite NF-e (DANFE)
│
▼
Gera cobrança
│
▼
Acompanha recebimento

---

### CONTROLE DE ESTOQUE

Entrada de mercadorias
│
▼
Lançamento da nota de compra
│
▼
Atualiza estoque

Toda venda realizada:
│
▼
Baixa automática do estoque

---

### RELATÓRIOS QUE O SISTEMA DEVE GERAR

1. Vendas por escola
2. Vendas por unidade
3. Vendas por produto
4. Consumo por aluno
5. Créditos carregados
6. Créditos consumidos
7. Faturamento diário
8. Faturamento mensal
9. Recebimentos Stone
10. Eventos realizados
11. Estoque atual
12. Produtos mais vendidos

---

### PRINCÍPIO DO SISTEMA

QUALQUER ENTRADA DE DINHEIRO DEVE GERAR:

1. Registro financeiro.
2. Registro da venda.
3. Atualização dos relatórios.
4. Controle fiscal.
5. Controle de estoque (quando aplicável).

SEM LANÇAMENTO MANUAL
