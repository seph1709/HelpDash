'use client'
import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

interface Props {
  bookingId: string
  currentUserId: string
  currentUserName: string
}

export function ChatBox({ bookingId, currentUserId, currentUserName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch initial messages
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase
      .from('chat_messages')
      .select('*, sender:users(name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              sender_id: m.sender_id,
              sender_name: m.sender?.name ?? 'Unknown',
              message: m.message,
              created_at: m.created_at,
            }))
          )
        }
        setLoading(false)
      })

    // Subscribe to new messages via broadcast
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages((prev) => {
          // Avoid duplicates (our own message was already added optimistically)
          if (prev.some((m) => m.id === payload.id)) return prev
          return [...prev, payload as ChatMessage]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput('')

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      message: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, message: text }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send')
      }
      // Replace temp message with real one from server
      const { message: serverMsg } = await res.json()
      if (serverMsg) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: serverMsg.id,
                  sender_id: serverMsg.sender_id,
                  sender_name: (serverMsg.sender as any)?.name ?? currentUserName,
                  message: serverMsg.message,
                  created_at: serverMsg.created_at,
                }
              : m
          )
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">💬 Chat</p>
        <p className="text-xs text-slate-400">Coordinate with the other party</p>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 p-4 h-64 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No messages yet. Say hello! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender_name}</p>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.message}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                  {formatRelativeTime(msg.created_at)}
                </p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 p-3 border-t border-slate-100">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white"
          style={{ maxHeight: 80, overflowY: 'auto' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
