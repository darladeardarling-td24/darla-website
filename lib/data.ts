import 'server-only'
import { createClient } from '@supabase/supabase-js'
import demo from './demo-data.json'
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from './supabase/env'
import type { HomeMedia, HomeSlot } from './home-slots'
import type { Attribute, AttrKind, Category, Collection, Offer, Product, Service, Settings, TextTone } from './types'

/**
 * Dữ liệu cho trang khách. Kết quả được lưu đệm 60 giây; khi nhân sự lưu nội dung
 * trong admin, trang sẽ được làm mới ngay (xem app/admin/actions.ts).
 * Khi chưa cấu hình Supabase, web hiển thị dữ liệu mẫu để xem trước giao diện.
 */
const db = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'force-cache', next: { revalidate: 60, tags: ['site'] } }),
      },
    })
  : null

const demoCategories: Category[] = demo.categories.map((c) => ({ ...c, id: 'cat-' + c.slug }))
const demoAttributes: Attribute[] = demo.attributes.map((a) => ({ ...a, kind: a.kind as AttrKind, id: `a-${a.kind}-${a.name}` }))
const demoCollections: Collection[] = demo.collections.map((c) => {
  const { category, ...rest } = c
  return { ...rest, id: 'col-' + c.slug, category_id: 'cat-' + category, cover: null, status: 'published' }
})
const demoProducts: Product[] = demo.products.map((p) => {
  const { category, collection, attr_names, ...rest } = p as typeof p & { collection?: string | null; attr_names?: string[] }
  return {
    ...rest,
    id: 'p-' + p.slug,
    category_id: 'cat-' + category,
    collection_id: collection ? 'col-' + collection : null,
    attrs: (attr_names ?? []).map((n) => 'a-' + n.replace(':', '-')),
    images: [],
    status: 'published',
  }
})
const demoServices: Service[] = demo.services.map((s, i) => ({
  ...s, id: 's-' + i, kind: s.kind as Service['kind'], image: null, status: 'published',
}))
const demoOffers: Offer[] = demo.offers.map((o, i) => ({ ...o, id: 'o-' + i, start_date: null, image: null, status: 'published' }))
const demoSettings: Settings = { ...demo.settings, hero_image: null }

/** Gọi Supabase; chưa cấu hình thì dùng dữ liệu mẫu, gặp lỗi thì trả rỗng (không bao giờ hiện dữ liệu mẫu trên web thật) */
async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!db) return fallback
  const empty = (Array.isArray(fallback) ? [] : fallback) as T
  try {
    const { data, error } = await fn()
    if (error) {
      console.error('[supabase]', error)
      return empty
    }
    return data ?? empty
  } catch (e) {
    console.error('[supabase]', e)
    return empty
  }
}

export async function getSettings(): Promise<Settings> {
  const row = await safe<Settings | null>(() => db!.from('settings').select('*').eq('id', 1).maybeSingle(), demoSettings)
  return { ...demoSettings, ...Object.fromEntries(Object.entries(row ?? {}).filter(([, v]) => v !== null && v !== '')) } as Settings
}

export function getCategories() {
  return safe<Category[]>(() => db!.from('categories').select('*').order('sort_order'), demoCategories)
}

export function getCollections() {
  return safe<Collection[]>(
    () => db!.from('collections').select('*').eq('status', 'published').order('sort_order').order('launched_on', { ascending: false }),
    demoCollections,
  )
}

export function getAttributes() {
  return safe<Attribute[]>(() => db!.from('attributes').select('id,kind,name,sort_order').order('sort_order'), demoAttributes)
}

export function getProducts() {
  return safe<Product[]>(
    () => db!.from('products').select('*').eq('status', 'published').order('sort_order').order('created_at', { ascending: false }),
    demoProducts,
  )
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!db) return demoProducts.find((p) => p.slug === slug) ?? null
  return safe<Product | null>(() => db.from('products').select('*').eq('slug', slug).eq('status', 'published').maybeSingle(), null)
}

export function getServices() {
  return safe<Service[]>(() => db!.from('services').select('*').eq('status', 'published').order('sort_order'), demoServices)
}

export function getOffers() {
  return safe<Offer[]>(() => db!.from('offers').select('*').eq('status', 'published').order('sort_order'), demoOffers)
}

/** Ưu đãi đang trong thời gian áp dụng */
export function activeOffers(offers: Offer[]) {
  const today = new Date().toISOString().slice(0, 10)
  return offers.filter((o) => (!o.end_date || o.end_date >= today) && (!o.start_date || o.start_date <= today))
}

/** Ảnh trang chủ theo từng vị trí (bảng home_media) */
export async function getHomeMedia(): Promise<Partial<Record<HomeSlot, HomeMedia>>> {
  const rows = await safe<HomeMedia[]>(() => db!.from('home_media').select('slot,image,focus,caption'), [])
  return Object.fromEntries(rows.filter((r) => r.image?.url).map((r) => [r.slot, r]))
}


/** Ảnh đầu trang (máy tính, điện thoại, ảnh chi tiết) kèm màu chữ phù hợp — dùng cho trang chủ và thanh đầu trang */
export async function getHero() {
  const [media, products, s] = await Promise.all([getHomeMedia(), getProducts(), getSettings()])
  const featured = products.filter((p) => p.is_featured)
  const firstImg = (featured.length ? featured : products).flatMap((p) => p.images)[0] ?? products.flatMap((p) => p.images)[0] ?? null
  const hero: HomeMedia = media.hero ?? { slot: 'hero', image: firstImg, focus: 'center', caption: null }
  const mobile: HomeMedia = media.hero_mobile ?? hero
  const detail: HomeMedia | null =
    media.hero_detail ?? (s.hero_image ? { slot: 'hero_detail', image: s.hero_image, focus: 'center', caption: null } : null)
  const tone = (m: HomeMedia): TextTone => m.image?.text ?? 'veil'
  return { hero, mobile, detail, tone: { desktop: tone(hero), mobile: tone(mobile) } }
}
