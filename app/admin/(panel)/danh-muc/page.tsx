'use client'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { useStaff } from '@/components/admin/StaffContext'
import { Input, PageHead, useToast } from '@/components/admin/ui'
import { slugify } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

export default function CategoriesAdmin() {
  const [rows, setRows] = useState<Category[] | null>(null)
  const [name, setName] = useState('')
  const toast = useToast()
  const { isAdmin } = useStaff()
  const sb = supabaseBrowser()

  async function load() {
    const { data } = await sb.from('categories').select('*').order('sort_order')
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await sb.from('categories').insert({ name: name.trim(), slug: slugify(name), sort_order: (rows?.length ?? 0) + 1 })
    if (error) return toast(error.code === '23505' ? 'Danh mục này đã có.' : error.message, 'error')
    setName('')
    await Promise.all([load(), refreshSite()])
    toast('Đã thêm danh mục.')
  }

  async function rename(c: Category, value: string) {
    if (!value.trim() || value === c.name) return
    const { error } = await sb.from('categories').update({ name: value.trim() }).eq('id', c.id)
    if (error) return toast(error.message, 'error')
    await refreshSite()
    toast('Đã đổi tên.')
  }

  async function move(i: number, d: -1 | 1) {
    if (!rows) return
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
    await Promise.all(next.map((c, k) => sb.from('categories').update({ sort_order: k + 1 }).eq('id', c.id)))
    await refreshSite()
  }

  async function remove(c: Category) {
    if (!confirm(`Xoá danh mục "${c.name}"? Sản phẩm trong danh mục sẽ chuyển thành "Chưa phân loại".`)) return
    const { error } = await sb.from('categories').delete().eq('id', c.id)
    if (error) return toast(error.message, 'error')
    await Promise.all([load(), refreshSite()])
  }

  return (
    <>
      <PageHead title="Danh mục" desc="Dùng để lọc sản phẩm trên trang Bộ sưu tập. Bấm vào tên để sửa." />
      <form onSubmit={add} className="mb-5 flex gap-2.5">
        <Input placeholder="Tên danh mục mới, ví dụ: Váy dạ hội" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-ink shrink-0">Thêm</button>
      </form>
      {rows === null ? (
        <p className="meta">Đang tải…</p>
      ) : (
        <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-veil">
          {rows.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 p-3">
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="h-8 w-8 rounded-full hover:bg-stone disabled:opacity-25" aria-label="Lên">‹</button>
                <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="h-8 w-8 rounded-full hover:bg-stone disabled:opacity-25" aria-label="Xuống">›</button>
              </div>
              <input
                defaultValue={c.name}
                onBlur={(e) => rename(c, e.target.value)}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 font-display text-[1.25rem] outline-none focus:bg-oyster"
                aria-label="Tên danh mục"
              />
              {isAdmin && (
                <button onClick={() => remove(c)} className="rounded-full px-3 py-1 text-[0.8125rem] text-[#7a1f1f] hover:bg-[#7a1f1f]/10">Xoá</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
