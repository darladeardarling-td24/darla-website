import type { Metadata } from 'next'
import Catalog from '@/components/site/Catalog'
import { getAttributes, getCategories, getCollections, getProducts, getSettings } from '@/lib/data'

export const metadata: Metadata = { title: 'Bộ sưu tập' }

export default async function CollectionPage() {
  const [products, categories, collections, attributes, s] = await Promise.all([
    getProducts(),
    getCategories(),
    getCollections(),
    getAttributes(),
    getSettings(),
  ])
  return (
    <section className="wrap pb-10 pt-6 sm:pt-10">
      <div className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end sm:mb-12">
        <h1 className="display-xl">Bộ sưu tập</h1>
        <p className="max-w-[40ch] text-[1.0625rem] leading-7 text-ink/80 md:justify-self-end">
          {s.season_label}. Chọn danh mục, bộ sưu tập rồi lọc theo dáng váy, chất liệu, kiểu cổ hay dịp cưới để tìm chiếc váy hợp với bạn.
        </p>
      </div>
      <Catalog products={products} categories={categories} collections={collections} attributes={attributes} />
    </section>
  )
}
