'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { useStaff } from '@/components/admin/StaffContext'
import { Input, PageHead, Select, StatusBadge, useToast } from '@/components/admin/ui'
import { shortPrice } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Category, Product } from '@/lib/types'

export default function ProductsAdmin() {
  const [rows, setRows] = useState<Product[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const toast = useToast()
  const { isAdmin } = useStaff()

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('products').select('*').order('sort_order').order('created_at', { ascending: false }).then(({ data }: { data: Product[] | null }) => setRows(data ?? []))
    sb.from('categories').select('*').order('sort_order').then(({ data }: { data: Category[] | null }) => setCats(data ?? []))
  }, [])

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats])
  const shown = (rows ?? []).filter(
    (p) => (!cat || p.category_id === cat) && (!q || `${p.name} ${p.code}`.toLowerCase().includes(q.toLowerCase())),
  )

  async function patch(p: Product, change: Partial<Product>) {
    setRows((r) => r!.map((x) => (x.id === p.id ? { ...x, ...change } : x)))
    const { error } = await supabaseBrowser().from('products').update(change).eq('id', p.id)
    if (error) return toast('Chưa lưu được: ' + error.message, 'error')
    await refreshSite()
  }

  return (
    <>
      <PageHead
        title="Sản phẩm"
        desc="Váy cưới, váy đi bàn, áo dài, vest. Bấm vào tên để sửa."
        action={<Link href="/admin/san-pham/moi" className="btn-ink">Thêm sản phẩm</Link>}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Tìm theo tên hoặc mã váy" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {rows === null ? (
        <p className="meta py-10">Đang tải…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl bg-veil px-6 py-14 text-center">
          <p className="text-[1rem]">{rows.length ? 'Không có sản phẩm khớp bộ lọc.' : 'Chưa có sản phẩm nào.'}</p>
          {!rows.length && <Link href="/admin/san-pham/moi" className="btn-ink mt-5">Thêm sản phẩm đầu tiên</Link>}
        </div>
      ) : (
        <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-veil">
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
              <Link href={`/admin/san-pham/${p.id}`} className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-stone">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].thumb} alt="" className="h-full w-full object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/san-pham/${p.id}`} className="font-display text-[1.25rem] hover:underline">{p.name}</Link>
                <p className="meta flex flex-wrap gap-x-3">
                  {[p.code, catName[p.category_id ?? ''], `Thuê ${shortPrice(p.price_rent)}`, `${p.images.length} ảnh`].filter(Boolean).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <button onClick={() => patch(p, { is_featured: !p.is_featured })} className={`rounded-full px-2.5 py-0.5 text-[0.75rem] ${p.is_featured ? 'bg-stone' : 'text-taupe hover:text-ink'}`}>
                  {p.is_featured ? 'Nổi bật' : 'Đặt nổi bật'}
                </button>
                <button onClick={() => patch(p, { status: p.status === 'published' ? 'draft' : 'published' })} title="Bấm để đổi">
                  <StatusBadge status={p.status} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isAdmin && rows && rows.length > 0 && <p className="meta mt-3">Để xoá sản phẩm, mở sản phẩm và chọn Xoá ở cuối trang.</p>}
    </>
  )
}
