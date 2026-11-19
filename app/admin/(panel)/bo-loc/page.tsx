'use client'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { useStaff } from '@/components/admin/StaffContext'
import { Card, PageHead, useToast } from '@/components/admin/ui'
import { ATTR_KINDS } from '@/lib/attributes'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Attribute, AttrKind } from '@/lib/types'

/** Quản lý lựa chọn trong từng nhóm bộ lọc (dáng váy, chất liệu, kiểu cổ…) */
export default function FiltersAdmin() {
  const [rows, setRows] = useState<Attribute[] | null>(null)
  const [usage, setUsage] = useState<Record<string, number>>({})
  const toast = useToast()
  const { isAdmin } = useStaff()
  const sb = supabaseBrowser()

  async function load() {
    const { data, error } = await sb.from('attributes').select('*').order('sort_order')
    if (error) toast('Chưa đọc được bộ lọc. Bạn đã chạy file supabase/update-02-bo-suu-tap-bo-loc.sql chưa?', 'error')
    setRows(data ?? [])
    const { data: ps } = await sb.from('products').select('attrs')
    const u: Record<string, number> = {}
    for (const p of (ps ?? []) as { attrs: string[] | null }[]) for (const id of p.attrs ?? []) u[id] = (u[id] ?? 0) + 1
    setUsage(u)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(kind: AttrKind, name: string) {
    const n = name.trim()
    if (!n) return
    const max = Math.max(0, ...(rows ?? []).filter((r) => r.kind === kind).map((r) => r.sort_order))
    const { error } = await sb.from('attributes').insert({ kind, name: n, sort_order: max + 1 })
    if (error) return toast(error.code === '23505' ? `"${n}" đã có trong nhóm này.` : error.message, 'error')
    await Promise.all([load(), refreshSite()])
    toast(`Đã thêm "${n}".`)
  }

  async function rename(a: Attribute, name: string) {
    const n = name.trim()
    if (!n || n === a.name) return
    const { error } = await sb.from('attributes').update({ name: n }).eq('id', a.id)
    if (error) return toast(error.message, 'error')
    await Promise.all([load(), refreshSite()])
    toast('Đã đổi tên.')
  }

  async function remove(a: Attribute) {
    const n = usage[a.id] ?? 0
    if (!confirm(`Xoá "${a.name}"?${n ? ` Lựa chọn này đang gắn với ${n} váy.` : ''}`)) return
    const { error } = await sb.from('attributes').delete().eq('id', a.id)
    if (error) return toast(error.message, 'error')
    await Promise.all([load(), refreshSite()])
  }

  return (
    <>
      <PageHead
        title="Bộ lọc"
        desc="Các lựa chọn khách dùng để lọc váy trên trang Bộ sưu tập. Bấm vào tên để sửa. Nhóm nào chưa có váy nào được gắn sẽ tự ẩn trên web. Gắn lựa chọn cho từng váy trong trang sửa sản phẩm."
      />
      {rows === null ? (
        <p className="meta">Đang tải…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ATTR_KINDS.map((k) => (
            <Group
              key={k.kind}
              label={k.label}
              items={rows.filter((r) => r.kind === k.kind)}
              usage={usage}
              canDelete={isAdmin}
              onAdd={(n) => add(k.kind, n)}
              onRename={rename}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </>
  )
}

function Group(props: {
  label: string
  items: Attribute[]
  usage: Record<string, number>
  canDelete: boolean
  onAdd: (name: string) => Promise<void>
  onRename: (a: Attribute, name: string) => Promise<void>
  onRemove: (a: Attribute) => Promise<void>
}) {
  const [name, setName] = useState('')
  return (
    <Card>
      <h2 className="font-display text-[1.375rem]">{props.label}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {props.items.map((a) => (
          <li key={a.id} className="flex items-center rounded-full bg-oyster pl-1 pr-1.5">
            <input
              defaultValue={a.name}
              onBlur={(e) => props.onRename(a, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              aria-label={`Tên lựa chọn ${a.name}`}
              className="w-auto rounded-full bg-transparent px-2.5 py-1.5 text-[0.875rem] outline-none focus:bg-veil"
              style={{ width: `${Math.max(4, a.name.length + 1)}ch` }}
            />
            <span className="meta mr-1">{props.usage[a.id] ?? 0}</span>
            {props.canDelete && (
              <button onClick={() => props.onRemove(a)} className="h-6 w-6 rounded-full text-taupe hover:bg-stone hover:text-ink" aria-label={`Xoá ${a.name}`}>
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await props.onAdd(name)
          setName('')
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Thêm lựa chọn ${props.label.toLowerCase()}`}
          className="min-w-0 flex-1 rounded-full border border-ink/15 bg-veil px-4 py-2 text-[0.875rem] outline-none focus:border-ink"
        />
        <button className="btn-ink shrink-0 !px-4 !py-2 text-[0.875rem]">Thêm</button>
      </form>
    </Card>
  )
}
