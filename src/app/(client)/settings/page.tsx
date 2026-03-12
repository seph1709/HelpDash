'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { Input } from '@/views/components/shared/Input'
import { Card } from '@/views/components/shared/Card'
import { Avatar } from '@/views/components/shared/Avatar'
import { AvatarPicker } from '@/views/components/shared/AvatarPicker'
import { User, Pencil } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setName(data.name ?? '')
        setAvatarUrl(data.avatar_url ?? null)
      }
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
      toast.success('Profile updated!')
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
      <div className="pt-2">
        <p className="text-xs font-medium uppercase tracking-widest text-[#1677ff] mb-0.5">Account</p>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Avatar */}
      <Card>
        <p className="font-semibold text-gray-900 mb-3">Profile Avatar</p>

        <div className="flex items-center gap-4 mb-4">
          <Avatar name={name} src={avatarUrl} size="xl" />
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {profile?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Pencil className="w-4 h-4" />
          {showPicker ? 'Hide picker' : 'Change avatar'}
        </Button>

        {showPicker && (
          <div className="mt-4">
            <AvatarPicker
              currentUrl={avatarUrl}
              onSelect={(url) => setAvatarUrl(url)}
            />
          </div>
        )}
      </Card>

      {/* Name */}
      <Card>
        <p className="font-semibold text-gray-900 mb-3">Display Name</p>
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </Card>

      <Button onClick={save} loading={saving} fullWidth size="lg">
        Save Changes
      </Button>
    </div>
  )
}
