'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import InstaButton from './InstaButton'
import { NAV } from './nav'

type Tone = 'sand' | 'ink' | 'veil'
type Props = { season: string | null; instagram: string | null; heroTone: { desktop: Tone; mobile: Tone } }

const logo = (t: Tone) => (t === 'veil' ? '/logo-white.png' : '/logo-latte.png')

// Kiểu chữ & kính mờ khi nằm trên ảnh bìa, theo màu chọn trong admin (điện thoại / từ sm trở lên)
const ON_IMG = {
  sand: { text: 'text-mocha', glass: 'border-white/60 bg-white/45', line: 'bg-mocha' },
  ink: { text: 'text-ink', glass: 'border-white/50 bg-white/35', line: 'bg-ink' },
  veil: { text: 'text-veil', glass: 'border-white/25 bg-white/15', line: 'bg-veil' },
}
const ON_IMG_SM = {
  sand: { text: 'sm:text-mocha', glass: 'sm:border-white/60 sm:bg-white/45', line: 'sm:bg-mocha' },
  ink: { text: 'sm:text-ink', glass: 'sm:border-white/50 sm:bg-white/35', line: 'sm:bg-ink' },
  veil: { text: 'sm:text-veil', glass: 'sm:border-white/25 sm:bg-white/15', line: 'sm:bg-veil' },
}

export default function Header({ instagram, heroTone }: Props) {
  const [open, setOpen] = useState(false)
  const [floating, setFloating] = useState(false)
  const path = usePathname()
  const onHome = path === '/'
  const m = onHome ? heroTone.mobile : 'sand'
  const d = onHome ? heroTone.desktop : 'sand'
  const im = ON_IMG[m]
  const id = ON_IMG_SM[d]

  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Thanh menu nổi: trượt xuống khi khách đã cuộn qua phần đầu trang
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setFloating(window.scrollY > (onHome ? window.innerHeight * 0.55 : 140)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [onHome])

  const isActive = (href: string) => path === href || (href !== '/' && !href.startsWith('/#') && path.startsWith(href))

  return (
    <>
      {/* Thanh đầu trang: trên trang chủ nằm đè lên ảnh bìa, các trang khác nằm trên nền be */}
      <header className={onHome ? 'absolute inset-x-0 top-0 z-40 px-2 pt-2 sm:px-3 sm:pt-3' : 'relative z-40'}>
        <div className={`wrap flex items-center justify-between gap-6 ${onHome ? 'py-4 sm:py-6' : 'py-5 sm:py-7'}`}>
          <Link href="/" aria-label="Darla — trang chủ" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo(m)} alt="Darla Dear Darling" className="h-9 w-auto sm:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo(d)} alt="" aria-hidden className="hidden h-11 w-auto sm:block" />
          </Link>

          {onHome ? (
            <nav
              className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border p-1.5 backdrop-blur-md lg:flex ${im.glass} ${id.glass} ${im.text} ${id.text}`}
              aria-label="Điều hướng chính"
            >
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-[0.9375rem] transition-colors hover:bg-white/40">
                  {n.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-[0.9375rem] underline-offset-[6px] transition-opacity hover:opacity-60 ${isActive(n.href) ? 'underline' : ''}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <InstaButton
              handle={instagram}
              label="Tư vấn"
              className={
                onHome
                  ? `hidden items-center gap-2 rounded-full border px-4 py-2.5 text-[0.875rem] backdrop-blur-md transition-colors hover:bg-white/50 lg:inline-flex ${im.glass} ${id.glass} ${im.text} ${id.text}`
                  : 'hidden items-center gap-2 rounded-full border border-mocha/40 px-4 py-2.5 text-[0.875rem] text-mocha transition-colors hover:bg-mocha hover:text-veil lg:inline-flex'
              }
            />
            <MenuButton onClick={() => setOpen(true)} glass={onHome} lineClass={onHome ? `${im.line} ${id.line}` : 'bg-mocha'} glassClass={onHome ? `${im.glass} ${id.glass}` : ''} />
          </div>
        </div>
      </header>

      {/* Thanh menu nổi dạng kính mờ, trượt xuống mượt khi cuộn */}
      <div
        className={`fixed inset-x-2 top-2 z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-3 sm:top-3 ${
          floating ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-[130%] opacity-0'
        }`}
        aria-hidden={!floating}
      >
        <div className="mx-auto flex max-w-page items-center justify-between gap-4 rounded-full border border-white/60 bg-oyster/75 py-2 pl-5 pr-2 shadow-[0_10px_40px_-12px_rgba(60,45,30,0.25)] backdrop-blur-xl sm:pl-6">
          <Link href="/" aria-label="Darla — trang chủ" tabIndex={floating ? 0 : -1} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-latte.png" alt="Darla" className="h-7 w-auto sm:h-8" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng nhanh">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                tabIndex={floating ? 0 : -1}
                className={`rounded-full px-4 py-2 text-[0.875rem] transition-colors hover:bg-veil ${isActive(n.href) ? 'bg-veil' : ''}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/bo-suu-tap" tabIndex={floating ? 0 : -1} className="hidden rounded-full bg-mocha px-5 py-2.5 text-[0.875rem] font-medium text-veil transition-colors hover:bg-latte sm:inline-flex">
              Xem bộ sưu tập
            </Link>
            <MenuButton onClick={() => setOpen(true)} glass lineClass="bg-mocha" glassClass="border-mocha/15 bg-veil/70" />
          </div>
        </div>
      </div>

      {/* Menu toàn màn hình */}
      {open && (
        <div className="dark-surface fixed inset-0 z-50 flex flex-col bg-ink text-veil" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap flex items-center justify-between py-5 sm:py-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="Darla Dear Darling" className="h-9 w-auto sm:h-11" />
            <button onClick={() => setOpen(false)} className="relative h-11 w-11" aria-label="Đóng menu">
              <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 rotate-45 bg-veil" />
              <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -rotate-45 bg-veil" />
            </button>
          </div>
          <nav className="wrap flex flex-1 flex-col justify-center gap-2" aria-label="Menu">
            <Link href="/" className="display-md py-1 transition-opacity hover:opacity-60">Trang chủ</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="display-md py-1 transition-opacity hover:opacity-60">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="wrap pb-10">
            <InstaButton handle={instagram} className="btn-veil" />
          </div>
        </div>
      )}
    </>
  )
}

function MenuButton({ onClick, glass, lineClass, glassClass }: { onClick: () => void; glass?: boolean; lineClass: string; glassClass: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Mở menu"
      className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full lg:hidden ${glass ? `border backdrop-blur-md ${glassClass}` : ''}`}
    >
      <span className={`h-px w-5 ${lineClass}`} />
      <span className={`h-px w-5 ${lineClass}`} />
      <span className={`h-px w-3.5 translate-x-[3px] ${lineClass}`} />
    </button>
  )
}
