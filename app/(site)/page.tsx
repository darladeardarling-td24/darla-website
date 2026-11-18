import Link from 'next/link'
import InstaButton from '@/components/site/InstaButton'
import Marquee from '@/components/site/Marquee'
import Media from '@/components/site/Media'
import OfferCards from '@/components/site/OfferCards'
import ProductList from '@/components/site/ProductList'
import ServiceGroups from '@/components/site/ServiceGroups'
import { activeOffers, getCategories, getHomeMedia, getOffers, getProducts, getServices, getSettings } from '@/lib/data'
import type { HomeMedia, HomeSlot } from '@/lib/home-slots'
import type { Img } from '@/lib/types'

export default async function HomePage() {
  const [s, products, categories, offers, services, media] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getOffers(),
    getServices(),
    getHomeMedia(),
  ])
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
  const hero = pick('hero', 0)
  const heroMobile = media.hero_mobile ?? hero
  const detail = media.hero_detail ?? (s.hero_image ? { slot: 'hero_detail' as const, image: s.hero_image, focus: 'center' as const, caption: null } : null)
  const looks = [pick('look_1', 1), pick('look_2', 2), pick('look_3', 3)]
  const newest = products.filter((p) => p.images[0]).slice(0, 3)

  return (
    <>
      {/* ---------- Ảnh lớn đầu trang ---------- */}
      <section className="wrap">
        <div className="relative isolate h-[82svh] min-h-[540px] overflow-hidden rounded-[28px] bg-ink text-veil sm:h-[calc(100svh-128px)] sm:max-h-[940px] sm:min-h-[600px]">
          <div className="absolute inset-0 -z-10 hidden sm:block">
            <Media img={hero.image} focus={hero.focus} alt={hero.caption || 'Cô dâu trong váy cưới'} variant="full" tone="dark" eager />
          </div>
          <div className="absolute inset-0 -z-10 sm:hidden">
            <Media img={heroMobile.image} focus={heroMobile.focus} alt={heroMobile.caption || 'Cô dâu trong váy cưới'} variant="full" tone="dark" eager />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />
          <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/40 via-transparent to-transparent sm:block" />

          <div className="flex h-full flex-col justify-between p-5 sm:p-9 lg:p-12">
            <div className="flex items-start justify-between gap-4 text-[0.875rem]">
              <p className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-veil" />
                {s.season_label}
              </p>
              <Link href="/bo-suu-tap" className="hidden text-veil/80 underline-offset-4 hover:text-veil hover:underline sm:block">
                {products.length} mẫu đang có tại showroom
              </Link>
            </div>

            <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <h1
                  className="max-w-[12ch] font-display font-normal leading-[0.94] tracking-tightest"
                  style={{ fontSize: 'clamp(3.1rem, 8.4vw + 0.6rem, 9rem)' }}
                >
                  {s.hero_title}
                </h1>
                <p className="mt-5 max-w-[44ch] text-[0.975rem] leading-7 text-veil/80 sm:text-[1.0625rem]">{s.hero_subtitle}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/bo-suu-tap" className="btn-veil">Xem bộ sưu tập</Link>
                  <InstaButton handle={s.instagram} label="Tư vấn qua Instagram" className="btn border border-veil/60 text-veil hover:bg-veil hover:text-ink" />
                </div>
              </div>

              {detail?.image && (
                <figure className="hidden w-[210px] lg:block xl:w-[240px]">
                  <div className="aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-veil/20">
                    <Media img={detail.image} focus={detail.focus} alt={detail.caption || 'Chi tiết váy'} variant="full" tone="dark" />
                  </div>
                  {detail.caption && <figcaption className="mt-2 text-[0.8125rem] text-veil/70">{detail.caption}</figcaption>}
                </figure>
              )}
            </div>
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
