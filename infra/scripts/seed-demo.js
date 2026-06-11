/**
 * Demo seed — populates the database with realistic data for client presentations.
 *
 * Usage:
 *   node infra/scripts/seed-demo.js [--clear] [--yes]
 *
 *   --clear       Remove existing demo data before inserting (scoped to @demo.cantina accounts)
 *   --clear-only  Remove demo data and exit — use this to go back to receiving real data
 *   --yes         Skip the non-dev environment guard (required for staging/production)
 *
 * Environment:
 *   ENV_PATH=.env.development  (default — local Docker)
 *   ENV_PATH=.env.staging   node infra/scripts/seed-demo.js --yes
 *   ENV_PATH=.env.production node infra/scripts/seed-demo.js --yes
 *
 *   DEMO_PASSWORD=<senha>  Password for all demo users (default: demo1234)
 */

"use strict";

const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const { config } = require("dotenv");
const { expand } = require("dotenv-expand");

// ── Environment ────────────────────────────────────────────────────────────────

const envPath = process.env.ENV_PATH || ".env.development";
const loaded = config({ path: envPath });

if (loaded.error) {
  console.error(
    `✗ Não foi possível carregar "${envPath}": ${loaded.error.message}`,
  );
  process.exit(1);
}
expand(loaded);

if (!process.env.DATABASE_URL) {
  console.error(`✗ DATABASE_URL não encontrado em "${envPath}".`);
  process.exit(1);
}

const args = process.argv.slice(2);
const shouldClear = args.includes("--clear") || args.includes("--clear-only");
const clearOnly = args.includes("--clear-only");
const skipConfirm = args.includes("--yes");
const isDev = envPath.includes(".development");
const demoPassword = process.env.DEMO_PASSWORD || "demo1234";

if (!isDev && !skipConfirm) {
  console.error(`\n⚠️  Ambiente não-dev detectado (${envPath}).`);
  console.error("   Passe --yes para confirmar a execução neste ambiente.\n");
  process.exit(1);
}

// ── Seeded PRNG (deterministic — mesmos dados a cada execução) ─────────────────

function makePrng(seed = 42) {
  let s = seed >>> 0;
  return {
    next() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 0x100000000;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[this.int(0, arr.length - 1)];
    },
    weighted(items, weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = this.next() * total;
      for (let i = 0; i < items.length; i++) {
        if ((r -= weights[i]) < 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_EMAIL_DOMAIN = "@demo.cantina";

const DEMO_USERS = [
  {
    username: "sofia.mendes",
    email: `sofia.mendes${DEMO_EMAIL_DOMAIN}`,
    role: "supervisor",
  },
  {
    username: "rodrigo.lima",
    email: `rodrigo.lima${DEMO_EMAIL_DOMAIN}`,
    role: "supervisor",
  },
  // Carlos e Marcos SEM fechamento hoje → count_pending_closes = 2
  {
    username: "carlos.martins",
    email: `carlos.martins${DEMO_EMAIL_DOMAIN}`,
    role: "operador",
  },
  {
    username: "joana.pereira",
    email: `joana.pereira${DEMO_EMAIL_DOMAIN}`,
    role: "operador",
  },
  {
    username: "marcos.lima",
    email: `marcos.lima${DEMO_EMAIL_DOMAIN}`,
    role: "operador",
  },
];

// Índices (0-based) dos alunos que terão saldo negativo
const NEGATIVE_BALANCE_INDICES = new Set([3, 9, 15, 22, 27]);

const DEMO_STUDENTS = [
  { name: "Ana Beatriz Souza", class: "1A", is_full_time: false },
  { name: "Bruno Henrique Costa", class: "1A", is_full_time: false },
  { name: "Camila Ferreira Santos", class: "1A", is_full_time: true },
  { name: "Daniel Nascimento", class: "1A", is_full_time: false }, // negativo
  { name: "Eduarda Pereira Lima", class: "1A", is_full_time: true },
  { name: "Felipe Santos Oliveira", class: "1A", is_full_time: false },
  { name: "Gabriela Lima Rodrigues", class: "1B", is_full_time: true },
  { name: "Henrique Oliveira Costa", class: "1B", is_full_time: false },
  { name: "Isabella Martins Alves", class: "1B", is_full_time: false },
  { name: "João Pedro Silva", class: "1B", is_full_time: true }, // negativo
  { name: "Larissa Rodrigues Mendes", class: "1B", is_full_time: false },
  { name: "Matheus Alves Pereira", class: "1B", is_full_time: false },
  { name: "Natália Cardoso Ferreira", class: "2A", is_full_time: false },
  { name: "Otávio Mendes Barbosa", class: "2A", is_full_time: false },
  { name: "Pietra Barbosa Gomes", class: "2A", is_full_time: true },
  { name: "Rafael Gomes Costa", class: "2A", is_full_time: false }, // negativo
  { name: "Sofia Castro Rodrigues", class: "2A", is_full_time: false },
  { name: "Thiago Araújo Nascimento", class: "2A", is_full_time: true },
  { name: "Valentina Dias Ferreira", class: "2B", is_full_time: false },
  { name: "Vitor Hugo Freitas", class: "2B", is_full_time: false },
  { name: "Yasmin Nunes Oliveira", class: "2B", is_full_time: true },
  { name: "Alexandre Corrêa Lima", class: "2B", is_full_time: false },
  { name: "Beatriz Sousa Alves", class: "2B", is_full_time: false }, // negativo
  { name: "Carlos Eduardo Pinto", class: "2B", is_full_time: false },
  { name: "Diana Ribeiro Martins", class: "3A", is_full_time: false },
  { name: "Eduardo Campos Santos", class: "3A", is_full_time: true },
  { name: "Fernanda Carvalho Costa", class: "3A", is_full_time: false },
  { name: "Gabriel Teixeira Alves", class: "3A", is_full_time: false }, // negativo
  { name: "Helena Moreira Rodrigues", class: "3A", is_full_time: false },
  { name: "Igor Lopes Nascimento", class: "3A", is_full_time: false },
];

// weight controla a frequência relativa nos gráficos de produtos/categorias
const DEMO_PRODUCTS = [
  { name: "Almoço Completo", price: 15.0, category: "refeicao", weight: 32 },
  { name: "Prato do Dia", price: 12.0, category: "refeicao", weight: 26 },
  { name: "Marmita Fit", price: 14.0, category: "refeicao", weight: 18 },
  { name: "Lanche de Queijo", price: 8.0, category: "lanche", weight: 24 },
  { name: "Lanche de Presunto", price: 7.0, category: "lanche", weight: 19 },
  { name: "Pão na Chapa", price: 5.0, category: "lanche", weight: 15 },
  { name: "Suco Natural", price: 5.0, category: "bebida", weight: 22 },
  { name: "Refrigerante", price: 4.0, category: "bebida", weight: 17 },
  { name: "Água Mineral", price: 2.0, category: "bebida", weight: 12 },
  { name: "Vitamina de Fruta", price: 9.0, category: "vitamina", weight: 11 },
  { name: "Vitamina de Açaí", price: 11.0, category: "vitamina", weight: 9 },
  { name: "Smoothie Verde", price: 10.0, category: "vitamina", weight: 7 },
  { name: "Brigadeiro", price: 3.0, category: "sobremesa", weight: 13 },
  { name: "Pudim", price: 5.0, category: "sobremesa", weight: 10 },
  { name: "Fruta do Dia", price: 4.0, category: "sobremesa", weight: 8 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

// Breaks large inserts into chunks to stay within the 65535 Postgres param limit
async function batchInsert(client, sql, rowParams, chunkSize = 500) {
  for (let i = 0; i < rowParams.length; i += chunkSize) {
    const chunk = rowParams.slice(i, i + chunkSize);
    const colCount = chunk[0].length;
    const placeholders = chunk
      .map(
        (_, ri) =>
          `(${Array.from(
            { length: colCount },
            (_, ci) => `$${ri * colCount + ci + 1}`,
          ).join(", ")})`,
      )
      .join(", ");
    await client.query(`${sql} ${placeholders}`, chunk.flat());
  }
}

// ── Clear existing demo data ───────────────────────────────────────────────────

async function clearDemoData(client) {
  process.stdout.write("  Removendo dados de demo anteriores...");

  const [userRes, studentRes, productRes] = await Promise.all([
    client.query(`SELECT id FROM users WHERE email LIKE $1`, [
      `%${DEMO_EMAIL_DOMAIN}`,
    ]),
    client.query(`SELECT id FROM students WHERE name = ANY($1)`, [
      DEMO_STUDENTS.map((s) => s.name),
    ]),
    client.query(`SELECT id FROM products WHERE name = ANY($1)`, [
      DEMO_PRODUCTS.map((p) => p.name),
    ]),
  ]);

  const userIds = userRes.rows.map((r) => r.id);
  const studentIds = studentRes.rows.map((r) => r.id);
  const productIds = productRes.rows.map((r) => r.id);

  // Delete in FK-safe order, scoped exclusively through demo operator sales.
  // We never delete sale_items by product_id globally — that would corrupt real
  // sales that happen to reference a same-named product (e.g. "Água Mineral").
  if (userIds.length > 0) {
    await client.query(
      `DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE operator_id = ANY($1))`,
      [userIds],
    );
    await client.query(`DELETE FROM sales WHERE operator_id = ANY($1)`, [
      userIds,
    ]);
    await client.query(`DELETE FROM cash_closes WHERE operator_id = ANY($1)`, [
      userIds,
    ]);
    await client.query(
      `DELETE FROM credit_transactions WHERE operator_id = ANY($1)`,
      [userIds],
    );
  }
  if (studentIds.length > 0) {
    // Cover credit_transactions where student is demo but operator is not
    await client.query(
      `DELETE FROM credit_transactions WHERE student_id = ANY($1)`,
      [studentIds],
    );
    // Guard: skip students that still appear in real (non-demo) sales
    await client.query(
      `DELETE FROM students WHERE id = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM sales WHERE student_id = students.id)`,
      [studentIds],
    );
  }
  if (productIds.length > 0)
    // Guard: skip products that still have sale_items (real sales referencing them)
    await client.query(
      `DELETE FROM products WHERE id = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM sale_items WHERE product_id = products.id)`,
      [productIds],
    );
  if (userIds.length > 0)
    await client.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);

  console.log(" ✓");
}

// ── Sales generator ───────────────────────────────────────────────────────────

function buildSalesData(rng, operators, students, products) {
  const productWeights = DEMO_PRODUCTS.map((p) => p.weight);
  const PAYMENT_METHODS = ["credit", "cash", "card", "pix"];
  const PAYMENT_WEIGHTS = [48, 26, 16, 10];

  const sales = [];
  const saleItems = [];
  // key: `${operatorId}-${dateStr}` → aggregated totals for cash_closes
  const cashMap = new Map();

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(todayUTC.getTime() - daysAgo * 86400000);
    const dow = date.getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = daysAgo === 0;
    const dateStr = toDateStr(date);

    // Gradual upward trend: oldest day at ~65% of peak
    const trend = 0.65 + 0.35 * ((29 - daysAgo) / 29);
    let n;
    if (isToday) n = rng.int(75, 95);
    else if (isWeekend) n = Math.round(rng.int(8, 16) * trend);
    else n = Math.round(rng.int(36, 56) * trend);

    for (let i = 0; i < n; i++) {
      const operator = rng.pick(operators);
      const paymentMethod = rng.weighted(PAYMENT_METHODS, PAYMENT_WEIGHTS);

      let studentId = null;
      if (paymentMethod === "credit") {
        studentId = rng.pick(students).id;
      } else if (rng.next() < 0.72) {
        studentId = rng.pick(students).id;
      }

      const itemCount = rng.int(1, 3);
      const usedIds = new Set();
      const items = [];
      let total = 0;

      for (let j = 0; j < itemCount; j++) {
        let product;
        let tries = 0;
        do {
          product = rng.weighted(products, productWeights);
          tries++;
        } while (usedIds.has(product.id) && tries < 5);
        usedIds.add(product.id);
        const qty = rng.int(1, 2);
        total += qty * product.price;
        items.push({ productId: product.id, qty, unitPrice: product.price });
      }
      total = round2(total);

      const saleId = randomUUID();
      const createdAt = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          rng.int(7, 14),
          rng.int(0, 59),
          rng.int(0, 59),
        ),
      );

      sales.push([
        saleId,
        studentId,
        operator.id,
        paymentMethod,
        total,
        createdAt,
        createdAt,
      ]);
      items.forEach((it) =>
        saleItems.push([
          saleId,
          it.productId,
          it.qty,
          it.unitPrice,
          createdAt,
          createdAt,
        ]),
      );

      // Accumulate for cash_closes
      const key = `${operator.id}-${dateStr}`;
      if (!cashMap.has(key)) {
        cashMap.set(key, {
          operatorId: operator.id,
          dateStr,
          totalSales: 0,
          totalCredit: 0,
          totalCash: 0,
          totalCard: 0,
          totalPix: 0,
        });
      }
      const cm = cashMap.get(key);
      cm.totalSales = round2(cm.totalSales + total);
      if (paymentMethod === "credit")
        cm.totalCredit = round2(cm.totalCredit + total);
      else if (paymentMethod === "cash")
        cm.totalCash = round2(cm.totalCash + total);
      else if (paymentMethod === "card")
        cm.totalCard = round2(cm.totalCard + total);
      else cm.totalPix = round2(cm.totalPix + total);
    }
  }

  return { sales, saleItems, cashMap };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const rng = makePrng(42);

  console.log(`\n🌱 Seed demo — ambiente: ${envPath}`);
  if (!isDev) console.log("   ⚠️  Executando em ambiente não-dev.\n");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    if (shouldClear) await clearDemoData(client);

    if (clearOnly) {
      await client.query("COMMIT");
      console.log(
        "\n✅ Dados de demo removidos. Banco pronto para dados reais.\n",
      );
      return;
    }

    const passwordHash = await bcrypt.hash(demoPassword, 10);

    // ── Users ──────────────────────────────────────────────────────────────
    process.stdout.write("  Inserindo usuários...");
    const insertedUsers = [];
    for (const u of DEMO_USERS) {
      const res = await client.query(
        `INSERT INTO users (username, email, password, role, features)
         VALUES ($1, $2, $3, $4, '{}')
         ON CONFLICT (email) DO UPDATE
           SET username = EXCLUDED.username,
               role     = EXCLUDED.role,
               password = EXCLUDED.password
         RETURNING id, username, role`,
        [u.username, u.email, passwordHash, u.role],
      );
      insertedUsers.push(res.rows[0]);
    }
    const operators = insertedUsers.filter((u) => u.role === "operador");
    const allUsers = insertedUsers;
    const joana = operators.find((u) => u.username === "joana.pereira");
    console.log(` ✓ (${insertedUsers.length})`);

    // ── Students ───────────────────────────────────────────────────────────
    process.stdout.write("  Inserindo alunos...");
    const insertedStudents = [];
    for (const s of DEMO_STUDENTS) {
      const res = await client.query(
        `INSERT INTO students (name, class, is_full_time, balance)
         VALUES ($1, $2, $3, 0) RETURNING id`,
        [s.name, s.class, s.is_full_time],
      );
      insertedStudents.push({ id: res.rows[0].id });
    }
    console.log(` ✓ (${insertedStudents.length})`);

    // ── Products ───────────────────────────────────────────────────────────
    process.stdout.write("  Inserindo produtos...");
    const insertedProducts = [];
    for (const p of DEMO_PRODUCTS) {
      const res = await client.query(
        `INSERT INTO products (name, price, category, active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO UPDATE
           SET price = EXCLUDED.price, category = EXCLUDED.category
         RETURNING id, price`,
        [p.name, p.price, p.category],
      );
      insertedProducts.push({
        id: res.rows[0].id,
        price: p.price,
        weight: p.weight,
      });
    }
    console.log(` ✓ (${insertedProducts.length})`);

    // ── Sales + sale_items ─────────────────────────────────────────────────
    process.stdout.write("  Gerando vendas (30 dias)...");
    const { sales, saleItems, cashMap } = buildSalesData(
      rng,
      operators,
      insertedStudents,
      insertedProducts,
    );

    await batchInsert(
      client,
      `INSERT INTO sales (id, student_id, operator_id, payment_method, total, created_at, updated_at) VALUES`,
      sales,
    );
    await batchInsert(
      client,
      `INSERT INTO sale_items (sale_id, product_id, qty, unit_price, created_at, updated_at) VALUES`,
      saleItems,
    );
    console.log(` ✓ (${sales.length} vendas, ${saleItems.length} itens)`);

    // ── Cash closes ────────────────────────────────────────────────────────
    process.stdout.write("  Inserindo fechamentos de caixa...");
    const todayStr = toDateStr(new Date());
    let closeCount = 0;
    for (const [, cm] of cashMap) {
      // Skip Carlos and Marcos for today → they appear as "pending" in the dashboard
      if (cm.dateStr === todayStr && cm.operatorId !== joana.id) continue;
      await client.query(
        `INSERT INTO cash_closes
           (operator_id, closed_by_id, date, total_sales, total_credit, total_cash, total_card, total_pix)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (operator_id, date) DO NOTHING`,
        [
          cm.operatorId,
          cm.operatorId, // closed_by_id: self-close for demo
          cm.dateStr,
          cm.totalSales,
          cm.totalCredit,
          cm.totalCash,
          cm.totalCard,
          cm.totalPix,
        ],
      );
      closeCount++;
    }
    console.log(` ✓ (${closeCount} — Carlos e Marcos abertos hoje)`);

    // ── Credit transactions ────────────────────────────────────────────────
    process.stdout.write("  Inserindo créditos...");
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    let creditCount = 0;

    for (const student of insertedStudents) {
      const txCount = rng.int(2, 4);
      let running = 0;
      for (let t = 0; t < txCount; t++) {
        const amount = rng.int(50, 200);
        running = round2(running + amount);
        const txDate = new Date(todayUTC.getTime() - rng.int(1, 60) * 86400000);
        await client.query(
          `INSERT INTO credit_transactions
             (student_id, operator_id, amount, type, balance_after, created_at, updated_at)
           VALUES ($1, $2, $3, 'manual', $4, $5, $5)`,
          [student.id, rng.pick(allUsers).id, amount, running, txDate],
        );
        creditCount++;
      }
    }
    console.log(` ✓ (${creditCount})`);

    // ── Student balances (direct UPDATE) ──────────────────────────────────
    process.stdout.write("  Ajustando saldos...");
    for (let i = 0; i < insertedStudents.length; i++) {
      const balance = NEGATIVE_BALANCE_INDICES.has(i)
        ? round2(-rng.int(8, 28))
        : round2(rng.int(35, 280));
      await client.query(`UPDATE students SET balance = $1 WHERE id = $2`, [
        balance,
        insertedStudents[i].id,
      ]);
    }
    console.log(` ✓ (${NEGATIVE_BALANCE_INDICES.size} negativos)`);

    await client.query("COMMIT");

    // ── Summary ────────────────────────────────────────────────────────────
    console.log("\n✅ Seed concluído!\n");
    console.log("  Acesso:");
    for (const u of DEMO_USERS) {
      const tag = u.role === "supervisor" ? "Supervisor" : "Operador ";
      console.log(`    [${tag}] ${u.email}  /  ${demoPassword}`);
    }
    console.log("\n  KPIs esperados no dashboard:");
    console.log("    • 5 alunos com saldo negativo (badge vermelho)");
    console.log(
      "    • 2 fechamentos pendentes hoje — Carlos e Marcos (badge laranja)",
    );
    console.log("    • Tendência de receita crescente nos últimos 30 dias");
    console.log();
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("\n✗ Erro ao executar seed:", err.message);
  process.exit(1);
});
