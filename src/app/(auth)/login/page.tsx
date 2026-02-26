'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { Input } from '@/views/components/shared/Input'
import { Card } from '@/views/components/shared/Card'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw new Error(error.message)
      const next = searchParams.get('next') ?? '/dashboard'
      router.push(next)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        No account yet?{' '}
        <Link href="/register" className="text-indigo-600 font-medium hover:underline">
          Register here
        </Link>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-50 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}
