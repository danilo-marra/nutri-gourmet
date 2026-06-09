# Integração com Sistemas Externos

**Summary**: Potencial de integração com os três sistemas externos (MarketUp, Vlupt, Stone), estratégia técnica para cada um e decisões pendentes antes de implementar.

**Sources**: raw/possivel-integrar.md, raw/mapeamento-sistemas-atuais.md, raw/decisions/sistemas-externos.md

**Last updated**: 2026-06-09

---

## Stone — ✅ Implementado (PR #56)

**Urgência confirmada**: vendas via link Stone não estavam sendo registradas → faturamento subdeclarado → **risco fiscal ativo**. Meta do cliente: 100% das vendas registradas independente do canal. (source: raw/decisions/sistemas-externos.md)

**O que foi implementado (PR #56)**:

- `POST /api/v1/webhooks/stone/payment` — recebe notificação `order.paid` do Pagar.me; valida via Basic Auth (`STONE_WEBHOOK_SECRET`); cria registro em `pending_stone_payments` de forma idempotente (ON CONFLICT DO NOTHING)
- `GET /api/v1/stone-payments` — lista pagamentos pendentes não reconciliados; requer `read:stone_payment`
- `POST /api/v1/stone-payments/[id]/match` — supervisor vincula o pagamento a um aluno, criando `credit_transaction` do tipo `stone`; requer `update:stone_payment`
- `pix` adicionado ao enum `payment_method` em `sales` (migration); `cash_closes` também atualizado

**Decisões resolvidas no PR #56**:

- Schema: `pix` adicionado ao enum de `payment_method`; `stone` adicionado ao enum de `type` em `credit_transactions`; coluna `stone_payment_id` em `credit_transactions` garante idempotência
- Idempotência: ON CONFLICT (stone_payment_id) DO NOTHING em `pending_stone_payments`; match verifica `matched_at` antes de criar nova transação

**Pendências restantes**:

- Emissão de NF-e automática — depende de P5 (provider fiscal); Stone cobre o registro da venda, mas não a nota fiscal
- Relatório dedicado de recebimentos Stone — `pending_stone_payments` já existe; falta definir o formato desejado

Ver [[stone-webhook]] para documentação completa do modelo e endpoints.

---

## Vlupt — Integração a confirmar

**Disponibilidade**: A Vlupt se apresenta como plataforma completa para cantinas escolares com controle de vendas, estoque, pagamentos, app para pais e soluções White Label. Sistemas desse tipo normalmente possuem alguma forma de integração ou exportação. A Vlupt oferece customizações para empresas com múltiplas unidades. (source: raw/possivel-integrar.md)

**Confirmado pelo cliente**: pais adicionam crédito via **app ou site da Vlupt**. Quando o pagamento é confirmado, a cantina vê a informação e o crédito fica disponível para o aluno. Processo hoje é manual. API/webhook ainda pendente de confirmação com o suporte da Vlupt. (source: raw/decisions/sistemas-externos.md)

**Estratégia técnica (se API/webhook disponível)**:

- Criar endpoint `POST /api/v1/webhooks/vlupt/recharge` que recebe notificação de recarga pelo pai
- Ao receber, registrar `credit_transaction` via `models/credit` (já implementado)
- **A arquitetura interna já está correta**: nosso sistema é o livro-razão de crédito; Vlupt é o canal de pagamento do lado do pai

**Estratégia alternativa (sem API)**:

- Importação manual de arquivo (CSV/planilha) das recargas Vlupt
- Criar endpoint de importação bulk no admin
- Crédito interno continua exatamente como está; nenhuma alteração de modelo necessária

**Ação necessária**: confirmar com suporte da Vlupt se há webhook ou API disponível antes de planejar desenvolvimento.

---

## MarketUp — Integração mais complexa

**Disponibilidade**: O MarketUp possui recursos de integração com outros sistemas e marketplaces, indicando que existe alguma forma de comunicação externa ou API disponível para parceiros. Porém, a documentação pública é limitada e provavelmente precisará de acesso técnico ou verificação direta com o suporte. (source: raw/possivel-integrar.md)

**Estratégia técnica (se API disponível)**:

- Após cada venda registrada no nosso sistema, fazer POST para a API do MarketUp replicando a venda
- MarketUp cuida de: baixa de estoque, emissão de NFC-e/NF-e
- Nosso sistema cuida de: saldo do aluno, relatórios gerenciais, histórico

**Cenário sem integração MarketUp**:

- MarketUp opera em paralelo; operador registra a venda nos dois sistemas (duplo trabalho)
- Ou: exportação periódica (fim do dia) de vendas para importação no MarketUp

**Decisão chave**: MarketUp fica ou sai? Ver [[gap-analysis]] — essa decisão define se construímos estoque + fiscal próprio (~2 módulos grandes) ou apenas um push de dados.

---

## Resumo de prioridade

| Sistema      | Status          | Impacto                                                           | Prioridade |
| ------------ | --------------- | ----------------------------------------------------------------- | ---------- |
| **Stone**    | ✅ Implementado | Alto — risco fiscal parcialmente mitigado (registro via webhook)  | — PR #56   |
| **Vlupt**    | ⏳ Pendente     | Alto (recarga automática; app/site confirmados pelo cliente)      | 🟡 P2      |
| **MarketUp** | ⏳ Pendente     | Médio (fiscal e estoque; decisão de substituição ainda em aberto) | 🔴 P7      |

---

## Decisões pendentes

Antes de iniciar qualquer integração, definir:

1. **MarketUp fica ou sai?** — define se build estoque+fiscal próprio ou apenas envia dados para MarketUp
2. **Vlupt tem API/webhook?** — confirmação com suporte; sem isso, usar importação manual
3. **Separação de responsabilidade fiscal** — quem emite NFC-e: MarketUp, nosso sistema ou sistema fiscal terceiro?

**Resolvidas no PR #56**: idempotência Stone via ON CONFLICT (stone_payment_id); `pix` adicionado ao enum de `payment_method`.

---

## Related pages

- [[sistemas-externos]]
- [[fluxo-operacional]]
- [[gap-analysis]]
- [[venda]]
- [[credito]]
- [[stone-webhook]]
