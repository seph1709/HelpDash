import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use transaction-mode pooler (port 6543) for serverless/edge environments
const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported in transaction mode
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
export type DB = typeof db
