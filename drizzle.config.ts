import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.auzqognhrmyyczignkwz',
    password: 'u.62S*w!T*tVMJ8',
    ssl: true,
  },
  verbose: true,
  strict: false,
})
