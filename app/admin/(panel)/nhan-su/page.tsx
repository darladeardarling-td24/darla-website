'use client'
import { useEffect, useState } from 'react'
import { createStaff, deleteStaff, setStaffPassword } from '@/app/admin/actions'
import { useStaff } from '@/components/admin/StaffContext'
import { Card, Field, Input, PageHead, Select, useToast } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const ROLE = { admin: 'Quản trị viên', editor: 'Nhân sự nội dung' }

export default function StaffAdmin() {
  const { isAdmin, profile } = useStaff()
  const toast = useToast()
  const [rows, setRows] = useState<Profile[] | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'editor' as 'admin' | 'editor' })
  const [busy, setBusy] = useState(false)
  const sb = supabaseBrowser()

  async function load() {
    const { data } = await sb.from('profiles').select('*').order('created_at')
    setRows(data ?? [])
  }
  useEffect(() => {
    if (isAdmin) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await createStaff(form)
    setBusy(false)
    if (!r.ok) return toast(r.error, 'error')
    toast(`Đã tạo tài khoản cho ${form.full_name || form.email}. Gửi email và mật khẩu cho nhân sự để đăng nhập.`)
    setForm({ full_name: '', email: '', password: '', role: 'editor' })
    load()
  }

  async function changeRole(p: Profile, role: 'admin' | 'editor') {
    const { error } = await sb.from('profiles').update({ role }).eq('id', p.id)
    if (error) return toast(error.message, 'error')
    toast('Đã đổi quyền.')
    load()
  }

  async function resetPw(p: Profile) {
    const pw = prompt(`Mật khẩu mới cho ${p.full_name || p.email} (ít nhất 8 ký tự):`)
    if (!pw) return
    const r = await setStaffPassword(p.id, pw)
    toast(r.ok ? 'Đã đặt mật khẩu mới.' : r.error, r.ok ? 'ok' : 'error')
  }

  async function remove(p: Profile) {
    if (!confirm(`Xoá tài khoản ${p.full_name || p.email}? Người này sẽ không đăng nhập được nữa.`)) return
    const r = await deleteStaff(p.id)
    if (!r.ok) return toast(r.error, 'error')
    toast('Đã xoá tài khoản.')
    load()
  }

  if (!isAdmin) return <PageHead title="Nhân sự" desc="Mục này chỉ quản trị viên được truy cập." />

  return (
    <>
      <PageHead title="Nhân sự" desc="Nhân sự nội dung được thêm và sửa sản phẩm, ưu đãi, dịch vụ. Chỉ quản trị viên được xoá nội dung, sửa thông tin website và quản lý tài khoản." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          {rows === null ? (
            <p className="meta">Đang tải…</p>
          ) : (
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-veil">
              {rows.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {p.full_name || p.email}
                      {p.id === profile?.id && <span className="meta"> (bạn)</span>}
                    </p>
                    <p className="meta truncate">{p.email}</p>
                  </div>
                  {p.id === profile?.id ? (
                    <span className="text-[0.875rem]">{ROLE[p.role]}</span>
                  ) : (
                    <>
                      <Select value={p.role} onChange={(e) => changeRole(p, e.target.value as Profile['role'])} className="!w-auto !py-1.5 text-[0.875rem]" aria-label="Quyền">
                        <option value="editor">{ROLE.editor}</option>
                        <option value="admin">{ROLE.admin}</option>
                      </Select>
                      <button onClick={() => resetPw(p)} className="rounded-full px-3 py-1 text-[0.8125rem] hover:bg-stone">Đặt mật khẩu</button>
                      <button onClick={() => remove(p)} className="rounded-full px-3 py-1 text-[0.8125rem] text-[#7a1f1f] hover:bg-[#7a1f1f]/10">Xoá</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card className="self-start">
          <form onSubmit={add} className="space-y-4">
            <h2 className="font-display text-[1.375rem]">Tạo tài khoản</h2>
            <Field label="Họ tên">
              <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email đăng nhập">
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Mật khẩu" hint="Ít nhất 8 ký tự. Gửi riêng cho nhân sự.">
              <Input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Quyền">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'editor' })}>
                <option value="editor">{ROLE.editor}</option>
                <option value="admin">{ROLE.admin}</option>
              </Select>
            </Field>
            <button disabled={busy} className="btn-ink w-full disabled:opacity-50">{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
          </form>
        </Card>
      </div>
    </>
  )
}
