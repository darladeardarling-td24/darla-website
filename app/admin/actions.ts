'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; error: string }

async function currentRole(): Promise<{ id: string; role: 'admin' | 'editor' } | null> {
  const sb = await supabaseServer()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return null
  const { data } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return data ? { id: user.id, role: data.role } : null
}

/** Làm mới toàn bộ trang khách ngay sau khi lưu nội dung */
export async function refreshSite(): Promise<void> {
  if (!(await currentRole())) return
  revalidatePath('/', 'layout')
}

const ADMIN_ONLY = 'Chỉ quản trị viên mới thực hiện được thao tác này.'

export async function createStaff(input: {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'editor'
}): Promise<Result> {
  if ((await currentRole())?.role !== 'admin') return { ok: false, error: ADMIN_ONLY }
  if (input.password.length < 8) return { ok: false, error: 'Mật khẩu cần ít nhất 8 ký tự.' }
  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name.trim() },
    })
    if (error) return { ok: false, error: /already/i.test(error.message) ? 'Email này đã có tài khoản.' : error.message }
    if (input.role === 'admin' && data.user) {
      await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function setStaffPassword(userId: string, password: string): Promise<Result> {
  if ((await currentRole())?.role !== 'admin') return { ok: false, error: ADMIN_ONLY }
  if (password.length < 8) return { ok: false, error: 'Mật khẩu cần ít nhất 8 ký tự.' }
  try {
    const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, { password })
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteStaff(userId: string): Promise<Result> {
  const me = await currentRole()
  if (me?.role !== 'admin') return { ok: false, error: ADMIN_ONLY }
  if (me.id === userId) return { ok: false, error: 'Bạn không thể tự xoá tài khoản của mình.' }
  try {
    const { error } = await supabaseAdmin().auth.admin.deleteUser(userId)
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
