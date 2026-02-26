import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createJobListing } from '@/controllers/jobController'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum([
    'plumbing', 'electrical', 'laundry', 'cleaning', 'carpentry',
    'aircon', 'painting', 'appliance_repair', 'moving', 'errands', 'tutoring', 'other',
  ]),
  lat: z.number(),
  lng: z.number(),
  address_text: z.string().min(5, 'Address is required'),
  barangay: z.string().min(1, 'Barangay is required'),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  urgency: z.enum(['asap', 'scheduled']),
  scheduled_at: z.string().optional(),
  photos: z.array(z.string()).optional(),
  voice_note_url: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Validation error' },
        { status: 400 }
      )
    }

    const job = await createJobListing(supabase, user.id, parsed.data)
    return NextResponse.json({ data: job }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create job'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
