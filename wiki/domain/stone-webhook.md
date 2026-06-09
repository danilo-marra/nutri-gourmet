# Integração Stone — Webhook e Reconciliação

**Summary**: Fluxo de captura e reconciliação de pagamentos via Link Stone/Pagar.me: webhook recebe a notificação, fila guarda o registro pendente, supervisor vincula ao aluno.

**Sources**: raw/decisions/sistemas-externos.md, raw/mapeamento-sistemas-atuais.md

**Last updated**: 2026-06-09

---

## Contexto

Pagamentos via Link Stone não eram registrados no sistema → faturamento subdeclarado → **risco fiscal ativo**. O PR #56 implementou um fluxo de dois estágios: captura automática via webhook e reconciliação manual pelo supervisor.

## Fluxo

```
Pagar.me → POST /webhooks/stone/payment → pending_stone_payments
                                                   ↓
                     Supervisor lista → GET /stone-payments
                                                   ↓
                     Supervisor reconcilia → POST /stone-payments/[id]/match
                                                   ↓
                              credit_transactions (type: 'stone') + balance atualizado
```

## Endpoints

| Método | Rota                                | Permissão              | Descrição                                                            |
| ------ | ----------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| POST   | `/api/v1/webhooks/stone/payment`    | Nenhuma (Basic Auth)   | Recebe `order.paid` do Pagar.me; cria registro pendente              |
| GET    | `/api/v1/stone-payments`            | `read:stone_payment`   | Lista pagamentos pendentes não reconciliados (`matched_at IS NULL`)  |
| POST   | `/api/v1/stone-payments/[id]/match` | `update:stone_payment` | Vincula pagamento a um aluno; cria `credit_transaction` tipo `stone` |

## Autenticação do webhook

O Pagar.me envia `Authorization: Basic base64(webhook:STONE_WEBHOOK_SECRET)`. O handler valida apenas a senha via `crypto.timingSafeEqual` (timing-safe). Variável de ambiente: `STONE_WEBHOOK_SECRET`.

## Tabela `pending_stone_payments`

Campos relevantes:

- `stone_payment_id` — ID único do Pagar.me; constraint UNIQUE garante idempotência
- `amount` — valor em R$ (convertido de centavos)
- `payer_name`, `payer_email` — dados do pagador (nullable)
- `payment_method` — método conforme Pagar.me (`credit_card`, `pix`, etc.)
- `matched_at`, `matched_by_id`, `credit_transaction_id` — preenchidos na reconciliação
- `raw_payload` — payload completo do webhook (para auditoria)

## Reconciliação (`match`)

Body obrigatório: `{ "student_id": "<uuid>" }`. O endpoint:

1. Localiza o `pending_stone_payments` pelo `id` da URL
2. Se já reconciliado (`matched_at != null`), retorna a `credit_transaction` existente (idempotente)
3. Cria `credit_transaction` com `type: 'stone'` e `stone_payment_id` preenchido
4. Atualiza `pending_stone_payments` com `matched_at`, `matched_by_id` e `credit_transaction_id`

## Modelo `stoneWebhook.js`

Funções exportadas: `validateBasicAuth`, `createPendingPayment`, `findPendingByStonePaymentId`, `findMatchedCreditByStonePaymentId`, `listPending`, `findPendingById`, `matchPayment`.

## RBAC

`read:stone_payment` e `update:stone_payment` estão em `SUPERVISOR_FEATURES` (e portanto em `ADMIN_FEATURES`). Operadores não têm acesso.

## Limitações atuais

- Reconciliação é **manual**: o supervisor precisa identificar qual aluno corresponde ao pagador.
- NF-e não emitida automaticamente — depende do módulo fiscal (P5 no roadmap).
- Não há relatório dedicado de recebimentos Stone; a tabela `pending_stone_payments` contém os dados.

## Related pages

- [[credito]]
- [[integracao]]
- [[seguranca]]
- [[gap-analysis]]
