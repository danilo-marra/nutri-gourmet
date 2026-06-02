---
source: q&a-2026-06-02
status: decided
---

# Decisões — Sistemas Externos

Respostas do cliente (dono da cantina) em sessão de Q&A realizada em 2026-06-02.

## MarketUp

- Permanece no stack por ora. Decisão de substituição depende da capacidade do novo sistema de se integrar ao caixa e aos meios de pagamento (link de pagamento próprio + conciliação automática + caixa e faturamento unificados).
- Se essa integração funcionar bem, faz sentido substituir. Caso contrário, MarketUp continua como sistema de retaguarda.
- Sem prazo definido para a decisão.
- **Estoque**: continua no MarketUp no curto prazo. Cliente deseja melhoria significativa no médio prazo, mas não é bloqueante agora.

## Vlupt

- Pais adicionam crédito via app ou site da Vlupt.
- Quando o pagamento é confirmado, a cantina vê a informação e o crédito fica disponível para o aluno correspondente.
- Processo hoje é manual — não há integração automática com o sistema central.
- Confirmação de API/webhook da Vlupt ainda pendente de verificação com o suporte.

## Stone

- Vendas realizadas via link de pagamento Stone (Pix, cartão) **não estão sendo registradas adequadamente** no sistema → faturamento subdeclarado → risco fiscal ativo.
- Meta do cliente: 100% das vendas registradas independente do canal de pagamento.
- Stone possui API e webhooks abertos (confirmado em raw/possivel-integrar.md).

## Fiscal

- **NFC-e (vendas presenciais)**: lançamento posterior à venda é aceitável. Hoje a funcionária registra as vendas e o lançamento fiscal pode ser feito depois.
- **NF-e (vendas digitais, eventos, Integral)**: deve ser 100% automático — nenhum lançamento manual. Vendas via Stone, eventos escolares e parcelas do Integral precisam de NF-e automática.
- Objetivo: todas as vendas, independente do canal, registradas e capazes de gerar documentos fiscais necessários.
