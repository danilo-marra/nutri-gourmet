/**
 * Creates or promotes a user to admin role.
 *
 * Usage:
 *   ADMIN_EMAIL=x ADMIN_PASSWORD=y node infra/scripts/seed-admin.js
 *   ADMIN_EMAIL=x ADMIN_PASSWORD=y ADMIN_USERNAME=z node infra/scripts/seed-admin.js
 *
 * In production/staging, pass vars via the deployment environment.
 * Never commit credentials — use env vars only.
 */

const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const { config } = require("dotenv");
const { expand } = require("dotenv-expand");

const envPath = process.env.ENV_PATH || ".env.development";
expand(config({ path: envPath }));

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const username = process.env.ADMIN_USERNAME || email?.split("@")[0] || "admin";

if (!email || !password) {
  console.error("Erro: ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.");
  console.error(
    "Uso: ADMIN_EMAIL=x@y.com ADMIN_PASSWORD=senha npm run seed:admin",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Erro: ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const hash = await bcrypt.hash(password, 10);

  const result = await client.query(
    `INSERT INTO users (id, username, email, password, features, role, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, '{}', 'admin', NOW(), NOW())
     ON CONFLICT (email)
       DO UPDATE SET role = 'admin', password = $3, username = $1, updated_at = NOW()
     RETURNING id, email, username, role`,
    [username, email, hash],
  );

  const user = result.rows[0];
  console.log(`✓ Admin criado/atualizado:`);
  console.log(`  id:       ${user.id}`);
  console.log(`  email:    ${user.email}`);
  console.log(`  username: ${user.username}`);
  console.log(`  role:     ${user.role}`);

  await client.end();
}

run().catch((err) => {
  console.error("Erro ao criar admin:", err.message);
  process.exit(1);
});
