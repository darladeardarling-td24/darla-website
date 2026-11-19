'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  /** hover: máy tính chạy khi rê chuột, điện thoại chạy khi lướt tới; view: chạy khi hiện trên màn hình */
  trigger?: 'hover' | 'view'
  objectPosition?: string
  className?: string
}

/**
 * Lớp video "ảnh sống" đặt chồng lên ảnh tĩnh.
 * - Không tải gì cho tới khi cần chạy (preload="none", chưa gắn src)
 * - Dừng khi ra khỏi màn hình
 * - Bỏ qua hoàn toàn khi máy bật Tiết kiệm dữ liệu hoặc Giảm chuyển động
 */
export default function LiveVideo({ src, trigger = 'hover', objectPosition, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const host = (v.closest('a, button, [data-live-host]') as HTMLElement | null) ?? v.parentElement!
    let visible = false
    let hovered = false

    const sync = () => {
      const want = trigger === 'view' || !canHover ? visible : visible && hovered
      if (want) {
        if (!v.getAttribute('src')) v.setAttribute('src', src)
        v.play().catch(() => {})
      } else if (!v.paused) {
        v.pause()
        if (canHover && trigger === 'hover') v.currentTime = 0
      }
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting && e.intersectionRatio >= 0.55
        sync()
      },
      { threshold: [0, 0.55, 1] },
    )
    io.observe(v)
    const enter = () => {
      hovered = true
      sync()
    }
    const leave = () => {
      hovered = false
      sync()
    }
    if (canHover && trigger === 'hover') {
      host.addEventListener('mouseenter', enter)
      host.addEventListener('mouseleave', leave)
    }
    return () => {
      io.disconnect()
      host.removeEventListener('mouseenter', enter)
      host.removeEventListener('mouseleave', leave)
      v.pause()
    }
  }, [src, trigger])

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onPlaying={() => setShown(true)}
      onPause={() => setShown(false)}
      style={objectPosition ? { objectPosition } : undefined}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
