import type { Metadata } from 'next'
import InstaButton from '@/components/site/InstaButton'
import OfferCards from '@/components/site/OfferCards'
import { activeOffers, getOffers, getSettings } from '@/lib/data'

export const metadata: Metadata = { title: 'Ưu đãi' }

export default async function OffersPage() {
  const [offers, s] = await Promise.all([getOffers(), getSettings()])
  const live = activeOffers(offers)
  return (
    <section className="dark-surface bg-ink pb-20 pt-14 text-veil sm:pb-28 sm:pt-20">
      <div className="wrap">
        <div className="mb-14 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
          <h1 className="display-xl">Ưu đãi</h1>
          <p className="max-w-[40ch] text-[1.0625rem] leading-7 text-veil/75 md:justify-self-end">
            Các chương trình đang áp dụng tại Darla. Nhắn Instagram để giữ ưu đãi cho ngày cưới của bạn.
          </p>
        </div>
        {live.length ? (
          <OfferCards offers={live} />
        ) : (
          <p className="border-y border-veil/15 py-16 text-center text-veil/70">Chưa có chương trình mới. Theo dõi Instagram của Darla để không bỏ lỡ.</p>
        )}
        <div className="mt-12">
          <InstaButton handle={s.instagram} label="Giữ ưu đãi qua Instagram" className="btn-veil" />
        </div>
      </div>
    </section>
  )
}
