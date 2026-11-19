import Link from 'next/link'
import HeroFrame from '@/components/site/HeroFrame'
import InstaButton from '@/components/site/InstaButton'
import Marquee from '@/components/site/Marquee'
import Media from '@/components/site/Media'
import OfferCards from '@/components/site/OfferCards'
import NameIndex from '@/components/site/NameIndex'
import StickyCta from '@/components/site/StickyCta'
import { activeOffers, getCategories, getCollections, getHero, getOffers, getProducts, getServices, getSettings } from '@/lib/data'
import { shortPrice } from '@/lib/format'
import { SERVICE_KINDS } from '@/lib/types'

// Màu chữ & lớp phủ theo độ sáng ảnh: 'ink' = ảnh sáng → chữ đen, 'veil' = ảnh tối → chữ trắng
// Màu chữ phần mở đầu (chọn trong admin → Ảnh trang chủ): be latte hoặc đen
const TONES = {
  sand: { title: 'text-latte', sub: 'text-mocha', btn: 'bg-mocha text-veil hover:bg-latte', rule: 'border-latte/25' },
  ink: { title: 'text-ink', sub: 'text-ink/70', btn: 'bg-mocha text-veil hover:bg-latte', rule: 'border-ink/15' },
}

export default async function HomePage() {
  const [s, products, categories, offers, services, hero, collections] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getOffers(),
    getServices(),
    getHero(),
    getCollections(),
  ])
  const tone = TONES[hero.tone.desktop === 'ink' ? 'ink' : 'sand']
  const live = activeOffers(offers).slice(0, 3)
  const minOf = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x !== null)
    return v.length ? Math.min(...v) : null
  }
  // Mục lục: mỗi danh mục kèm số mẫu và giá thuê thấp nhất
  const cats = categories
    .map((c) => {
      const items = products.filter((p) => p.category_id === c.id)
      const cols = collections.filter((x) => x.category_id === c.id && items.some((p) => p.collection_id === x.id))
      return { ...c, count: items.length, from: minOf(items.map((p) => p.price_rent)), cols }
    })
    .filter((c) => c.count > 0)
  // Bộ sưu tập mới ra (có ít nhất một mẫu)
  const fresh = collections
    .filter((c) => c.is_new)
    .map((c) => ({ ...c, count: products.filter((p) => p.collection_id === c.id).length, cat: categories.find((k) => k.id === c.category_id) }))
    .filter((c) => c.count > 0)
  const serviceLines = (['makeup', 'venue', 'photo', 'other'] as const)
    .map((k) => {
      const items = services.filter((x) => x.kind === k)
      return { kind: k, label: SERVICE_KINDS[k], count: items.length, from: minOf(items.map((x) => x.price_from)) }
    })
    .filter((l) => l.count > 0)

  return (
    <>
      {/* ---------- Ảnh bìa: khung bo góc, logo & menu nằm trên ảnh, chuyển động nhẹ khi cuộn ---------- */}
      <section aria-label="Ảnh bìa">
        <div className="px-2 pt-2 sm:px-3 sm:pt-3">
          <HeroFrame className="h-[78svh] min-h-[480px] bg-stone sm:h-[86svh] sm:max-h-[980px] sm:min-h-[600px]">
            <div className="absolute inset-0 hidden sm:block">
              <Media img={hero.hero.image} focus={hero.hero.focus} alt={hero.hero.caption || 'Cô dâu trong váy cưới Darla'} variant="full" tone="stone" eager />
            </div>
            <div className="absolute inset-0 sm:hidden">
              <Media img={hero.mobile.image} focus={hero.mobile.focus} alt={hero.mobile.caption || 'Cô dâu trong váy cưới Darla'} variant="full" tone="stone" eager />
            </div>
            {/* Lớp sáng/tối rất nhẹ ở mép trên để logo và menu luôn rõ */}
            <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent ${hero.tone.desktop === 'veil' ? 'from-black/35' : 'from-white/45'}`} />
          </HeroFrame>
        </div>

        {/* Chữ đặt dưới ảnh, kiểu trang mở đầu tạp chí */}
        <div className="hero-rise wrap relative pb-16 pt-8 sm:pb-24 sm:pt-12">
          <div className={`flex items-center justify-between gap-4 border-b pb-4 text-[0.8125rem] ${tone.rule} ${tone.sub}`}>
            <span className="flex items-center gap-3">
              <span className="h-px w-8 bg-current" />
              {s.season_label}
            </span>
            <span className="hidden sm:inline">{products.length} mẫu đang có tại showroom</span>
          </div>

          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <h1
              className={`max-w-[14ch] font-display font-normal leading-[1] tracking-[-0.035em] ${tone.title}`}
              style={{ fontSize: 'clamp(2.6rem, 5.6vw + 0.5rem, 7.5rem)' }}
            >
              {s.hero_title}
            </h1>
            <div>
              <p className={`max-w-[38ch] text-[0.9375rem] leading-[1.75] sm:text-[1rem] ${tone.sub}`}>{s.hero_subtitle}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-7">
                <Link href="/bo-suu-tap" className={`rounded-full px-6 py-3 text-[0.875rem] font-medium transition-colors ${tone.btn}`}>
                  Xem bộ sưu tập
                </Link>
                <InstaButton
                  handle={s.instagram}
                  label="Tư vấn qua Instagram"
                  className={`inline-flex items-center gap-2 text-[0.875rem] font-medium underline underline-offset-[6px] transition-opacity hover:opacity-60 ${tone.sub}`}
                />
              </div>
            </div>
            {hero.detail?.image && (
              <figure className="hidden w-[150px] lg:block xl:w-[170px]">
                <div className="aspect-[3/4] overflow-hidden rounded-xl">
                  <Media img={hero.detail.image} focus={hero.detail.focus} alt={hero.detail.caption || 'Chi tiết váy'} variant="full" />
                </div>
                {hero.detail.caption && <figcaption className={`mt-2 text-[0.75rem] leading-5 ${tone.sub}`}>{hero.detail.caption}</figcaption>}
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Lời mở: chữ thay cho ảnh ---------- */}
      <section className="wrap pb-16 sm:pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <p className="meta lg:pt-3">Về chúng tôi</p>
          <p className="max-w-[30ch] font-display leading-[1.28] tracking-[-0.015em] text-mocha" style={{ fontSize: 'clamp(1.6rem, 2.9vw, 2.9rem)' }}>
            {s.about}
          </p>
        </div>
      </section>

      {/* ---------- Mục lục bộ sưu tập: lối vào chính ---------- */}
      <section className="wrap pb-20 sm:pb-28" aria-labelledby="index">
        <div className="mb-6 flex items-end justify-between gap-6 sm:mb-8">
          <h2 id="index" className="meta">Bộ sưu tập</h2>
          <Link href="/bo-suu-tap" className="meta underline underline-offset-4 hover:text-ink">Xem tất cả {products.length} mẫu</Link>
        </div>
        <ul className="border-b border-ink/15">
          {cats.map((c) => (
            <li key={c.id} className="border-t border-ink/15">
              <Link href={`/bo-suu-tap?danh-muc=${c.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-5 sm:py-7">
                <span
                  className="font-display font-normal leading-[0.98] tracking-[-0.035em] transition-[letter-spacing] duration-500 group-hover:italic group-hover:tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(2.75rem, 8.2vw, 8rem)' }}
                >
                  {c.name}
                </span>
                <span className="text-right text-[0.875rem] leading-6 text-taupe">
                  <span className="block text-ink">{c.count} mẫu</span>
                  {c.from !== null && <span className="block">thuê từ {shortPrice(c.from)}</span>}
                  {c.cols.length > 0 && <span className="hidden font-display text-[1rem] italic sm:block">{c.cols.map((x) => x.name).join(', ')}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 sm:mt-12">
          <Link href="/bo-suu-tap" className="btn bg-mocha text-veil hover:bg-latte">Xem tất cả {products.length} mẫu váy</Link>
        </div>
      </section>

      {/* ---------- Bộ sưu tập mới ra ---------- */}
      {fresh.length > 0 && (
        <section className="bg-veil py-20 sm:py-28" aria-labelledby="fresh">
          <div className="wrap">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
              <h2 id="fresh" className="meta">Mới ra</h2>
              <ul className="space-y-10 sm:space-y-12">
                {fresh.map((c) => (
                  <li key={c.id}>
                    <Link href={`/bo-suu-tap?bst=${c.slug}`} className="group block">
                      <span className="meta block">
                        {c.cat?.name}, {c.count} mẫu
                      </span>
                      <span
                        className="mt-1 block font-display italic leading-[0.95] tracking-[-0.035em] transition-opacity group-hover:opacity-60"
                        style={{ fontSize: 'clamp(3.25rem, 9vw, 9rem)' }}
                      >
                        {c.name}
                      </span>
                      {c.tagline && <span className="mt-3 block max-w-[40ch] text-[1rem] leading-7 text-ink/75">{c.tagline}</span>}
                      <span className="mt-4 inline-block text-[0.875rem] font-medium underline underline-offset-[6px]">Xem bộ sưu tập {c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <Marquee text={s.marquee} />

      {/* ---------- Tên các mẫu váy ---------- */}
      <section className="wrap py-20 sm:py-28" aria-labelledby="names">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <div>
            <h2 id="names" className="meta">Những cái tên của mùa này</h2>
            <p className="meta mt-2 hidden max-w-[22ch] lg:block">Rê chuột vào tên để xem váy, bấm để xem giá và chất liệu.</p>
          </div>
          <NameIndex products={products} />
        </div>
      </section>

      {/* ---------- Ưu đãi ---------- */}
      {live.length > 0 && (
        <section className="dark-surface bg-ink py-20 text-veil sm:py-28" aria-labelledby="offers">
          <div className="wrap">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 id="offers" className="display-xl">Ưu đãi đang có</h2>
              <Link href="/uu-dai" className="btn-veil">Xem điều kiện</Link>
            </div>
            <OfferCards offers={live} />
          </div>
        </section>
      )}

      {/* ---------- Makeup & rạp cưới: gọn trong hai dòng ---------- */}
      <section className="wrap py-20 sm:py-28" aria-labelledby="services">
        <h2 id="services" className="meta mb-6 sm:mb-8">Trọn một ngày cưới</h2>
        <ul className="border-b border-ink/15">
          {serviceLines.map((l) => (
            <li key={l.kind} className="border-t border-ink/15">
              <Link href="/dich-vu" className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-5 sm:py-6">
                <span className="font-display leading-none tracking-[-0.025em] group-hover:italic" style={{ fontSize: 'clamp(1.9rem, 4.4vw, 4rem)' }}>
                  {l.label}
                </span>
                <span className="text-right text-[0.875rem] text-taupe">{l.from !== null ? `từ ${shortPrice(l.from)}` : 'Báo giá riêng'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <StickyCta count={products.length} />
    </>
  )
}
