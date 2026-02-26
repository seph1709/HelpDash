import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parseGovernmentId } from '@/controllers/idParseController'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageBase64 } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    const result = await parseGovernmentId(imageBase64)
    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json({ error: 'OCR parsing failed' }, { status: 500 })
  }
}
