import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getProviderJobFeed } from '@/controllers/jobController'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await getProviderJobFeed(supabase, user.id)
    return NextResponse.json({ data: jobs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch job feed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
