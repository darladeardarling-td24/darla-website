import Link from 'next/link'
import type { Settings } from '@/lib/types'
import { instagramHandle } from '@/lib/format'
import InstaButton from './InstaButton'
import { NAV } from './nav'

export default function Footer({ s }: { s: Settings }) {
  const ig = instagramHandle(s.instagram)
  return (
    <footer id="lien-he" className="wrap pb-6 pt-16 sm:pt-24">
      <div className="overflow-hidden rounded-[28px] bg-ink text-veil">
        <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:p-16">
          <div>
            <p className="display-lg max-w-[12ch]">Thấy mình trong một chiếc váy?</p>
            <p className="mt-6 max-w-md text-[1.0625rem] leading-7 text-veil/70">
              Gửi tên hoặc mã váy cho Darla qua Instagram. Chúng tôi trả lời trong ngày và hẹn lịch thử váy tại showroom.
            </p>
            <div className="mt-8">
              <InstaButton handle={s.instagram} className="btn-veil" />
            </div>
          </div>
          <dl className="grid content-end gap-6 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <dt className="text-veil/50">Showroom</dt>
              <dd className="mt-1">{s.address}</dd>
            </div>
            <div>
              <dt className="text-veil/50">Giờ mở cửa</dt>
              <dd className="mt-1">{s.hours}</dd>
            </div>
            <div>
              <dt className="text-veil/50">Điện thoại</dt>
              <dd className="mt-1">
                <a href={`tel:${(s.phone || '').replace(/\s/g, '')}`} className="hover:text-mink">{s.phone}</a>
              </dd>
            </div>
            {ig && (
              <div>
                <dt className="text-veil/50">Instagram</dt>
                <dd className="mt-1">
                  <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="hover:text-mink">@{ig}</a>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-veil/15 px-7 py-5 text-[0.875rem] sm:px-12 lg:px-16">
          {NAV.slice(0, 3).map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-mink">{n.label}</Link>
          ))}
          <span className="ml-auto text-veil/40">© {new Date().getFullYear()} Darla Dear Darling</span>
        </div>
      </div>
      <p
        className="select-none text-center font-display leading-[0.78] tracking-[0.06em] text-ink"
        style={{ fontSize: 'clamp(5rem, 24.5vw, 22rem)', marginTop: '0.12em' }}
        aria-hidden
      >
        DARLA
      </p>
    </footer>
  )
}
