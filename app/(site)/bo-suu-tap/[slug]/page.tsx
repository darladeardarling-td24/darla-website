import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Gallery from '@/components/site/Gallery'
import InstaButton from '@/components/site/InstaButton'
import ProductList from '@/components/site/ProductList'
import { ATTR_KINDS, attrSlug, attrsByKind } from '@/lib/attributes'
import { getAttributes, getCategories, getCollections, getProduct, getProducts, getSettings } from '@/lib/data'
import { formatPrice } from '@/lib/format'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProduct((await params).slug)
  if (!p) return { title: 'Không tìm thấy' }
  return {
    title: `${p.name} ${p.code ?? ''}`.trim(),
    description: p.short_desc ?? undefined,
    openGraph: p.images[0] ? { images: [p.images[0].url] } : undefined,
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const [p, s, categories, all, collections, attributes] = await Promise.all([
    getProduct(slug),
    getSettings(),
    getCategories(),
    getProducts(),
    getCollections(),
    getAttributes(),
  ])
  if (!p) notFound()
  const cat = categories.find((c) => c.id === p.category_id)
  const col = collections.find((c) => c.id === p.collection_id)
  // Gợi ý: ưu tiên váy cùng bộ sưu tập, sau đó cùng danh mục
  const sameCol = col ? all.filter((x) => x.id !== p.id && x.collection_id === col.id) : []
  const sameCat = all.filter((x) => x.id !== p.id && x.category_id === p.category_id && !sameCol.includes(x))
  const related = [...sameCol, ...sameCat].slice(0, 4)
  const byKind = attrsByKind(p, attributes)
  const message = `Chào Darla, mình muốn được tư vấn váy ${p.name}${p.code ? ` (mã ${p.code})` : ''}.`

  // Thông số: lấy từ lựa chọn lọc; nếu váy chưa gắn thì dùng chữ nhập tay cũ
  const specs: { label: string; items: { name: string; href?: string }[] }[] = ATTR_KINDS.map((k) => {
    const list = byKind[k.kind]
    if (list?.length) return { label: k.label, items: list.map((a) => ({ name: a.name, href: `/bo-suu-tap?${k.param}=${attrSlug(a)}` })) }
    const legacy = k.kind === 'silhouette' ? p.silhouette : k.kind === 'material' ? p.material : null
    return { label: k.label, items: legacy ? [{ name: legacy }] : [] }
  }).filter((x) => x.items.length > 0)
  if (p.sizes) specs.push({ label: 'Size', items: [{ name: p.sizes }] })

  return (
    <>
      <article className="wrap pt-4 sm:pt-8">
        <nav className="meta mb-6" aria-label="Đường dẫn">
          <Link href="/bo-suu-tap" className="hover:text-ink">Bộ sưu tập</Link>
          {cat && (
            <>
              {' / '}
              <Link href={`/bo-suu-tap?danh-muc=${cat.slug}`} className="hover:text-ink">{cat.name}</Link>
            </>
          )}
          {col && (
            <>
              {' / '}
              <Link href={`/bo-suu-tap?bst=${col.slug}`} className="hover:text-ink">{col.name}</Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <Gallery images={p.images} name={p.name} />

          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="meta">
              {p.code}
              {col && (
                <>
                  {'  '}
                  <Link href={`/bo-suu-tap?bst=${col.slug}`} className="ml-2 underline underline-offset-4 hover:text-ink">
                    Bộ sưu tập {col.name}
                  </Link>
                </>
              )}
            </p>
            <h1 className="display-lg mt-2">{p.name}</h1>
            {p.short_desc && <p className="mt-5 text-[1.0625rem] leading-7 text-ink/80">{p.short_desc}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/15 bg-ink/15">
              <div className="bg-oyster p-4 sm:p-5">
                <dt className="meta">Giá thuê</dt>
                <dd className="mt-1 whitespace-nowrap font-display text-[1.3rem] leading-tight sm:text-[1.75rem]">{formatPrice(p.price_rent)}</dd>
                {p.price_note && <dd className="meta mt-1">{p.price_note}</dd>}
              </div>
              <div className="bg-oyster p-4 sm:p-5">
                <dt className="meta">Giá bán / may đo</dt>
                <dd className="mt-1 whitespace-nowrap font-display text-[1.3rem] leading-tight sm:text-[1.75rem]">{formatPrice(p.price_sale)}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <InstaButton handle={s.instagram} message={message} label="Tư vấn mẫu này qua Instagram" />
            </div>

            {specs.length > 0 && (
              <dl className="mt-10 border-b border-ink/15">
                {specs.map((sp) => (
                  <div key={sp.label} className="grid grid-cols-[8rem_1fr] gap-4 border-t border-ink/15 py-3.5 text-[0.9375rem]">
                    <dt className="text-taupe">{sp.label}</dt>
                    <dd className="flex flex-wrap gap-x-1">
                      {sp.items.map((it, i) => (
                        <span key={it.name}>
                          {it.href ? (
                            <Link href={it.href} className="underline decoration-ink/25 underline-offset-4 hover:decoration-ink">{it.name}</Link>
                          ) : (
                            it.name
                          )}
                          {i < sp.items.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {p.description && (
              <div className="mt-8 max-w-[60ch] whitespace-pre-line text-[1rem] leading-7 text-ink/85">{p.description}</div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="wrap pt-24" aria-labelledby="related">
          <h2 id="related" className="display-md mb-8">{col && sameCol.length ? `Cùng bộ sưu tập ${col.name}` : `Cùng dòng ${cat?.name.toLowerCase() ?? ''}`}</h2>
          <ProductList products={related} categories={categories} collections={collections} view="grid" />
        </section>
      )}
    </>
  )
}

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ slug: p.slug }))
}
