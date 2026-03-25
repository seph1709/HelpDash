'use client'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-[#ff4d4f] ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-[#d9d9d9] bg-white text-gray-900 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-1 focus:ring-[#FF9012] focus:border-[#FF9012]',
            'hover:border-[#FF9012] transition-colors',
            'disabled:opacity-50 disabled:bg-gray-50',
            'min-h-[40px]',
            error && 'border-[#ff4d4f] focus:ring-[#ff4d4f] focus:border-[#ff4d4f]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#ff4d4f]">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-[#ff4d4f] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={3}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-[#d9d9d9] bg-white text-gray-900 text-sm',
            'placeholder:text-gray-400 resize-none',
            'focus:outline-none focus:ring-1 focus:ring-[#FF9012] focus:border-[#FF9012]',
            'hover:border-[#FF9012] transition-colors',
            'disabled:opacity-50 disabled:bg-gray-50',
            error && 'border-[#ff4d4f] focus:ring-[#ff4d4f] focus:border-[#ff4d4f]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#ff4d4f]">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-[#ff4d4f] ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-[#d9d9d9] bg-white text-gray-900 text-sm',
            'focus:outline-none focus:ring-1 focus:ring-[#FF9012] focus:border-[#FF9012]',
            'hover:border-[#FF9012] transition-colors',
            'min-h-[40px]',
            error && 'border-[#ff4d4f]',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-[#ff4d4f]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
