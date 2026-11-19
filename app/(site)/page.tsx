import Link from 'next/link'
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
  const [s, products, categories, offers, services, hero, collections] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getOffers(),
    getServices(),
    getHero(),
    getCollections(),
  ])
  const t = hero.tone
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

      {/* ---------- Lời mở: chữ thay cho ảnh ---------- */}
      <section className="wrap pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <p className="meta lg:pt-3">Về chúng tôi</p>
          <p className="max-w-[30ch] font-display leading-[1.28] tracking-[-0.015em] text-ink" style={{ fontSize: 'clamp(1.6rem, 2.9vw, 2.9rem)' }}>
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
                  {c.cols.length > 0 && <span className="hidden font-display text-[1rem] italic text-ink/80 sm:block">{c.cols.map((x) => x.name).join(', ')}</span>}
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
