import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __concretepoaSql?: ReturnType<typeof postgres>;
  __concretepoaDb?: Database;
};

export function databaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  return url || null;
}

export function getDb(): Database | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalForDb.__concretepoaSql) {
    globalForDb.__concretepoaSql = postgres(url, { max: 1, prepare: false });
    globalForDb.__concretepoaDb = drizzle(globalForDb.__concretepoaSql, { schema });
  }
  return globalForDb.__concretepoaDb ?? null;
}

export function getSql() {
  getDb();
  return globalForDb.__concretepoaSql ?? null;
}
