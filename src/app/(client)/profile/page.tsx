'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { Input } from '@/views/components/shared/Input'
import { Card } from '@/views/components/shared/Card'
import { Avatar } from '@/views/components/shared/Avatar'
import { AvatarPicker } from '@/views/components/shared/AvatarPicker'
import { MapPin, Pencil, CheckCircle } from 'lucide-react'

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [jobCount, setJobCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { count }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id),
      ])

      if (p) {
        setProfile(p)
        setName(p.name ?? '')
        setAvatarUrl(p.avatar_url ?? null)
      }
      setJobCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error()
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim(), avatar_url: avatarUrl })
        .eq('id', user.id)
      if (error) throw new Error(error.message)
      setProfile((prev: any) => ({ ...prev, name: name.trim(), avatar_url: avatarUrl }))
      toast.success('Profile updated!')
      setEditing(false)
      setShowPicker(false)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#1677ff] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#1677ff] mb-0.5">Account</p>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (editing) {
              // cancel — restore original values
              setName(profile?.name ?? '')
              setAvatarUrl(profile?.avatar_url ?? null)
              setShowPicker(false)
            }
            setEditing(!editing)
          }}
        >
          <Pencil className="w-4 h-4" />
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Profile hero card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={name} src={avatarUrl} size="xl" />
            {editing && (
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1677ff] rounded-full flex items-center justify-center shadow border-2 border-white"
              >
                <Pencil className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <>
                <h2 className="font-semibold text-gray-900 text-lg leading-tight">{profile?.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{profile?.email}</p>
                {profile?.barangay && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {profile.barangay.split(',').slice(0, 2).join(', ')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        {editing && showPicker && (
          <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
            <AvatarPicker
              currentUrl={avatarUrl}
              onSelect={(url) => {
                setAvatarUrl(url)
                setShowPicker(false)
              }}
            />
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Jobs posted</p>
          <p className="text-xl font-semibold text-gray-900">{jobCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Member since</p>
          <p className="text-sm font-semibold text-gray-900">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </Card>
      </div>

      {/* Save button */}
      {editing && (
        <Button onClick={save} loading={saving} fullWidth size="lg">
          Save Changes
        </Button>
      )}
    </div>
  )
}
