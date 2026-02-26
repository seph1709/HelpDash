import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { updateProfile, getProviderProfile } from '@/controllers/providerController'

const schema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  service_radius_km: z.number().optional(),
  id_photo_url: z.string().optional(),
  id_parsed_name: z.string().optional(),
  id_parsed_address: z.string().optional(),
  id_verified: z.boolean().optional(),
  is_available: z.boolean().optional(),
  hourly_rate: z.number().optional(),
  flat_rate: z.number().optional(),
  video_intro_url: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProviderProfile(supabase, user.id)
    return NextResponse.json({ data: profile })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }

    const profile = await updateProfile(supabase, user.id, parsed.data)
    return NextResponse.json({ data: profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
