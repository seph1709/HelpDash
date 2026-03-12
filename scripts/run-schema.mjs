import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(__dirname, '../supabase/schema.sql'), 'utf8')

const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
})

console.log('Connecting to Supabase PostgreSQL...')
await client.connect()
console.log('Connected. Running schema...\n')

try {
  await client.query(schema)
  console.log('Schema executed successfully.\n')
} catch (err) {
  console.error('Schema error:', err.message)
  process.exit(1)
}

// Verify all tables
const tables = [
  'users', 'providers', 'jobs', 'bookings',
  'payments', 'ratings', 'disputes', 'notifications', 'subscriptions'
]

console.log('Verifying tables:')
for (const table of tables) {
  const res = await client.query(
    `SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  )
  const exists = res.rows[0].count === '1'
  console.log(`  ${exists ? '✅' : '❌'} ${table}`)
}

// Verify triggers
const triggerRes = await client.query(
  `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'`
)
console.log('\nTriggers:')
triggerRes.rows.forEach(r => console.log(`  ✅ ${r.trigger_name}`))

// Verify indexes
const indexRes = await client.query(
  `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'`
)
console.log('\nIndexes:')
indexRes.rows.forEach(r => console.log(`  ✅ ${r.indexname}`))

await client.end()
console.log('\nDone.')
