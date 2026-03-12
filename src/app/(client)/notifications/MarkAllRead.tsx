'use client'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export function MarkAllRead({ userId }: { userId: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        const supabase = createSupabaseBrowserClient()
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
        router.refresh()
      }}
      className="text-xs text-[#1677ff] font-medium hover:underline"
    >
      Mark all read
    </button>
  )
}
