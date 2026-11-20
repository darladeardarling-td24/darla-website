'use client'
import { useEffect, useRef, useState } from 'react'
import type { Img } from '@/lib/types'
import Media from './Media'

/**
 * Ảnh váy ở trang chi tiết: vuốt ngang (điện thoại) hoặc bấm ‹ › / ảnh nhỏ (máy tính)
 * để xem lần lượt ảnh và ảnh sống theo đúng thứ tự sắp trong admin.
 * Ảnh sống tự chạy khi vuốt tới, dừng khi vuốt qua.
 */
export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const n = images.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  function go(k: number) {
    const el = track.current
    if (!el) return
    const next = Math.max(0, Math.min(n - 1, k))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  if (n === 0) {
    return (
      <div className="aspect-[3/4] overflow-hidden rounded-[24px]">
        <Media img={null} alt={name} variant="full" />
      </div>
    )
  }

  return (
    <div>
      <div className="group relative">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[24px]"
          aria-roledescription="Bộ ảnh"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(i + 1)
            if (e.key === 'ArrowLeft') go(i - 1)
          }}
          tabIndex={0}
        >
          {images.map((im, k) => (
            <div key={im.url + k} className="relative aspect-[3/4] w-full shrink-0 snap-center snap-always" aria-label={`${k + 1} / ${n}`}>
              <Media img={im} alt={`${name} — ${im.live ? 'ảnh sống' : 'ảnh'} ${k + 1}`} variant="full" eager={k === 0} live="view" />
            </div>
          ))}
        </div>

        {/* Số thứ tự & nhãn ảnh sống */}
        {n > 1 && (
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2">
            <span className="rounded-full bg-veil/85 px-3 py-1 text-[0.75rem] tabular-nums backdrop-blur">
              {i + 1} / {n}
            </span>
            {images[i]?.live && <span className="rounded-full bg-veil/85 px-3 py-1 text-[0.75rem] text-mocha backdrop-blur">Ảnh sống</span>}
          </div>
        )}

        {/* Nút ‹ › trên máy tính */}
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label="Ảnh trước"
              className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-veil/70 text-[1.25rem] text-mocha opacity-0 backdrop-blur transition-opacity hover:bg-veil disabled:!opacity-0 group-hover:opacity-100 lg:grid"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              disabled={i === n - 1}
              aria-label="Ảnh sau"
              className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-veil/70 text-[1.25rem] text-mocha opacity-0 backdrop-blur transition-opacity hover:bg-veil disabled:!opacity-0 group-hover:opacity-100 lg:grid"
            >
              ›
            </button>
          </>
        )}

        {/* Chấm chỉ vị trí trên điện thoại */}
        {n > 1 && (
          <div className="pointer-events-none absolute bottom-5 right-4 flex gap-1.5 lg:hidden" aria-hidden>
            {images.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-veil' : 'w-1.5 bg-veil/55'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Ảnh nhỏ */}
      {n > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, k) => (
            <button
              key={im.url + k}
              type="button"
              onClick={() => go(k)}
              aria-label={`Xem ${im.live ? 'ảnh sống' : 'ảnh'} ${k + 1}`}
              aria-current={k === i}
              className={`relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg transition-opacity sm:w-[4.5rem] ${
                k === i ? 'ring-1 ring-mocha ring-offset-2 ring-offset-oyster' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Media img={im} alt="" live="off" />
              {im.live && (
                <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-veil/90 text-mocha" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="12" r="6.5" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
