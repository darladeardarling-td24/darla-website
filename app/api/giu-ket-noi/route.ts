import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/supabase/env'

/**
 * Giữ cho Supabase (gói miễn phí) không bị tạm dừng vì ít hoạt động.
 * Tác vụ tự động trên GitHub (.github/workflows/giu-supabase.yml) gọi vào đây mỗi ngày.
 * Mỗi lần gọi đọc thẳng một dòng nhỏ từ cơ sở dữ liệu, không qua bộ nhớ đệm.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabase) return Response.json({ ok: false, error: 'Chưa cấu hình Supabase' }, { status: 500 })
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
  const { error } = await db.from('settings').select('id').limit(1)
  if (error) return Response.json({ ok: false, error: error.message }, { status: 502 })
  return Response.json({ ok: true, at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } })
}
