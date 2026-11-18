'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import InstaButton from './InstaButton'
import { NAV } from './nav'

export default function Header({ season, instagram }: { season: string | null; instagram: string | null }) {
  const [open, setOpen] = useState(false)
  const path = usePathname()

  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="relative z-40">
      <div className="wrap flex items-center justify-between gap-6 py-5 sm:py-7">
        <Link href="/" aria-label="Darla — trang chủ" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="Darla Dear Darling" className="h-9 w-auto sm:h-11" />
        </Link>

        <div className="hidden items-start gap-2.5 md:flex">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ink" />
          <p className="text-[0.8125rem] leading-[1.35]">
            {season}
            <br />
            <Link href="/bo-suu-tap" className="text-taupe underline underline-offset-4 hover:text-ink">
              Đang mở lịch thử váy
            </Link>
          </p>
        </div>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`text-[0.9375rem] hover:text-taupe ${path === n.href ? 'underline underline-offset-[6px]' : ''}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-14 flex-col items-end justify-center gap-[7px] lg:hidden"
          aria-label="Mở menu"
          aria-expanded={open}
        >
          <span className="h-px w-12 bg-ink" />
          <span className="h-px w-12 bg-ink" />
          <span className="h-px w-8 bg-ink" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink text-veil" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap flex items-center justify-between py-5 sm:py-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="Darla Dear Darling" className="h-9 w-auto sm:h-11" />
            <button onClick={() => setOpen(false)} className="relative h-11 w-11" aria-label="Đóng menu">
              <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 rotate-45 bg-veil" />
              <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -rotate-45 bg-veil" />
            </button>
          </div>
          <nav className="wrap flex flex-1 flex-col justify-center gap-2" aria-label="Menu">
            <Link href="/" className="display-md py-1 hover:text-mink">Trang chủ</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="display-md py-1 hover:text-mink">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="wrap pb-10">
            <InstaButton handle={instagram} className="btn-veil" />
          </div>
        </div>
      )}
    </header>
  )
}
