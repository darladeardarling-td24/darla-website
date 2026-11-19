'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Nút "Xem bộ sưu tập" nổi ở cuối màn hình điện thoại sau khi khách cuộn qua ảnh đầu trang */
export default function StickyCta({ count }: { count: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const nearEnd = window.innerHeight + window.scrollY > document.body.scrollHeight - 700
      setShow(window.scrollY > window.innerHeight * 0.7 && !nearEnd)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 sm:hidden ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <Link href="/bo-suu-tap" className="flex w-full max-w-[360px] items-center justify-between rounded-full bg-mocha py-3.5 pl-6 pr-3 text-veil shadow-[0_12px_30px_-10px_rgba(0,0,0,0.4)]">
        <span className="text-[0.9375rem] font-medium">Xem bộ sưu tập</span>
        <span className="rounded-full bg-veil/15 px-3 py-1 text-[0.8125rem]">{count} mẫu</span>
      </Link>
    </div>
  )
}
