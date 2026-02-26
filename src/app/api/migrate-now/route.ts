import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()

    const sql = `
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users delete own notifications'
        ) THEN
          CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
        sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        message text NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_id ON chat_messages(booking_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Chat participants can read'
        ) THEN
          CREATE POLICY "Chat participants can read" ON chat_messages FOR SELECT USING (
            booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
          );
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Chat participants can send'
        ) THEN
          CREATE POLICY "Chat participants can send" ON chat_messages FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
          );
        END IF;
      END $$;
    `

    await client.query(sql)
    await client.end()
    return NextResponse.json({ ok: true, message: 'Migration completed successfully' })
  } catch (err) {
    await client.end().catch(() => {})
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
