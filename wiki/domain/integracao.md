# Integração com Sistemas Externos

**Summary**: Potencial de integração com os três sistemas externos (MarketUp, Vlupt, Stone), estratégia técnica para cada um e decisões pendentes antes de implementar.

**Sources**: raw/possivel-integrar.md, raw/mapeamento-sistemas-atuais.md, raw/decisions/sistemas-externos.md

**Last updated**: 2026-06-02

---

## Stone — Integração mais simples (urgência fiscal elevada)

**Disponibilidade**: Stone possui documentação aberta para desenvolvedores, APIs e webhooks. (source: raw/possivel-integrar.md)

**Urgência confirmada**: vendas via link Stone não estão sendo registradas → faturamento subdeclarado → **risco fiscal ativo**. Meta do cliente: 100% das vendas registradas independente do canal. NF-e automática é pré-requisito downstream do módulo fiscal. (source: raw/decisions/sistemas-externos.md)

**Estratégia técnica**:

- Criar endpoint `POST /api/v1/webhooks/stone/payment` que recebe a notificação de pagamento confirmado
- Validar assinatura do webhook (chave secreta compartilhada ou HMAC)
- Mapear o método de pagamento informado pela Stone para o enum interno e registrar a venda via `models/sale`

**⚠️ Decisão de schema necessária antes de implementar**: links Stone podem ser pagos via cartão, Pix ou outros meios. O enum atual de `payment_method` em `sales` aceita apenas `credit`, `cash` e `card`. Registrar um pagamento Pix como `card` corromperia os relatórios de fechamento de caixa e os totais por forma de pagamento. Duas opções:

| Opção                                                 | O que exige                                            | Impacto                                        |
| ----------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Adicionar `pix` ao enum (+ outros meios futuros)      | Migration de schema; atualizar fechamento e relatórios | Correto e extensível; mais trabalho            |
| Restringir integração Stone a links card-only por ora | Nenhum; usar `payment_method: 'card'` diretamente      | Simples, mas limita os meios aceitos via Stone |

Definir essa opção antes de iniciar a implementação.

**Perguntas abertas**: formato exato do payload do webhook Stone, chave de validação, idempotência (como evitar dupla criação se o webhook chegar duas vezes).

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

| Sistema      | Facilidade                                        | Impacto                                                           | Prioridade |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| **Stone**    | Alta (webhook aberto, sem confirmação necessária) | Alto — **risco fiscal ativo** (vendas não registradas)            | 🟢 Alta    |
| **Vlupt**    | Média (confirmar API com suporte)                 | Alto (recarga automática; app/site confirmados pelo cliente)      | 🟡 Média   |
| **MarketUp** | Baixa (API limitada/fechada)                      | Médio (fiscal e estoque; decisão de substituição ainda em aberto) | 🔴 Baixa   |

---

## Decisões pendentes

Antes de iniciar qualquer integração, definir:

1. **MarketUp fica ou sai?** — define se build estoque+fiscal próprio ou apenas envia dados para MarketUp
2. **Vlupt tem API/webhook?** — confirmação com suporte; sem isso, usar importação manual
3. **Idempotência Stone** — como tratar webhooks duplicados (header de idempotency key?)
4. **Separação de responsabilidade fiscal** — quem emite NFC-e: MarketUp, nosso sistema ou sistema fiscal terceiro?

---

## Related pages

- [[sistemas-externos]]
- [[fluxo-operacional]]
- [[gap-analysis]]
- [[venda]]
- [[credito]]
