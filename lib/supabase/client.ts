'use client'
import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

let client: ReturnType<typeof createBrowserClient> | null = null

/** Client dùng trong trình duyệt (trang admin). Phiên đăng nhập lưu trong cookie. */
export function supabaseBrowser() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
