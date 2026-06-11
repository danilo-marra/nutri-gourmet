# Rate Limiting no Login

**Summary**: Proteção contra brute-force e credential-stuffing no `POST /api/v1/sessions` via sliding window por IP, armazenado em PostgreSQL.

**Sources**: models/loginAttempt.ts, infra/controller.ts, infra/errors.ts, infra/migrations/1781179921604_create-login-attempts.js

**Last updated**: 2026-06-11

---

O endpoint `POST /api/v1/sessions` (login) é protegido por um rate limit baseado em IP. Após 10 tentativas em uma janela deslizante de 15 minutos, o IP fica bloqueado até a janela expirar.

## Parâmetros

| Constante                    | Valor    | Local                               |
| ---------------------------- | -------- | ----------------------------------- |
| `WINDOW_MINUTES`             | 15       | `models/loginAttempt.ts`            |
| `MAX_ATTEMPTS`               | 10       | `models/loginAttempt.ts`            |
| Cleanup de registros antigos | > 1 hora | fire-and-forget no `recordAndCheck` |

## Extração de IP

O IP é extraído do header `x-real-ip`, definido pela edge Vercel e não forjável pelo cliente. Fallback para `req.socket?.remoteAddress` em ambiente de desenvolvimento (sem proxy Vercel).

```typescript
// infra/controller.ts
function extractIp(request: NextApiRequest): string {
  const realIp = request.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp.trim();
  }
  return request.socket?.remoteAddress ?? "unknown";
}
```

`x-forwarded-for` **não é usado** porque é controlável pelo cliente — um atacante poderia rotacionar o header para contornar o limite.

## Operação atômica (check + insert)

O modelo `loginAttempt` usa um único CTE PostgreSQL que faz INSERT e COUNT na mesma instrução. Isso colapsa a race condition de um check-then-insert separado (application-level) para uma janela mínima no nível de snapshot do banco — mas **não elimina totalmente a race sob alta concorrência**:

```typescript
// models/loginAttempt.ts
async function recordAndCheck(ip: string): Promise<boolean> {
  const result = await database.query<{ count: string }>({
    text: `
      WITH new_attempt AS (
        INSERT INTO login_attempts (ip) VALUES ($1) RETURNING 1 AS n
      )
      SELECT
        (SELECT COUNT(*) FROM login_attempts
         WHERE ip = $1
           AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes') +
        new_attempt.n AS count
      FROM new_attempt
    `,
    values: [ip],
  });
  // count = existing rows in window + 1 (just inserted)
  return parseInt(result.rows[0].count, 10) > MAX_ATTEMPTS;
}
```

**Por que +1?** O INSERT e o SELECT compartilham o mesmo snapshot MVCC no PostgreSQL, então a nova linha recém-inserida não é visível ao SELECT. O +1 manual contabiliza a tentativa recém-inserida. Isso resolve a race consigo mesmo (um processo não consegue fazer check-then-insert com gap).

**Limite best-effort, não rígido.** Sob alta concorrência — duas requisições chegando simultaneamente quando já existem 9 tentativas na janela — ambas podem tirar um snapshot antes de qualquer INSERT confirmar, ambas contarão 9 + 1 = 10 e passarão, deixando 11 tentativas no banco.

Para **brute-force sequencial** (cada tentativa espera a resposta da anterior) essa janela é irrelevante. Para **ataques concorrentes** — como credential-stuffing com múltiplas threads simultâneas — a race condition pode permitir algumas tentativas extras acima do limite antes de o 429 passar a ser retornado consistentemente. O limite continua efetivo como freio, mas não é matematicamente rígido.

Para um limite rígido seria necessário serialização explícita (advisory lock, counter table com `UPDATE … RETURNING`, ou isolamento `SERIALIZABLE`).

## Resposta HTTP

Quando o limite é excedido:

- **Status**: `429 Too Many Requests`
- **Header**: `Retry-After: 900` (= 15 min × 60 s)
- **Body**:

```json
{
  "name": "TooManyRequestsError",
  "message": "Muitas tentativas de acesso. Tente novamente em alguns minutos.",
  "action": "Aguarde antes de tentar novamente.",
  "status_code": 429
}
```

## Tabela `login_attempts`

| Coluna         | Tipo        | Notas               |
| -------------- | ----------- | ------------------- |
| `id`           | uuid PK     | `gen_random_uuid()` |
| `ip`           | varchar(45) | IPv4 e IPv6         |
| `attempted_at` | timestamptz | default `NOW()`     |

Índice: `(ip, attempted_at)` — suporta a query de janela deslizante como index scan.

Cleanup best-effort: registros com `attempted_at < NOW() - INTERVAL '1 hour'` são deletados em fire-and-forget após cada INSERT.

## Middleware

`controller.rateLimitLogin` é inserido na cadeia do `POST /sessions` entre o `canRequest` e o `postHandler`:

```typescript
// pages/api/v1/sessions/index.ts
router.post(
  controller.canRequest("create:session"),
  controller.rateLimitLogin, // ← rate limit
  postHandler, // ← autenticação
);
```

O rate limit roda **antes** da autenticação: se o IP já está bloqueado, o bcrypt comparison nunca acontece.

## Comportamento por design

- **Todas as tentativas contam** (sucesso e falha) — timing consistente, evita inferir validade de conta
- **Sem lockout por conta** — só por IP, para não vazar informação sobre contas existentes
- **`Retry-After` é fixo** — informa o pior caso (15 min), não o vencimento exato do registro mais antigo

## Related pages

- [[seguranca]]
- [[recuperacao-de-senha]]
