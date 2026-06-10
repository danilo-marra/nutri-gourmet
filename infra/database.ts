import {
  Client,
  Pool,
  PoolConfig,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from "pg";
import { ServiceError } from "./errors";

function getConnectionConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: getSSLValues() };
  }
  return {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT
      ? parseInt(process.env.POSTGRES_PORT, 10)
      : undefined,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  };
}

const pool = new Pool(getConnectionConfig());

async function query<T extends QueryResultRow = QueryResultRow>(
  queryObject: QueryConfig | string,
): Promise<QueryResult<T>> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query<T>(queryObject);
    return result;
  } catch (error) {
    throw new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    });
  } finally {
    client?.release();
  }
}

async function getNewClient(): Promise<Client> {
  const client = new Client(getConnectionConfig());
  await client.connect();
  return client;
}

const database = {
  query,
  getNewClient,
};

export default database;

function getSSLValues(): PoolConfig["ssl"] {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }
  return process.env.NODE_ENV === "production";
}
