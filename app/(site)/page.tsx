import Link from 'next/link'
import InstaButton from '@/components/site/InstaButton'
import Marquee from '@/components/site/Marquee'
import Media from '@/components/site/Media'
import OfferCards from '@/components/site/OfferCards'
import ProductList from '@/components/site/ProductList'
import ServiceGroups from '@/components/site/ServiceGroups'
import { activeOffers, getCategories, getHero, getHomeMedia, getOffers, getProducts, getServices, getSettings } from '@/lib/data'
import type { HomeMedia, HomeSlot } from '@/lib/home-slots'
import type { Img } from '@/lib/types'

// Màu chữ & lớp phủ theo độ sáng ảnh: 'ink' = ảnh sáng → chữ đen, 'veil' = ảnh tối → chữ trắng
// 'sand' = chữ be latte (ảnh sáng), 'ink' = chữ đen (ảnh sáng), 'veil' = chữ trắng (ảnh tối)
const TXT = { sand: 'text-latte', ink: 'text-ink', veil: 'text-veil' }
const TXT_SM = { sand: 'sm:text-latte', ink: 'sm:text-ink', veil: 'sm:text-veil' }
const SUB = { sand: 'text-mocha', ink: 'text-ink/70', veil: 'text-veil/80' }
const SUB_SM = { sand: 'sm:text-mocha', ink: 'sm:text-ink/70', veil: 'sm:text-veil/80' }
const BTN = { sand: 'bg-mocha text-veil hover:bg-latte', ink: 'bg-ink text-veil hover:bg-ink/80', veil: 'bg-veil text-ink hover:bg-stone' }
const BTN_SM = {
  sand: 'sm:bg-mocha sm:text-veil sm:hover:bg-latte',
  ink: 'sm:bg-ink sm:text-veil sm:hover:bg-ink/80',
  veil: 'sm:bg-veil sm:text-ink sm:hover:bg-stone',
}
const SHADE_M = {
  sand: 'bg-[linear-gradient(to_top,rgba(234,227,214,1)_0%,rgba(234,227,214,0.88)_24%,rgba(234,227,214,0.35)_44%,rgba(234,227,214,0)_58%),linear-gradient(to_bottom,rgba(234,227,214,0.5)_0%,rgba(234,227,214,0)_14%)]',
  ink: 'bg-[linear-gradient(to_top,rgba(234,227,214,1)_0%,rgba(234,227,214,0.88)_24%,rgba(234,227,214,0.35)_44%,rgba(234,227,214,0)_58%),linear-gradient(to_bottom,rgba(234,227,214,0.5)_0%,rgba(234,227,214,0)_14%)]',
  veil: 'bg-[linear-gradient(to_top,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.35)_35%,rgba(0,0,0,0)_65%),linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_20%)]',
}
const SHADE_D = {
  sand: 'bg-[linear-gradient(to_right,rgba(234,227,214,0.88)_0%,rgba(234,227,214,0.55)_32%,rgba(234,227,214,0)_58%),linear-gradient(to_bottom,rgba(234,227,214,0.5)_0%,rgba(234,227,214,0)_16%)]',
  ink: 'bg-[linear-gradient(to_right,rgba(234,227,214,0.88)_0%,rgba(234,227,214,0.55)_32%,rgba(234,227,214,0)_58%),linear-gradient(to_bottom,rgba(234,227,214,0.5)_0%,rgba(234,227,214,0)_16%)]',
  veil: 'bg-[linear-gradient(to_right,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.25)_35%,rgba(0,0,0,0)_60%),linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_18%)]',
}

export default async function HomePage() {
  const [s, products, categories, offers, services, media, hero] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getOffers(),
    getServices(),
    getHomeMedia(),
    getHero(),
  ])
  const t = hero.tone
  const featured = products.filter((p) => p.is_featured).slice(0, 6)
  const list = featured.length ? featured : products.slice(0, 6)
  const live = activeOffers(offers).slice(0, 3)
  const year = new Date().getFullYear()

  // Ảnh trang chủ: ưu tiên ảnh chọn trong admin → Ảnh trang chủ, nếu trống thì lấy ảnh sản phẩm
  const productImgs: Img[] = list.flatMap((p) => p.images).concat(products.flatMap((p) => p.images))
  const pick = (slot: HomeSlot, fallbackIndex: number): HomeMedia => {
    const m = media[slot]
    return m ?? { slot, image: productImgs[fallbackIndex] ?? null, focus: 'center', caption: null }
  }
  const looks = [pick('look_1', 1), pick('look_2', 2), pick('look_3', 3)]
  const newest = products.filter((p) => p.images[0]).slice(0, 3)

  return (
    <>
      {/* ---------- Ảnh lớn đầu trang: tràn toàn màn hình, mép dưới tan vào nền be ---------- */}
      <section className="relative isolate h-[100svh] min-h-[620px] overflow-hidden sm:max-h-[1080px] sm:min-h-[680px]">
        <div className="absolute inset-0 -z-20 hidden sm:block">
          <Media img={hero.hero.image} focus={hero.hero.focus} alt={hero.hero.caption || 'Cô dâu trong váy cưới'} variant="full" tone="veil" eager />
        </div>
        <div className="absolute inset-0 -z-20 sm:hidden">
          <Media img={hero.mobile.image} focus={hero.mobile.focus} alt={hero.mobile.caption || 'Cô dâu trong váy cưới'} variant="full" tone="veil" eager />
        </div>

        {/* Lớp phủ: nhẹ ở trên cho logo, đậm dần về phía chữ, cuối cùng hoà vào nền trang */}
        <div className={`absolute inset-0 -z-10 sm:hidden ${SHADE_M[t.mobile]}`} />
        <div className={`absolute inset-0 -z-10 hidden sm:block ${SHADE_D[t.desktop]}`} />
        <div className={`absolute inset-x-0 bottom-0 -z-10 bg-gradient-to-t from-oyster via-oyster/60 to-transparent sm:h-[18%] ${t.mobile === 'veil' ? 'h-[6%]' : 'h-[22%]'}`} />

        <div className="wrap flex h-full flex-col justify-end pb-[5svh] sm:pb-[14svh]">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className={`${TXT[t.mobile]} ${TXT_SM[t.desktop]}`}>
              <p className={`flex items-center gap-3 text-[0.8125rem] tracking-[0.02em] ${SUB[t.mobile]} ${SUB_SM[t.desktop]}`}>
                <span className="h-px w-8 bg-current" />
                {s.season_label}
              </p>
              <h1
                className="mt-5 max-w-[13ch] font-display font-normal leading-[1.02] tracking-[-0.03em]"
                style={{ fontSize: 'clamp(2.5rem, 4.4vw + 0.9rem, 6.25rem)' }}
              >
                {s.hero_title}
              </h1>
              <p className={`mt-4 max-w-[36ch] text-[0.9375rem] leading-[1.7] sm:mt-5 sm:text-[1rem] ${SUB[t.mobile]} ${SUB_SM[t.desktop]}`}>{s.hero_subtitle}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-8">
                <Link href="/bo-suu-tap" className={`rounded-full px-6 py-3 text-[0.875rem] font-medium transition-colors ${BTN[t.mobile]} ${BTN_SM[t.desktop]}`}>
                  Xem bộ sưu tập
                </Link>
                <InstaButton
                  handle={s.instagram}
                  label="Tư vấn qua Instagram"
                  className={`inline-flex items-center gap-2 text-[0.875rem] font-medium underline underline-offset-[6px] transition-opacity hover:opacity-60 ${SUB[t.mobile]} ${SUB_SM[t.desktop]}`}
                />
              </div>
            </div>

            {hero.detail?.image && (
              <figure className={`hidden w-[180px] lg:block xl:w-[200px] ${TXT_SM[t.desktop]}`}>
                <div className="aspect-[3/4] overflow-hidden rounded-xl">
                  <Media img={hero.detail.image} focus={hero.detail.focus} alt={hero.detail.caption || 'Chi tiết váy'} variant="full" tone="veil" />
                </div>
                {hero.detail.caption && <figcaption className={`mt-2.5 text-[0.75rem] leading-5 ${SUB_SM[t.desktop]}`}>{hero.detail.caption}</figcaption>}
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Mẫu mới về ---------- */}
      {newest.length > 0 && (
        <section className="wrap">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-7 sm:py-9">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {newest.map((p) => (
                  <Link key={p.id} href={`/bo-suu-tap/${p.slug}`} className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-oyster sm:h-14 sm:w-14" aria-label={p.name}>
                    <Media img={p.images[0]} alt={p.name} />
                  </Link>
                ))}
              </div>
              <p className="text-[0.9375rem] leading-6">
                Mới về:{' '}
                {newest.map((p, i) => (
                  <span key={p.id}>
                    <Link href={`/bo-suu-tap/${p.slug}`} className="font-display text-[1.125rem] italic hover:underline">{p.name}</Link>
                    {i < newest.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
            <p className="meta">{s.hours}</p>
          </div>
        </section>
      )}

      <Marquee text={s.marquee} />

      {/* ---------- Lookbook ---------- */}
      <section className="wrap py-20 sm:py-28" aria-labelledby="lookbook">
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-12 lg:gap-y-10">
          <figure className="order-2 col-span-2 lg:order-none lg:col-span-4 lg:row-span-2">
            <div className="aspect-[3/4] overflow-hidden rounded-[22px]">
              <Media img={looks[0].image} focus={looks[0].focus} alt={looks[0].caption || 'Lookbook'} variant="full" />
            </div>
            {looks[0].caption && <figcaption className="meta mt-3">{looks[0].caption}</figcaption>}
          </figure>

          <div className="order-1 col-span-2 lg:order-none lg:col-span-8 lg:pl-6">
            <h2 id="lookbook" className="display-lg">{s.season_label}</h2>
            <p className="mt-6 max-w-[52ch] font-display text-[1.25rem] leading-[1.6] text-ink/85 sm:text-[1.4375rem]">{s.about}</p>
            <Link href="/bo-suu-tap" className="btn-line mt-8">Xem bộ sưu tập</Link>
          </div>

          <figure className="relative order-3 lg:order-none lg:col-span-5 lg:col-start-5 lg:pl-6 lg:pt-6">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] lg:aspect-[4/3]">
              <Media img={looks[1].image} focus={looks[1].focus} alt={looks[1].caption || 'Lookbook'} variant="full" />
              <span
                className="text-outline-veil pointer-events-none absolute -bottom-[0.18em] right-[0.06em] font-display italic leading-none tracking-tightest"
                style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)' }}
                aria-hidden
              >
                ©{String(year).slice(2)}
              </span>
            </div>
            {looks[1].caption && <figcaption className="meta mt-3">{looks[1].caption}</figcaption>}
          </figure>

          <figure className="order-4 mt-10 lg:order-none lg:col-span-3 lg:mt-24">
            <div className="aspect-[3/4] overflow-hidden rounded-[22px]">
              <Media img={looks[2].image} focus={looks[2].focus} alt={looks[2].caption || 'Lookbook'} variant="full" />
            </div>
            {looks[2].caption && <figcaption className="meta mt-3">{looks[2].caption}</figcaption>}
          </figure>
        </div>
      </section>

      {/* ---------- Váy nổi bật ---------- */}
      <section className="wrap pb-20 sm:pb-28" aria-labelledby="featured">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink/15 pt-14 sm:mb-14 sm:pt-20">
          <h2 id="featured" className="display-lg max-w-[14ch]">Những mẫu được hỏi nhiều nhất</h2>
          <Link href="/bo-suu-tap" className="btn-line">Toàn bộ {products.length} mẫu</Link>
        </div>
        <ProductList products={list.slice(0, 4)} categories={categories} filters={false} initialView="grid" />
      </section>

      {/* ---------- Ưu đãi ---------- */}
      {live.length > 0 && (
        <section className="bg-ink py-20 text-veil sm:py-28" aria-labelledby="offers">
          <div className="wrap">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 id="offers" className="display-xl">Ưu đãi đang có</h2>
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
            Ngoài váy, chúng tôi nhận trang điểm cô dâu và dựng rạp cưới, để cả ngày của bạn chung một tinh thần.
          </p>
        </div>
        <ServiceGroups services={services} />
      </section>
    </>
  )
}
