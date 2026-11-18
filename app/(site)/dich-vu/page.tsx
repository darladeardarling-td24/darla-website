import type { Metadata } from 'next'
import InstaButton from '@/components/site/InstaButton'
import ServiceGroups from '@/components/site/ServiceGroups'
import { getServices, getSettings } from '@/lib/data'

export const metadata: Metadata = { title: 'Makeup & rạp cưới' }

export default async function ServicesPage() {
  const [services, s] = await Promise.all([getServices(), getSettings()])
  return (
    <section className="wrap pt-6 sm:pt-10">
      <div className="mb-14 grid gap-6 border-b border-ink/15 pb-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
        <h1 className="display-xl">Makeup &amp; rạp cưới</h1>
        <p className="max-w-[40ch] text-[1.0625rem] leading-7 text-ink/80 md:justify-self-end">
          Giá dưới đây là giá khởi điểm. Darla báo giá chính xác sau khi biết ngày cưới, địa điểm và số lượng khách.
        </p>
      </div>
      <ServiceGroups services={services} withImages />
      <div className="mt-14">
        <InstaButton handle={s.instagram} label="Nhận báo giá qua Instagram" />
      </div>
    </section>
  )
}
