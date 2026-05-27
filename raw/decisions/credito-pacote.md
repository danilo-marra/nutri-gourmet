---
source: q&a-2026-05-27
status: decided
---

# Decisão: Crédito e Pacote

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Modelo de crédito

**Decisão:** Saldo monetário em R$. Campo `balance DECIMAL(10,2)` no cadastro do aluno (ou em tabela `student_accounts` vinculada). Toda operação de débito/crédito usa R$.

**Justificativa:** Modelo monetário é mais flexível — suporta qualquer produto a qualquer preço, relatórios financeiros diretos e auditorias mais simples.

### Saldo negativo

**Decisão:** Permitido, mas com as seguintes regras:

1. Requer confirmação explícita do operador no momento da venda.
2. Após a venda, se `balance < 0`, o **operador não pode adicionar ou editar o saldo do aluno**.
3. Apenas **supervisor** ou **admin** pode creditar valores quando o saldo está negativo.

**Justificativa:** A trava de edição quando negativo previne que o operador crie déficit e o corrija sem supervisão. A permissão de venda com saldo negativo evita que alunos sejam barrados por esquecimento de recarga.

### Modelo de pacote

**Decisão:** O pacote credita um valor em R$ diretamente no saldo do aluno (`balance`). Não existe saldo separado — crédito de pacote e crédito avulso são o mesmo pool.

**Justificativa:** Manter um único pool simplifica a lógica de débito na venda e os relatórios de saldo. A distinção "de onde veio o crédito" pode ser rastreada no histórico de transações (evento de crédito com tipo `package`), sem exigir dois campos de saldo.

### Adição de crédito

**Decisão:** Não totalmente definida nesta fase. O mecanismo (caixa físico, transferência, etc.) é uma decisão operacional a ser detalhada no módulo de créditos. O schema deve suportar um registro de `credit_transactions` com `type` (`manual`, `package`) para auditoria.

### Validade do pacote

**Decisão:** Sem vencimento por padrão (`expires_at = NULL`). Admin ou supervisor podem definir uma data de expiração ao criar o pacote. A query de pacotes vigentes filtra por `expires_at IS NULL OR expires_at > NOW()`.

**Justificativa:** A maioria dos pacotes será recorrente sem prazo fixo, mas flexibilizar para datas permite modelar pacotes mensais ou sazonais sem alterar o schema.

### Quem pode registrar um pacote

**Decisão:** Apenas **supervisor** e **admin**. O operador de caixa não tem acesso ao módulo de pacotes.

**Justificativa:** Pacote é uma operação financeira (crédito de valor R$ no saldo do aluno) que justifica supervisão acima do nível operador. Mantém consistência com a regra de que operador não pode creditar saldo negativo.

### Múltiplos pacotes simultâneos

**Decisão:** Permitido sem limite. Cada pacote é registrado como um evento em `credit_transactions` com `type = 'package'`. O crédito vai direto para o pool de saldo do aluno — não há controle de "pacote ativo" que bloqueie novo registro.

**Justificativa:** Dado que o crédito é monetário e cai no pool único, restringir múltiplos pacotes não traz benefício funcional e complicaria o fluxo sem necessidade.
