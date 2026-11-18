'use client'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { shortPrice } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import Media from './Media'

type Props = { products: Product[]; categories: Category[]; filters?: boolean; initialView?: 'list' | 'grid' }

export default function ProductList({ products, categories, filters = true, initialView = 'list' }: Props) {
  const [cat, setCat] = useState<string>('all')
  const [view, setView] = useState<'list' | 'grid'>(initialView)
  const [hover, setHover] = useState<Product | null>(null)
  const preview = useRef<HTMLDivElement>(null)

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const usedCats = categories.filter((c) => products.some((p) => p.category_id === c.id))
  const shown = cat === 'all' ? products : products.filter((p) => p.category_id === cat)

  function onMove(e: React.MouseEvent) {
    const el = preview.current
    if (el) el.style.transform = `translate(${e.clientX + 28}px, ${e.clientY - 150}px)`
  }

  return (
    <div>
      {filters && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 sm:mb-10">
          <div className="-mx-1 flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo danh mục">
            {[{ id: 'all', name: 'Tất cả' }, ...usedCats].map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={cat === c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full border px-4 py-2 text-[0.875rem] transition-colors ${
                  cat === c.id ? 'border-ink bg-ink text-veil' : 'border-ink/25 hover:border-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[0.875rem]" aria-label="Kiểu hiển thị">
            {(['list', 'grid'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-2 py-1 ${view === v ? 'underline underline-offset-[6px]' : 'text-taupe hover:text-ink'}`}
              >
                {v === 'list' ? 'Danh sách' : 'Lưới ảnh'}
              </button>
            ))}
          </div>
        </div>
      )}

      {shown.length === 0 && <p className="meta py-16 text-center">Danh mục này đang được cập nhật.</p>}

      {view === 'list' ? (
        <ul className="border-b border-ink/15" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {shown.map((p) => (
            <li key={p.id} className="border-t border-ink/15" onMouseEnter={() => setHover(p)}>
              <Link
                href={`/bo-suu-tap/${p.slug}`}
                className="group grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[96px_1fr_auto] sm:py-5 lg:grid-cols-[90px_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_9rem] lg:gap-x-8 lg:py-6"
              >
                <span className="row-span-3 aspect-[3/4] w-[72px] overflow-hidden rounded-lg sm:row-span-2 sm:w-[96px] lg:hidden">
                  <Media img={p.images[0]} alt={p.name} />
                </span>
                <span className="meta hidden lg:block">{p.code}</span>
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-[1.75rem] leading-none tracking-[-0.02em] transition-transform duration-300 group-hover:translate-x-2 sm:text-[2.5rem] lg:text-[3.25rem]">
                    {p.name}
                  </span>
                  {p.is_new && <span className="rounded-full border border-ink/40 px-2 py-0.5 text-[0.6875rem]">Mới</span>}
                </span>
                <span className="meta col-start-2 lg:col-start-auto">
                  <span className="mr-2 text-ink/70 lg:hidden">{p.code}</span>
                  {catName[p.category_id ?? ''] ?? ''}
                  {p.silhouette ? `, dáng ${p.silhouette.toLowerCase()}` : ''}
                </span>
                <span className="hidden text-[0.875rem] leading-6 text-ink/80 lg:block">{p.short_desc}</span>
                <span className="col-start-2 text-[0.9375rem] sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-right lg:col-start-auto lg:row-span-1 lg:row-start-auto">
                  <span className="text-taupe">Thuê từ </span>
                  {shortPrice(p.price_rent)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id}>
              <Link href={`/bo-suu-tap/${p.slug}`} className="group block">
                <span className="block aspect-[3/4] overflow-hidden rounded-2xl">
                  <Media img={p.images[0]} alt={p.name} className="transition-transform duration-700 group-hover:scale-[1.03]" />
                </span>
                <span className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="font-display text-xl sm:text-2xl">{p.name}</span>
                  <span className="meta">{p.code}</span>
                </span>
                <span className="mt-0.5 block text-[0.875rem]">
                  <span className="text-taupe">Thuê từ </span>
                  {shortPrice(p.price_rent)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Ảnh xem nhanh đi theo con trỏ — chỉ trên máy tính */}
      <div
        ref={preview}
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[3/4] w-[240px] overflow-hidden rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] transition-opacity duration-200 lg:block ${
          view === 'list' && hover ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      >
        {hover && <Media img={hover.images[0]} alt="" tone="veil" />}
      </div>
    </div>
  )
}
