# Fiscal

**Summary**: Regras de emissão de documentos fiscais — quando emitir, qual documento, por qual canal e quem é responsável.

**Sources**: raw/decisions/sistemas-externos.md, raw/decisions/eventos-integral.md

**Last updated**: 2026-06-02

---

## Documentos fiscais em uso

### NFC-e (Nota Fiscal do Consumidor Eletrônica)

- **Quando**: vendas presenciais no caixa (almoço, lanche, balcão).
- **Timing**: lançamento posterior à venda é aceitável — não precisa ser em tempo real.
- **Responsável atual**: MarketUp emite com base nas vendas registradas.

### NF-e (Nota Fiscal Eletrônica / DANFE)

- **Quando**:
  - Eventos escolares (uma NF-e por evento, ao encerrar).
  - Módulo Integral (uma NF-e por parcela mensal).
  - Vendas via Stone quando aplicável.
- **Timing**: deve ser **100% automático** — nenhum lançamento manual aceitável.
- **Responsável atual**: cliente emite manualmente hoje.

## Cobertura de canal

Meta do cliente: **100% das vendas registradas** independente do meio:

| Canal                        | Status atual             | Meta                  |
| ---------------------------- | ------------------------ | --------------------- |
| Caixa presencial (cash/card) | ✅ registrado no sistema | ✅ NFC-e via MarketUp |
| Crédito Vlupt                | ⚠️ manual                | NFC-e automática      |
| Link Stone (Pix/cartão)      | ❌ não registrado        | NF-e automática       |
| Eventos escolares            | ❌ manual                | NF-e automática       |
| Integral (parcelas)          | ❌ manual                | NF-e automática       |

## Responsável pela emissão

- **Hoje**: MarketUp emite NFC-e para vendas presenciais; cliente emite NF-e manualmente para eventos e Integral.
- **Objetivo futuro**: emissão integrada ao sistema via provider externo (Plugnotas, NFe.io ou similar) — provider ainda não definido.

## Prioridade no roadmap

Fiscal é habilitador de P1–P4: Stone (P1), Vlupt (P2), Eventos (P3) e Integral (P4) geram os dados que o módulo fiscal (P5) precisa para emitir os documentos. Ver [[gap-analysis]].

## Related pages

- [[sistemas-externos]]
- [[integracao]]
- [[eventos]]
- [[integral]]
- [[escopo]]
- [[gap-analysis]]
