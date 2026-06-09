import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import type { Client } from "pg";
import database from "infra/database.js";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
} as const;

async function listPendingMigrations() {
  let dbClient: Client | undefined;

  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient: Client | undefined;

  try {
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return migratedMigrations;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
