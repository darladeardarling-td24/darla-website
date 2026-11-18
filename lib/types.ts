export type Img = { url: string; thumb: string }
export type Status = 'published' | 'draft'

export type Settings = {
  brand_name: string | null
  tagline: string | null
  season_label: string | null
  hero_title: string | null
  hero_subtitle: string | null
  about: string | null
  instagram: string | null
  phone: string | null
  address: string | null
  hours: string | null
  marquee: string | null
  hero_image: Img | null
}

export type Category = { id: string; name: string; slug: string; sort_order: number }

export type Product = {
  id: string
  code: string | null
  name: string
  slug: string
  category_id: string | null
  silhouette: string | null
  material: string | null
  sizes: string | null
  price_rent: number | null
  price_sale: number | null
  price_note: string | null
  short_desc: string | null
  description: string | null
  images: Img[]
  is_featured: boolean
  is_new: boolean
  status: Status
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type ServiceKind = 'makeup' | 'venue' | 'photo' | 'other'
export type Service = {
  id: string
  kind: ServiceKind
  name: string
  price_from: number | null
  price_note: string | null
  description: string | null
  features: string[]
  image: Img | null
  status: Status
  sort_order: number
}

export type Offer = {
  id: string
  title: string
  highlight: string | null
  description: string | null
  terms: string | null
  start_date: string | null
  end_date: string | null
  image: Img | null
  status: Status
  sort_order: number
}

export type Profile = { id: string; email: string | null; full_name: string | null; role: 'admin' | 'editor'; created_at?: string }

export const SERVICE_KINDS: Record<ServiceKind, string> = {
  makeup: 'Makeup cô dâu',
  venue: 'Rạp cưới',
  photo: 'Chụp ảnh',
  other: 'Dịch vụ khác',
}
