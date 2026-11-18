import type { Metadata } from 'next'
import ProductList from '@/components/site/ProductList'
import { getCategories, getProducts, getSettings } from '@/lib/data'

export const metadata: Metadata = { title: 'Bộ sưu tập' }

export default async function CollectionPage() {
  const [products, categories, s] = await Promise.all([getProducts(), getCategories(), getSettings()])
  return (
    <section className="wrap pb-10 pt-6 sm:pt-10">
      <div className="mb-12 grid gap-6 border-b border-ink/15 pb-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end sm:mb-14">
        <h1 className="display-xl">Bộ sưu tập</h1>
        <p className="max-w-[40ch] text-[1.0625rem] leading-7 text-ink/80 md:justify-self-end">
          {s.season_label}. {products.length} mẫu váy cưới, váy đi bàn, áo dài và vest. Chọn một mẫu để xem ảnh, giá thuê và chất liệu.
        </p>
      </div>
      <ProductList products={products} categories={categories} />
    </section>
  )
}
