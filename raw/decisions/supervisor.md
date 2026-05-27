---
source: q&a-2026-05-27
status: decided
---

# Decisão: Supervisor

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Permissões

O Supervisor tem todas as permissões do Operador, mais as seguintes capacidades exclusivas:

| Permissão                         | Operador | Supervisor | Admin |
| --------------------------------- | -------- | ---------- | ----- |
| Realizar vendas                   | ✅       | ✅         | ✅    |
| Registrar consumo de crédito      | ✅       | ✅         | ✅    |
| Fechar caixa do próprio turno     | ✅       | ✅         | ✅    |
| Estornar vendas                   | ❌       | ✅         | ✅    |
| Registrar pacotes                 | ❌       | ✅         | ✅    |
| Creditar saldo negativo           | ❌       | ✅         | ✅    |
| Fechar caixa em nome de operador  | ❌       | ✅         | ✅    |
| Acessar relatórios (todos os 5)   | ❌       | ✅         | ✅    |
| Criar/editar contas de Operador   | ❌       | ✅         | ✅    |
| Criar/editar contas de Supervisor | ❌       | ❌         | ✅    |
| Criar/editar cadastros globais    | ❌       | ✅         | ✅    |

**Justificativa:** O Supervisor cobre todos os casos onde o Operador é bloqueado por política (saldo negativo, estorno, pacotes) e tem acesso a informações de supervisão operacional (relatórios). Cadastros globais (alunos e produtos) também são acessíveis ao Supervisor. Gestão de contas acima do nível Operador fica restrita ao Admin para manter hierarquia clara.

### Criação da conta de Supervisor

**Decisão:** Admin cria via painel → convite por e-mail usando o fluxo de ativação existente (`models/activation.js`). Mesmo fluxo do Operador.

**Justificativa:** Reutilizar o fluxo de ativação existente; não há necessidade de fluxo especial para o nível Supervisor.
