import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { registerUser } from '@/controllers/authController'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['client', 'provider', 'both']),
  barangay: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Validation error' },
        { status: 400 }
      )
    }

    // Use admin client so the INSERT into public.users bypasses RLS
    // (needed when email confirmation is enabled and session is not yet set)
    const supabase = createSupabaseAdminClient()
    const result = await registerUser(supabase, parsed.data)

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
