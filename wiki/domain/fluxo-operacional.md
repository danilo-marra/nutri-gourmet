# Fluxo Operacional da Cantina

**Summary**: Os quatro fluxos de operação da cantina — crédito de alunos, venda direta, pagamento por link e eventos escolares — e o princípio de que toda entrada de dinheiro deve gerar registro completo.

**Sources**: raw/fluxo-cantina.md

**Last updated**: 2026-06-02

---

## Visão geral

O sistema central unifica três canais de entrada financeira (Vlupt, Stone, faturamento escolar) e produz controle de estoque, financeiro e documentos fiscais automaticamente. (source: raw/fluxo-cantina.md)

```
PAIS → RECARGA VLUPT ─┐
PAIS → LINK STONE    ─┼→ SISTEMA CENTRAL → ESTOQUE / FINANCEIRO / DOCUMENTOS FISCAIS
ESCOLAS → FATURAMENTO ─┘
                              ↓
                    RELATÓRIOS + DASHBOARD
```

---

## Fluxo 1 — Crédito dos alunos (Vlupt)

1. Pai adiciona crédito na plataforma Vlupt
2. Vlupt registra o pagamento
3. Sistema Central recebe a informação (via webhook ou sync)
4. Saldo do aluno é atualizado
5. Aluno realiza compra na cantina
6. Sistema registra a venda → baixa estoque → atualiza financeiro → atualiza histórico do aluno → gera informações fiscais

**Status no projeto**: passo 5–6 já implementado (`POST /api/v1/sales`); passo 1–4 depende de integração com Vlupt. (source: raw/fluxo-cantina.md)

---

## Fluxo 2 — Venda direta no caixa

1. Operador registra a venda no PDV
2. Sistema: baixa estoque → registra recebimento → atualiza relatórios → emite NFC-e

**Status no projeto**: ✅ venda registrada (cash/card); emissão de NFC-e fora do Phase 1. (source: raw/fluxo-cantina.md)

---

## Fluxo 3 — Pagamento por link Stone

1. Funcionário cria cobrança no sistema
2. Cliente recebe link
3. Cliente realiza pagamento
4. Stone confirma o pagamento
5. Sistema Central recebe confirmação (webhook) → registra receita → identifica cliente → atualiza financeiro → emite nota fiscal

**Status no projeto**: passo 5 depende de integração Stone; emissão fiscal fora do Phase 1. (source: raw/fluxo-cantina.md)

---

## Fluxo 4 — Eventos escolares

1. Escola solicita evento
2. Pedido criado no sistema
3. Sistema registra consumo durante o evento
4. Evento encerrado → sistema calcula valor total → emite NF-e (DANFE) → gera cobrança → acompanha recebimento

**Status no projeto**: ❌ não implementado; NF-e fora do Phase 1. Pode ser modelado no futuro como venda especial vinculada a uma conta de escola. (source: raw/fluxo-cantina.md)

---

## Controle de estoque

- Entrada de mercadorias: lançamento da nota de compra → atualiza estoque
- Toda venda: baixa automática do estoque

**Status no projeto**: ❌ não implementado; MarketUp cobre essa função no cenário atual. Ver [[gap-analysis]].

---

## 12 relatórios desejados pelo cliente

| #   | Relatório              | Status no projeto                                |
| --- | ---------------------- | ------------------------------------------------ |
| 1   | Vendas por escola      | ❌ requer multi-unidade                          |
| 2   | Vendas por unidade     | ❌ requer multi-unidade                          |
| 3   | Vendas por produto     | ⚠️ `topProducts` existe como widget de dashboard |
| 4   | Consumo por aluno      | ⚠️ derivável de sales por student_id             |
| 5   | Créditos carregados    | ✅ `GET /api/v1/reports/credits`                 |
| 6   | Créditos consumidos    | ⚠️ implícito em vendas com payment_method=credit |
| 7   | Faturamento diário     | ✅ `revenueTrend` + `dashboardSummary`           |
| 8   | Faturamento mensal     | ✅ `salesByPeriod` com filtro de mês             |
| 9   | Recebimentos Stone     | ❌ requer integração Stone                       |
| 10  | Eventos realizados     | ❌ requer módulo de eventos                      |
| 11  | Estoque atual          | ❌ requer controle de estoque                    |
| 12  | Produtos mais vendidos | ✅ `GET /api/v1/reports/dashboard/top-products`  |

Ver também [[relatorios]] para os 5 relatórios priorizados no Phase 1.

---

## Princípio do sistema

> Qualquer entrada de dinheiro deve gerar: (1) registro financeiro, (2) registro da venda, (3) atualização dos relatórios, (4) controle fiscal, (5) controle de estoque quando aplicável. Sem lançamento manual.

Este princípio guia a integração Stone e Vlupt: o sistema deve receber o evento externo e propagar automaticamente para todos os subsistemas.

---

## Related pages

- [[sistemas-externos]]
- [[integracao]]
- [[gap-analysis]]
- [[venda]]
- [[credito]]
- [[relatorios]]
