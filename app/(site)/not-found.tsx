import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="wrap py-24 text-center">
      <p className="display-xl">404</p>
      <p className="mt-6 text-[1.0625rem]">Trang này không còn hoặc đã đổi địa chỉ.</p>
      <Link href="/bo-suu-tap" className="btn-ink mt-8">Về bộ sưu tập</Link>
    </section>
  )
}
