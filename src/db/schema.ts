import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  integer,
  boolean,
  timestamp,
  check,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// ============================================================
// USERS
// ============================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    name: text('name'),
    avatar_url: text('avatar_url'),
    role: text('role').notNull().default('client'),
    barangay: text('barangay'),
    city: text('city').default('Quezon City'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    gcash_number: text('gcash_number'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    last_active: timestamp('last_active', { withTimezone: true }).defaultNow(),
  },
  (t) => [check('users_role_check', sql`${t.role} IN ('client', 'provider', 'both')`)]
)

// ============================================================
// PROVIDERS
// ============================================================
export const providers = pgTable('providers', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  video_intro_url: text('video_intro_url'),
  skills: text('skills').array().default(sql`'{}'`),
  service_radius_km: doublePrecision('service_radius_km').default(2),
  id_photo_url: text('id_photo_url'),
  id_parsed_name: text('id_parsed_name'),
  id_parsed_address: text('id_parsed_address'),
  id_verified: boolean('id_verified').default(false),
  rating_avg: doublePrecision('rating_avg').default(0),
  total_jobs: integer('total_jobs').default(0),
  no_show_count: integer('no_show_count').default(0),
  is_available: boolean('is_available').default(true),
  subscription_tier: text('subscription_tier').default('free'),
  subscription_expires_at: timestamp('subscription_expires_at', { withTimezone: true }),
  last_seen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
  hourly_rate: integer('hourly_rate'),
  flat_rate: integer('flat_rate'),
})

// ============================================================
// JOBS
// ============================================================
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: uuid('client_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  address_text: text('address_text').notNull(),
  barangay: text('barangay').notNull(),
  budget_min: integer('budget_min'),
  budget_max: integer('budget_max'),
  urgency: text('urgency').default('asap'),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
  photos: text('photos').array().default(sql`'{}'`),
  voice_note_url: text('voice_note_url'),
  status: text('status').default('open'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }).default(
    sql`(now() + interval '24 hours')`
  ),
  visible_to_free_at: timestamp('visible_to_free_at', { withTimezone: true }),
})

// ============================================================
// BOOKINGS
// ============================================================
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  job_id: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  provider_id: uuid('provider_id').references(() => providers.id, { onDelete: 'cascade' }),
  client_id: uuid('client_id').references(() => users.id, { onDelete: 'cascade' }),
  agreed_price: integer('agreed_price'),
  status: text('status').default('pending'),
  provider_eta_minutes: integer('provider_eta_minutes'),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  client_confirmed: boolean('client_confirmed').default(false),
  auto_confirm_at: timestamp('auto_confirm_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ============================================================
// PAYMENTS
// ============================================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull(),
  gcash_reference_id: text('gcash_reference_id'),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
})

// ============================================================
// RATINGS
// ============================================================
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  from_user_id: uuid('from_user_id').references(() => users.id, { onDelete: 'cascade' }),
  to_user_id: uuid('to_user_id').references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  comment: text('comment'),
  would_rehire: boolean('would_rehire'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ============================================================
// DISPUTES
// ============================================================
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  raised_by_id: uuid('raised_by_id').references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  evidence_photos: text('evidence_photos').array().default(sql`'{}'`),
  status: text('status').default('open'),
  resolution_note: text('resolution_note'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
})

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false),
  booking_id: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ============================================================
// CHAT MESSAGES
// ============================================================
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ============================================================
// SUBSCRIPTIONS
// ============================================================
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider_id: uuid('provider_id').references(() => providers.id, { onDelete: 'cascade' }),
  plan: text('plan').default('premium'),
  amount_paid: integer('amount_paid').default(99),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }).default(
    sql`(now() + interval '30 days')`
  ),
  payment_method: text('payment_method'),
  payment_status: text('payment_status'),
})

// ============================================================
// RELATIONS
// ============================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(providers, { fields: [users.id], references: [providers.id] }),
  jobs: many(jobs),
  bookings: many(bookings),
  notifications: many(notifications),
}))

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.id], references: [users.id] }),
  bookings: many(bookings),
  subscriptions: many(subscriptions),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, { fields: [jobs.client_id], references: [users.id] }),
  bookings: many(bookings),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  job: one(jobs, { fields: [bookings.job_id], references: [jobs.id] }),
  provider: one(providers, { fields: [bookings.provider_id], references: [providers.id] }),
  client: one(users, { fields: [bookings.client_id], references: [users.id] }),
  payments: many(payments),
  ratings: many(ratings),
  disputes: many(disputes),
}))

// ============================================================
// Inferred Types
// ============================================================
export type UserRow = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type ProviderRow = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type JobRow = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
export type BookingRow = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type PaymentRow = typeof payments.$inferSelect
export type RatingRow = typeof ratings.$inferSelect
export type DisputeRow = typeof disputes.$inferSelect
export type NotificationRow = typeof notifications.$inferSelect
export type SubscriptionRow = typeof subscriptions.$inferSelect
export type ChatMessageRow = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
