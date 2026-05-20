const { exec } = require("node:child_process");

const MAX_RETRIES = 120;
const RETRY_INTERVAL_IN_MS = 1000;
let retries = 0;

function checkPostgres() {
  exec(
    "docker compose -f infra/compose.yaml exec -T nutri_gourmet_sys pg_isready --host localhost",
    handleReturn,
  );
}

function handleReturn(error, stdout = "") {
  const isReady = !error && stdout.includes("accepting connections");

  if (isReady) {
    console.log("\nPostgres esta pronto e aceitando conexoes.\n");
    return;
  }

  retries += 1;
  process.stdout.write(".");

  if (retries >= MAX_RETRIES) {
    console.error("\nTimeout aguardando conexao com Postgres.\n");
    process.exit(1);
  }

  setTimeout(checkPostgres, RETRY_INTERVAL_IN_MS);
}

process.stdout.write("\n\nAguardando Postgres aceitar conexoes");
checkPostgres();
