'use client'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { shortPrice } from '@/lib/format'
import type { Category, Collection, Product } from '@/lib/types'
import Media from './Media'

/** Dấu hiệu ảnh sống, giống biểu tượng Live Photo */
function LiveBadge() {
  return (
    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-veil/85 text-mocha sm:right-2.5 sm:top-2.5 sm:h-7 sm:w-7" title="Ảnh sống" aria-label="Ảnh sống">
      <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="5.6" />
        <circle cx="12" cy="12" r="9" strokeDasharray="1.4 2.2" />
      </svg>
    </span>
  )
}

type Props = {
  products: Product[]
  categories: Category[]
  collections?: Collection[]
  view?: 'list' | 'grid'
}

/** Danh sách váy: dạng dòng tối giản (rê chuột xem ảnh) hoặc lưới ảnh */
export default function ProductList({ products, categories, collections = [], view = 'list' }: Props) {
  const [hover, setHover] = useState<Product | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const colName = useMemo(() => Object.fromEntries(collections.map((c) => [c.id, c.name])), [collections])
  const groupOf = (p: Product) => colName[p.collection_id ?? ''] ?? catName[p.category_id ?? ''] ?? ''

  function onMove(e: React.MouseEvent) {
    const el = preview.current
    if (el) el.style.transform = `translate(${e.clientX + 28}px, ${e.clientY - 150}px)`
  }

  return (
    <div>
      {view === 'list' ? (
        <ul className="border-b border-ink/15" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {products.map((p) => (
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
                  {p.is_new && <span className="rounded-full border border-latte/50 px-2 py-0.5 text-[0.6875rem] text-mocha">Mới</span>}
                </span>
                <span className="meta col-start-2 lg:col-start-auto">
                  <span className="mr-2 text-ink/70 lg:hidden">{p.code}</span>
                  {groupOf(p)}
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
        <ul className="grid grid-cols-3 gap-x-2 gap-y-5 sm:gap-x-5 sm:gap-y-8 xl:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/bo-suu-tap/${p.slug}`} className="group block">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl">
                  <Media img={p.images[0]} alt={p.name} className="transition-transform duration-700 group-hover:scale-[1.03]" />
                  {p.is_new && <span className="absolute left-1.5 top-1.5 rounded-full bg-veil/90 px-1.5 py-px text-[0.625rem] sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:py-0.5 sm:text-[0.6875rem]">Mới</span>}
                  {p.images[0]?.live && <LiveBadge />}
                </span>
                <span className="mt-2 flex items-baseline justify-between gap-2 sm:mt-3">
                  <span className="truncate font-display text-[1rem] leading-tight sm:text-2xl">{p.name}</span>
                  <span className="meta hidden sm:inline">{p.code}</span>
                </span>
                <span className="meta hidden sm:block">{groupOf(p)}</span>
                <span className="mt-0.5 block text-[0.75rem] sm:text-[0.875rem]">
                  <span className="hidden text-taupe sm:inline">Thuê từ </span>
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
        {hover && <Media img={hover.images[0]} alt="" tone="veil" live="view" />}
      </div>
    </div>
  )
}
