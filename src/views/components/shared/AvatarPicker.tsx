'use client'
import { useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// DiceBear adventurer style — free 3D cartoon SVG API
// https://www.dicebear.com/styles/adventurer/
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/adventurer/svg'

// Pre-picked seeds that generate diverse, expressive cartoon characters
const AVATAR_SEEDS = [
  'Felix',
  'Luna',
  'Kai',
  'Maya',
  'Ryu',
  'Sofia',
  'Jett',
  'Cleo',
  'Axel',
  'Zoe',
  'Marco',
  'Nadia',
  'Theo',
  'Iris',
  'Dante',
  'Aria',
]

// Background color options (Ant Design-ish pastels)
const BG_COLORS = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c9f0c8'

export function getDicebearUrl(seed: string) {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&backgroundColor=${BG_COLORS}&backgroundType=gradientLinear`
}

interface AvatarPickerProps {
  currentUrl?: string | null
  onSelect: (url: string) => void
}

export function AvatarPicker({ currentUrl, onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>(currentUrl ?? '')

  const handleSelect = (seed: string) => {
    const url = getDicebearUrl(seed)
    setSelected(url)
    onSelect(url)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current preview */}
      {selected && (
        <div className="flex items-center gap-3 p-3 bg-[#e6f4ff] rounded-lg border border-[#91caff]">
          <img
            src={selected}
            alt="Selected avatar"
            className="w-14 h-14 rounded-full bg-white flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-[#1677ff]">Avatar selected</p>
            <p className="text-xs text-gray-400 mt-0.5">Save your profile to apply</p>
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Choose an avatar
      </p>

      <div className="grid grid-cols-4 gap-2">
        {AVATAR_SEEDS.map((seed) => {
          const url = getDicebearUrl(seed)
          const isSelected = selected === url
          return (
            <button
              key={seed}
              type="button"
              onClick={() => handleSelect(seed)}
              className={cn(
                'relative rounded-lg p-1.5 border-2 transition-all hover:border-[#1677ff]',
                isSelected
                  ? 'border-[#1677ff] bg-[#e6f4ff]'
                  : 'border-[#f0f0f0] bg-white'
              )}
            >
              <img
                src={url}
                alt={seed}
                className="w-full aspect-square rounded-lg"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-[#1677ff] rounded-full flex items-center justify-center shadow">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p className="text-[10px] text-gray-400 text-center mt-1 truncate">{seed}</p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Powered by{' '}
        <span className="font-medium text-gray-600">DiceBear</span>
        {' '}· Adventurer style
      </p>
    </div>
  )
}
