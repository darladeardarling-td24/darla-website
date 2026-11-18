import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/** Client đọc phiên đăng nhập từ cookie — dùng trong Server Actions của admin. */
export async function supabaseServer() {
  const store = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          /* gọi từ Server Component: bỏ qua */
        }
      },
    },
  })
}

/** Client quyền cao (service role) — chỉ dùng phía máy chủ để quản lý tài khoản nhân sự. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY trên Vercel.')
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
