'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StaffCtx } from '@/components/admin/StaffContext'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const NAV = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/trang-chu', label: 'Ảnh trang chủ' },
  { href: '/admin/san-pham', label: 'Sản phẩm' },
  { href: '/admin/bo-suu-tap', label: 'Bộ sưu tập' },
  { href: '/admin/bo-loc', label: 'Bộ lọc' },
  { href: '/admin/danh-muc', label: 'Danh mục' },
  { href: '/admin/uu-dai', label: 'Ưu đãi' },
  { href: '/admin/dich-vu', label: 'Makeup & rạp cưới' },
  { href: '/admin/cai-dat', label: 'Thông tin website', admin: true },
  { href: '/admin/nhan-su', label: 'Nhân sự', admin: true },
]

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>('loading')
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const sb = supabaseBrowser()
    let alive = true
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return router.replace('/admin/dang-nhap')
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!data) return setState('denied')
      setProfile(data as Profile)
      setState('ready')
    }
    load()
    const { data: sub } = sb.auth.onAuthStateChange((e: string) => e === 'SIGNED_OUT' && router.replace('/admin/dang-nhap'))
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => setMenu(false), [path])

  async function signOut() {
    await supabaseBrowser().auth.signOut()
    router.replace('/admin/dang-nhap')
  }

  if (state === 'loading') return <div className="grid min-h-[100svh] place-items-center meta">Đang tải…</div>
  if (state === 'denied')
    return (
      <div className="grid min-h-[100svh] place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl">Tài khoản chưa được cấp quyền quản trị.</p>
          <button onClick={signOut} className="btn-line mt-6">Đăng xuất</button>
        </div>
      </div>
    )

  const isAdmin = profile?.role === 'admin'
  const links = NAV.filter((n) => !n.admin || isAdmin)
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href))

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Quản trị">
      {links.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`rounded-xl px-3.5 py-2.5 text-[0.9375rem] transition-colors ${active(n.href) ? 'bg-veil text-ink' : 'text-veil/75 hover:bg-veil/10 hover:text-veil'}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )

  const footer = (
    <div className="border-t border-veil/15 pt-4 text-[0.875rem]">
      <p className="truncate">{profile?.full_name || profile?.email}</p>
      <p className="text-veil/50">{isAdmin ? 'Quản trị viên' : 'Nhân sự nội dung'}</p>
      <div className="mt-3 flex gap-4">
        <Link href="/" target="_blank" className="text-veil/70 underline-offset-4 hover:underline">Xem website</Link>
        <button onClick={signOut} className="text-veil/70 underline-offset-4 hover:underline">Đăng xuất</button>
      </div>
    </div>
  )

  return (
    <StaffCtx.Provider value={profile}>
      <div className="min-h-[100svh] lg:grid lg:grid-cols-[260px_1fr]">
        {/* Thanh bên — máy tính */}
        <aside className="sticky top-0 hidden h-[100svh] flex-col justify-between bg-ink p-5 text-veil lg:flex">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="Darla" className="mb-8 ml-2 mt-2 h-9 w-auto" />
            {nav}
          </div>
          {footer}
        </aside>

        {/* Thanh trên — điện thoại */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-ink px-5 py-3.5 text-veil lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Darla" className="h-8 w-auto" />
          <button onClick={() => setMenu(!menu)} aria-expanded={menu} className="rounded-full border border-veil/30 px-4 py-1.5 text-[0.875rem]">
            {menu ? 'Đóng' : 'Menu'}
          </button>
        </header>
        {menu && (
          <div className="fixed inset-x-0 bottom-0 top-[60px] z-30 flex flex-col justify-between bg-ink p-5 text-veil lg:hidden">
            {nav}
            {footer}
          </div>
        )}

        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-[1100px]">{children}</div>
        </main>
      </div>
    </StaffCtx.Provider>
  )
}
