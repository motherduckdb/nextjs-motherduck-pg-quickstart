import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const token = process.env.MOTHERDUCK_TOKEN;
const host = process.env.MOTHERDUCK_HOST ?? "pg.us-east-1-aws.motherduck.com";

if (!token) {
  throw new Error("MOTHERDUCK_TOKEN environment variable is required");
}

// The template queries MotherDuck's public `sample_data` share.
const DATABASE = "sample_data";

const pool = new Pool({
  connectionString: `postgresql://user:${token}@${host}:5432/${DATABASE}`,
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 5000,
});

attachDatabasePool(pool);

export { pool };

/**
 * Run a single query, checking a client out of the pool and releasing it when
 * done. Safe to call concurrently with `Promise.all` — each call gets its own
 * client (`pg` serializes queries on a single client).
 */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as unknown[] | undefined);
}

/**
 * Run a block of queries against a single dedicated client. Use when you need
 * a transaction or sequential statements on the same connection.
 */
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
