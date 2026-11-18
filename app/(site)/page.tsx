import Link from 'next/link'
import InstaButton from '@/components/site/InstaButton'
import Marquee from '@/components/site/Marquee'
import Media from '@/components/site/Media'
import OfferCards from '@/components/site/OfferCards'
import ProductList from '@/components/site/ProductList'
import ServiceGroups from '@/components/site/ServiceGroups'
import { activeOffers, getCategories, getOffers, getProducts, getServices, getSettings } from '@/lib/data'

export default async function HomePage() {
  const [s, products, categories, offers, services] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getOffers(),
    getServices(),
  ])
  const featured = products.filter((p) => p.is_featured).slice(0, 6)
  const list = featured.length ? featured : products.slice(0, 6)
  const heroImg = s.hero_image ?? list.find((p) => p.images[0])?.images[0] ?? null
  const coverImg = list.find((p) => p.images[1])?.images[1] ?? list[1]?.images[0] ?? heroImg
  const year = new Date().getFullYear().toString().slice(2)
  const live = activeOffers(offers).slice(0, 3)

  return (
    <>
      {/* ---------- Mở đầu ---------- */}
      <section className="wrap pb-10 pt-6 sm:pt-10 lg:pb-16">
        <h1 className="display-xl">
          <span className="flex items-center gap-[0.18em]">
            <span>Dear</span>
            <span className="inline-block h-[0.72em] w-[1.55em] overflow-hidden rounded-full align-middle">
              <Media img={heroImg} alt="Cô dâu trong váy Darla" variant="full" eager />
            </span>
          </span>
          <span className="block pl-[0.9em] italic">Darling,</span>
          <span className="sr-only">{s.hero_title}</span>
        </h1>

        <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14 lg:mt-14">
          <p className="display-md max-w-[16ch]" aria-hidden>{s.hero_title}</p>
          <div className="flex flex-col justify-between gap-8">
            <p className="max-w-[46ch] text-[1.0625rem] leading-7 text-ink/80">{s.hero_subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/bo-suu-tap" className="btn-ink">Xem bộ sưu tập</Link>
              <InstaButton handle={s.instagram} label="Tư vấn qua Instagram" className="btn-line" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ảnh bìa mùa cưới ---------- */}
      <section className="wrap">
        <div className="relative overflow-hidden rounded-[28px] bg-ink text-veil">
          <div className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8]">
            <Media img={coverImg} alt="Bộ sưu tập mới của Darla" variant="full" tone="dark" className="opacity-90" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <p
            className="text-outline-veil pointer-events-none absolute -right-[0.04em] top-[0.02em] font-display italic leading-none tracking-tightest"
            style={{ fontSize: 'clamp(7rem, 30vw, 26rem)' }}
            aria-hidden
          >
            ©{year}
          </p>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
            <div>
              <p className="text-[0.875rem] text-veil/70">{s.season_label}</p>
              <p className="mt-2 font-display text-[2rem] leading-[1.05] sm:text-[3rem]">
                {list.slice(0, 3).map((p) => p.name).join(', ')}
              </p>
            </div>
            <Link href="/bo-suu-tap" className="btn-veil self-start sm:self-auto">Xem từng mẫu váy</Link>
          </div>
        </div>
      </section>

      {/* ---------- Giới thiệu ngắn ---------- */}
      <section className="wrap py-20 sm:py-28">
        <div className="mx-auto max-w-[34rem] text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="" className="mx-auto h-12 w-auto opacity-90 sm:h-14" />
          <p className="mt-8 font-display text-[1.375rem] leading-[1.55] sm:text-[1.625rem]">{s.about}</p>
        </div>
      </section>

      <Marquee text={s.marquee} />

      {/* ---------- Váy nổi bật ---------- */}
      <section className="wrap py-20 sm:py-28" aria-labelledby="featured">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
          <h2 id="featured" className="display-lg max-w-[14ch]">Những mẫu được hỏi nhiều nhất</h2>
          <Link href="/bo-suu-tap" className="btn-line">Toàn bộ {products.length} mẫu</Link>
        </div>
        <ProductList products={list} categories={categories} filters={false} />
      </section>

      {/* ---------- Ưu đãi ---------- */}
      {live.length > 0 && (
        <section className="bg-ink py-20 text-veil sm:py-28" aria-labelledby="offers">
          <div className="wrap">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 id="offers" className="display-xl">
                Ưu đãi đang có
              </h2>
              <Link href="/uu-dai" className="btn-veil">Xem điều kiện</Link>
            </div>
            <OfferCards offers={live} />
          </div>
        </section>
      )}

      {/* ---------- Makeup & rạp cưới ---------- */}
      <section className="wrap py-20 sm:py-28" aria-labelledby="services">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <h2 id="services" className="display-lg max-w-[12ch]">Trọn một ngày cưới</h2>
          <p className="max-w-[44ch] text-[1.0625rem] leading-7 text-ink/80 md:justify-self-end">
            Ngoài váy, Darla nhận trang điểm cô dâu và dựng rạp cưới, để cả ngày của bạn chung một tinh thần.
          </p>
        </div>
        <ServiceGroups services={services} />
      </section>
    </>
  )
}
