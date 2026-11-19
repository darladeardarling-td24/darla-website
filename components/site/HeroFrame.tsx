'use client'
import { useEffect, useRef } from 'react'

/**
 * Khung ảnh bìa bo góc. Khi cuộn: ảnh trôi chậm hơn trang (chiều sâu),
 * khung thu nhỏ nhẹ và bo góc thêm một chút. Chỉ dùng transform nên rất mượt;
 * tắt hẳn khi máy bật chế độ giảm chuyển động.
 */
export default function HeroFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const frame = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      const f = frame.current
      const i = inner.current
      if (!f || !i) return
      const h = f.offsetHeight || 1
      const p = Math.min(Math.max(window.scrollY / h, 0), 1) // 0 → 1 khi cuộn hết ảnh
      f.style.transform = `scale(${1 - p * 0.045})`
      f.style.borderRadius = `${28 + p * 16}px`
      i.style.transform = `translate3d(0, ${p * h * 0.22}px, 0) scale(${1.08 - p * 0.04})`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div ref={frame} className={`relative origin-top overflow-hidden rounded-[22px] will-change-transform sm:rounded-[28px] ${className}`}>
      <div ref={inner} className="absolute inset-0 scale-[1.08] will-change-transform">
        {children}
      </div>
    </div>
  )
}
