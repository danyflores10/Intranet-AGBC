import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/db/schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no esta configurada.")
}

const globalForDatabase = globalThis as unknown as {
  pool: Pool | undefined
}

const pool =
  globalForDatabase.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.pool = pool
}

export { pool }

export const db = drizzle({
  client: pool,
  schema,
})
