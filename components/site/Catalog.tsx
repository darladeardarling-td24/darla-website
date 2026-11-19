'use client'
import { useEffect, useMemo, useState } from 'react'
import { ATTR_KINDS, PRICE_BUCKETS, attrSlug } from '@/lib/attributes'
import { formatDate } from '@/lib/format'
import type { Attribute, AttrKind, Category, Collection, Product } from '@/lib/types'
import ProductList from './ProductList'

type Props = { products: Product[]; categories: Category[]; collections: Collection[]; attributes: Attribute[] }
type Sort = '' | 'moi' | 'gia-tang' | 'gia-giam'
type Sel = Partial<Record<AttrKind, string[]>>

const SORTS: { id: Sort; label: string }[] = [
  { id: '', label: 'Gợi ý của Darla' },
  { id: 'moi', label: 'Mới nhất' },
  { id: 'gia-tang', label: 'Giá thuê tăng dần' },
  { id: 'gia-giam', label: 'Giá thuê giảm dần' },
]

/** Trang bộ sưu tập: danh mục → bộ sưu tập → bộ lọc. Trạng thái lọc ghi trên đường dẫn để gửi cho khách. */
export default function Catalog({ products, categories, collections, attributes }: Props) {
  const [cat, setCat] = useState('')
  const [bst, setBst] = useState('')
  const [sel, setSel] = useState<Sel>({})
  const [price, setPrice] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [sort, setSort] = useState<Sort>('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [panel, setPanel] = useState(false)
  const [ready, setReady] = useState(false)

  // Đọc bộ lọc từ đường dẫn khi mở trang
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    setCat(q.get('danh-muc') ?? '')
    setBst(q.get('bst') ?? '')
    setPrice(q.get('gia') ?? '')
    setOnlyNew(q.get('moi') === '1')
    setSort((q.get('sap-xep') as Sort) ?? '')
    const s: Sel = {}
    for (const k of ATTR_KINDS) {
      const v = q.get(k.param)
      if (v) s[k.kind] = v.split(',')
    }
    setSel(s)
    setReady(true)
  }, [])

  // Ghi bộ lọc lên đường dẫn
  useEffect(() => {
    if (!ready) return
    const q = new URLSearchParams()
    if (cat) q.set('danh-muc', cat)
    if (bst) q.set('bst', bst)
    for (const k of ATTR_KINDS) if (sel[k.kind]?.length) q.set(k.param, sel[k.kind]!.join(','))
    if (price) q.set('gia', price)
    if (onlyNew) q.set('moi', '1')
    if (sort) q.set('sap-xep', sort)
    const qs = q.toString().replace(/%2C/g, ',')
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [ready, cat, bst, sel, price, onlyNew, sort])

  useEffect(() => {
    document.body.style.overflow = panel && window.innerWidth < 640 ? 'hidden' : ''
  }, [panel])

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]))
  const colBySlug = Object.fromEntries(collections.map((c) => [c.slug, c]))
  const colById = Object.fromEntries(collections.map((c) => [c.id, c]))
  const attrById = useMemo(() => new Map(attributes.map((a) => [a.id, a])), [attributes])
  const activeCat = catBySlug[cat]
  const activeCol = colBySlug[bst]

  const isNew = (p: Product) => p.is_new || Boolean(p.collection_id && colById[p.collection_id]?.is_new)
  const slugsOf = (p: Product, kind: AttrKind) =>
    (p.attrs ?? []).map((id) => attrById.get(id)).filter((a): a is Attribute => !!a && a.kind === kind).map(attrSlug)

  // Phạm vi: danh mục + bộ sưu tập (để đếm lựa chọn lọc)
  const scope = products.filter((p) => (!activeCat || p.category_id === activeCat.id) && (!activeCol || p.collection_id === activeCol.id))

  const shown = useMemo(() => {
    let list = scope.filter((p) => {
      for (const k of ATTR_KINDS) {
        const want = sel[k.kind]
        if (want?.length && !slugsOf(p, k.kind).some((s) => want.includes(s))) return false
      }
      if (price) {
        const b = PRICE_BUCKETS.find((x) => x.id === price)
        if (b && (p.price_rent === null || p.price_rent < b.min || p.price_rent >= b.max)) return false
      }
      if (onlyNew && !isNew(p)) return false
      return true
    })
    const val = (p: Product) => p.price_rent ?? Number.MAX_SAFE_INTEGER
    if (sort === 'gia-tang') list = [...list].sort((a, b) => val(a) - val(b))
    if (sort === 'gia-giam') list = [...list].sort((a, b) => (b.price_rent ?? -1) - (a.price_rent ?? -1))
    if (sort === 'moi') list = [...list].sort((a, b) => Number(isNew(b)) - Number(isNew(a)) || (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, sel, price, onlyNew, sort])

  // Lựa chọn lọc có trong phạm vi hiện tại, kèm số mẫu
  const groups = ATTR_KINDS.map((k) => {
    const opts = attributes
      .filter((a) => a.kind === k.kind)
      .map((a) => ({ a, slug: attrSlug(a), count: scope.filter((p) => p.attrs?.includes(a.id)).length }))
      .filter((o) => o.count > 0)
    return { ...k, opts }
  }).filter((g) => g.opts.length > 0)

  const colsInScope = collections
    .filter((c) => !activeCat || c.category_id === activeCat.id)
    .map((c) => ({ ...c, count: products.filter((p) => p.collection_id === c.id).length }))
    .filter((c) => c.count > 0)

  const activeChips: { label: string; clear: () => void }[] = [
    ...ATTR_KINDS.flatMap((k) =>
      (sel[k.kind] ?? []).map((s) => ({
        label: attributes.find((a) => a.kind === k.kind && attrSlug(a) === s)?.name ?? s,
        clear: () => toggle(k.kind, s),
      })),
    ),
    ...(price ? [{ label: PRICE_BUCKETS.find((b) => b.id === price)?.label ?? price, clear: () => setPrice('') }] : []),
    ...(onlyNew ? [{ label: 'Mẫu mới', clear: () => setOnlyNew(false) }] : []),
  ]

  function toggle(kind: AttrKind, slug: string) {
    setSel((s) => {
      const cur = s[kind] ?? []
      const next = cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug]
      return { ...s, [kind]: next }
    })
  }
  function clearFilters() {
    setSel({})
    setPrice('')
    setOnlyNew(false)
  }
  function pickCat(slug: string) {
    setCat(slug)
    if (slug && activeCol && activeCol.category_id !== catBySlug[slug]?.id) setBst('')
    if (!slug) setBst('')
    clearFilters()
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors ${on ? 'border-ink bg-ink text-veil' : 'border-ink/20 hover:border-ink'}`

  return (
    <div>
      {/* Danh mục */}
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist" aria-label="Danh mục">
        <div className="flex w-max gap-6 border-b border-ink/15 sm:w-auto sm:gap-8">
          {[{ slug: '', name: 'Tất cả', n: products.length }, ...categories.map((c) => ({ ...c, n: products.filter((p) => p.category_id === c.id).length }))]
            .filter((c) => c.n > 0)
            .map((c) => (
              <button
                key={c.slug}
                role="tab"
                aria-selected={cat === c.slug}
                onClick={() => pickCat(c.slug)}
                className={`-mb-px whitespace-nowrap border-b pb-3 text-[0.9375rem] transition-colors ${cat === c.slug ? 'border-ink text-ink' : 'border-transparent text-taupe hover:text-ink'}`}
              >
                {c.name} <sup className="text-[0.6875rem]">{c.n}</sup>
              </button>
            ))}
        </div>
      </div>

      {/* Các bộ sưu tập trong danh mục */}
      {colsInScope.length > 0 && (
        <div className="mt-8">
          <p className="meta mb-3">Bộ sưu tập{activeCat ? ` ${activeCat.name.toLowerCase()}` : ''}</p>
          <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-3 sm:grid sm:w-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {colsInScope.map((c) => {
                const on = bst === c.slug
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setBst(on ? '' : c.slug)
                      clearFilters()
                    }}
                    aria-pressed={on}
                    className={`flex w-[240px] flex-col items-start rounded-2xl p-5 text-left transition-colors sm:w-auto ${on ? 'bg-ink text-veil' : 'bg-veil hover:bg-stone'}`}
                  >
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className="font-display text-[1.875rem] leading-none tracking-[-0.02em]">{c.name}</span>
                      {c.is_new && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] ${on ? 'bg-veil/15' : 'bg-oyster'}`}>Mới ra</span>
                      )}
                    </span>
                    {c.tagline && <span className={`mt-2 text-[0.8125rem] leading-5 ${on ? 'text-veil/75' : 'text-taupe'}`}>{c.tagline}</span>}
                    <span className={`mt-4 text-[0.8125rem] ${on ? 'text-veil/75' : 'text-ink'}`}>{c.count} mẫu</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Giới thiệu bộ sưu tập đang chọn */}
      {activeCol && (
        <div className="mt-10 grid gap-4 border-t border-ink/15 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <div>
            <p className="meta">
              {activeCol.is_new ? 'Mới ra' : 'Bộ sưu tập'}
              {activeCol.launched_on ? `, ra mắt ${formatDate(activeCol.launched_on).slice(3)}` : ''}
            </p>
            <h2 className="display-lg mt-2">{activeCol.name}</h2>
          </div>
          {activeCol.description && <p className="max-w-[46ch] text-[1rem] leading-7 text-ink/80 md:justify-self-end">{activeCol.description}</p>}
        </div>
      )}

      {/* Thanh công cụ */}
      <div className="sticky top-0 z-20 -mx-5 mt-8 flex flex-wrap items-center gap-2 bg-oyster/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-0">
        <button onClick={() => setPanel(!panel)} aria-expanded={panel} className={chip(panel || activeChips.length > 0)}>
          Bộ lọc{activeChips.length ? ` (${activeChips.length})` : ''}
        </button>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {activeChips.map((c) => (
            <button key={c.label} onClick={c.clear} className="rounded-full bg-stone px-3 py-1.5 text-[0.8125rem] hover:bg-mink/40" aria-label={`Bỏ lọc ${c.label}`}>
              {c.label} <span aria-hidden>×</span>
            </button>
          ))}
          {activeChips.length > 1 && (
            <button onClick={clearFilters} className="px-2 text-[0.8125rem] text-taupe underline underline-offset-4 hover:text-ink">Xoá bộ lọc</button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="sr-only" htmlFor="sort">Sắp xếp</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-ink/20 bg-transparent px-3 py-1.5 text-[0.8125rem] outline-none focus:border-ink">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="hidden items-center gap-1 text-[0.8125rem] sm:flex" aria-label="Kiểu hiển thị">
            {(['list', 'grid'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`px-2 py-1 ${view === v ? 'underline underline-offset-[6px]' : 'text-taupe hover:text-ink'}`}>
                {v === 'list' ? 'Danh sách' : 'Lưới ảnh'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bảng lọc: trải ngang trên máy tính, trượt lên từ dưới trên điện thoại */}
      {panel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setPanel(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Bộ lọc"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82svh] overflow-y-auto rounded-t-[24px] bg-oyster px-5 pb-28 pt-6 sm:static sm:z-auto sm:mt-2 sm:max-h-none sm:rounded-2xl sm:bg-veil sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between sm:hidden">
              <p className="font-display text-[1.5rem]">Bộ lọc</p>
              <button onClick={() => setPanel(false)} className="text-[0.875rem] underline underline-offset-4">Đóng</button>
            </div>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-medium">Giá thuê</legend>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BUCKETS.map((b) => (
                    <button key={b.id} onClick={() => setPrice(price === b.id ? '' : b.id)} aria-pressed={price === b.id} className={chip(price === b.id)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-medium">Mới ra</legend>
                <button onClick={() => setOnlyNew(!onlyNew)} aria-pressed={onlyNew} className={chip(onlyNew)}>
                  Chỉ xem mẫu và bộ sưu tập mới
                </button>
              </fieldset>
              {groups.map((g) => (
                <fieldset key={g.kind}>
                  <legend className="mb-2.5 text-[0.8125rem] font-medium">{g.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {g.opts.map((o) => {
                      const on = sel[g.kind]?.includes(o.slug) ?? false
                      return (
                        <button key={o.a.id} onClick={() => toggle(g.kind, o.slug)} aria-pressed={on} className={chip(on)}>
                          {o.a.name} <span className={on ? 'text-veil/60' : 'text-taupe'}>{o.count}</span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-ink/10 bg-oyster px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0">
              <button onClick={clearFilters} className="btn-line flex-1 !py-3 sm:flex-none">Xoá bộ lọc</button>
              <button onClick={() => setPanel(false)} className="btn-ink flex-[2] !py-3 sm:flex-none">Xem {shown.length} mẫu</button>
            </div>
          </div>
        </>
      )}

      <p className="meta mb-4 mt-6">
        {shown.length} mẫu
        {activeCol ? ` trong ${activeCol.name}` : activeCat ? ` ${activeCat.name.toLowerCase()}` : ''}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-veil px-6 py-14 text-center">
          <p className="font-display text-[1.5rem]">Chưa có mẫu khớp bộ lọc này.</p>
          <p className="meta mt-2">Bỏ bớt một vài lựa chọn, hoặc nhắn Darla để được gợi ý mẫu gần nhất.</p>
          <button onClick={clearFilters} className="btn-ink mt-6">Xoá bộ lọc</button>
        </div>
      ) : (
        <ProductList key={view} products={shown} categories={categories} collections={collections} view={view} />
      )}
    </div>
  )
}
