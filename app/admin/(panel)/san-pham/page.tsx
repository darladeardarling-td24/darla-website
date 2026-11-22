'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { useStaff } from '@/components/admin/StaffContext'
import { Input, Select, StatusBadge, useToast } from '@/components/admin/ui'
import { shortPrice } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Category, Collection, Product } from '@/lib/types'

export default function ProductsAdmin() {
  const [rows, setRows] = useState<Product[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [cols, setCols] = useState<Collection[]>([])
  const [col, setCol] = useState('')
  const toast = useToast()
  const { isAdmin } = useStaff()
  // Lưới ảnh dọc (mặc định, lướt nhanh được nhiều váy) hoặc danh sách; nhớ lựa chọn trên máy này
  const [view, setView] = useState<'grid' | 'list'>('grid')
  useEffect(() => {
    try {
      const v = localStorage.getItem('admin-products-view')
      if (v === 'grid' || v === 'list') setView(v)
    } catch {}
  }, [])
  function changeView(v: 'grid' | 'list') {
    setView(v)
    try {
      localStorage.setItem('admin-products-view', v)
    } catch {}
  }

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('products').select('*').order('sort_order').order('created_at', { ascending: false }).then(({ data }: { data: Product[] | null }) => setRows(data ?? []))
    sb.from('categories').select('*').order('sort_order').then(({ data }: { data: Category[] | null }) => setCats(data ?? []))
    sb.from('collections').select('*').order('sort_order').then(({ data }: { data: Collection[] | null }) => setCols(data ?? []))
  }, [])

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats])
  const colName = useMemo(() => Object.fromEntries(cols.map((c) => [c.id, c.name])), [cols])
  const shown = (rows ?? []).filter(
    (p) => (!cat || p.category_id === cat) && (!col || (col === 'none' ? !p.collection_id : p.collection_id === col)) && (!q || `${p.name} ${p.code}`.toLowerCase().includes(q.toLowerCase())),
  )

  async function patch(p: Product, change: Partial<Product>) {
    setRows((r) => r!.map((x) => (x.id === p.id ? { ...x, ...change } : x)))
    const { error } = await supabaseBrowser().from('products').update(change).eq('id', p.id)
    if (error) return toast('Chưa lưu được: ' + error.message, 'error')
    await refreshSite()
  }

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="font-display text-[2rem] leading-tight sm:text-[2.75rem]">Sản phẩm</h1>
          <p className="meta mt-1 hidden max-w-xl sm:block">Váy cưới, váy đi bàn, áo dài, vest. Bấm vào váy để sửa.</p>
        </div>
        <Link href="/admin/san-pham/moi" className="btn-ink hidden sm:inline-flex">Thêm sản phẩm</Link>
      </div>

      {/* Tìm & lọc */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_200px_200px] sm:gap-2.5">
          <div className="col-span-2 sm:col-span-1">
            <Input placeholder="Tìm theo tên hoặc mã váy" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={col} onChange={(e) => setCol(e.target.value)}>
            <option value="">Tất cả bộ sưu tập</option>
            <option value="none">Chưa thuộc bộ sưu tập</option>
            {cols.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <p className="meta">{rows ? `${shown.length} sản phẩm` : ''}</p>
          <div className="inline-flex rounded-full bg-veil p-0.5 text-[0.8125rem]">
            {([
              ['grid', 'Lưới ảnh'],
              ['list', 'Danh sách'],
            ] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => changeView(k)} className={`rounded-full px-3.5 py-1 ${view === k ? 'bg-ink text-veil' : 'text-taupe'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows === null ? (
        <p className="meta py-10">Đang tải…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl bg-veil px-6 py-14 text-center">
          <p className="text-[1rem]">{rows.length ? 'Không có sản phẩm khớp bộ lọc.' : 'Chưa có sản phẩm nào.'}</p>
          {!rows.length && <Link href="/admin/san-pham/moi" className="btn-ink mt-5">Thêm sản phẩm đầu tiên</Link>}
        </div>
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((p) => {
            const lives = p.images.filter((im) => im.live).length
            return (
              <li key={p.id} className="min-w-0">
                <Link href={`/admin/san-pham/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone sm:rounded-xl">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].thumb} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="meta grid h-full place-items-center">Chưa có ảnh</span>
                    )}
                    <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
                      {p.status === 'draft' && <span className="rounded-full bg-veil/90 px-1.5 py-px text-[0.625rem] text-taupe sm:text-[0.6875rem]">Nháp</span>}
                      {p.is_featured && <span className="rounded-full bg-ink/80 px-1.5 py-px text-[0.625rem] text-veil sm:text-[0.6875rem]">Nổi bật</span>}
                    </div>
                    {lives > 0 && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-ink/60 px-1.5 py-px text-[0.625rem] text-veil" title="Số ảnh sống">
                        ● {lives}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate font-display text-[1rem] leading-tight sm:text-[1.125rem]">{p.name}</p>
                  <p className="meta truncate text-[0.6875rem] sm:text-[0.75rem]">
                    {[p.code, shortPrice(p.price_rent)].filter(Boolean).join(' · ')}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-veil">
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-2.5 sm:gap-4 sm:p-4">
              <Link href={`/admin/san-pham/${p.id}`} className="aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-lg bg-stone sm:w-14">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/san-pham/${p.id}`} className="font-display text-[1.125rem] hover:underline sm:text-[1.25rem]">{p.name}</Link>
                <p className="meta flex flex-wrap gap-x-3 text-[0.75rem] sm:text-[0.8125rem]">
                  {[p.code, catName[p.category_id ?? ''], colName[p.collection_id ?? ''], `Thuê ${shortPrice(p.price_rent)}`, `${p.images.length} ảnh`].filter(Boolean).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
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

      {/* Nút thêm nổi ở góc dưới trên điện thoại */}
      <Link
        href="/admin/san-pham/moi"
        className="btn-ink fixed bottom-5 right-5 z-30 !px-5 !py-3 shadow-[0_8px_24px_rgba(43,35,30,0.25)] sm:hidden"
      >
        + Thêm váy
      </Link>
    </>
  )
}
