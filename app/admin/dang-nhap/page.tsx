'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, Input } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import { hasSupabase } from '@/lib/supabase/env'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setError(error.message.includes('Invalid') ? 'Email hoặc mật khẩu chưa đúng.' : error.message)
      return
    }
    router.replace('/admin')
  }

  return (
    <main className="grid min-h-[100svh] place-items-center bg-oyster px-5 py-10">
      <div className="w-full max-w-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-latte.png" alt="Darla Dear Darling" className="mx-auto h-12 w-auto" />
        <form onSubmit={submit} className="mt-10 space-y-4 rounded-2xl bg-veil p-6 sm:p-8">
          <h1 className="font-display text-[1.75rem]">Đăng nhập quản trị</h1>
          {!hasSupabase && (
            <p className="rounded-xl bg-stone px-3 py-2 text-[0.875rem]">
              Chưa kết nối Supabase. Thêm biến môi trường theo hướng dẫn trong README rồi chạy lại.
            </p>
          )}
          <Field label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mật khẩu">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-[0.875rem] text-[#7a1f1f]" role="alert">{error}</p>}
          <button disabled={busy || !hasSupabase} className="btn-ink w-full disabled:opacity-50">
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
          <p className="meta text-center">Quên mật khẩu? Liên hệ quản trị viên để đặt lại.</p>
        </form>
      </div>
    </main>
  )
}
