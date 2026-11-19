'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import type { Product } from '@/lib/types'
import Media from './Media'

/** Tên các mẫu váy viết liền như mục lục tạp chí; rê chuột vào tên mới hiện ảnh (máy tính) */
export default function NameIndex({ products }: { products: Product[] }) {
  const [hover, setHover] = useState<Product | null>(null)
  const box = useRef<HTMLDivElement>(null)

  return (
    <div
      onMouseMove={(e) => {
        if (box.current) box.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 140}px)`
      }}
      onMouseLeave={() => setHover(null)}
    >
      <p className="font-display leading-[1.18] tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 5.2vw, 4.75rem)' }}>
        {products.map((p, i) => (
          <span key={p.id}>
            <Link
              href={`/bo-suu-tap/${p.slug}`}
              onMouseEnter={() => setHover(p)}
              onFocus={() => setHover(p)}
              onBlur={() => setHover(null)}
              className={`whitespace-nowrap decoration-1 underline-offset-[0.14em] transition-colors hover:italic hover:underline focus-visible:italic ${
                hover && hover.id !== p.id ? 'text-latte/30' : 'text-latte'
              }`}
            >
              {p.name}
            </Link>
            {i < products.length - 1 && <span className="text-mink"> / </span>}
          </span>
        ))}
      </p>
      <div
        ref={box}
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[3/4] w-[220px] overflow-hidden rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] transition-opacity duration-200 lg:block ${hover ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
      >
        {hover && <Media img={hover.images[0]} alt="" tone="veil" />}
      </div>
    </div>
  )
}
