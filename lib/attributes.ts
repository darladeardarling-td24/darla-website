import { slugify } from './format'
import type { Attribute, AttrKind, Product } from './types'

/** Các nhóm bộ lọc. Lựa chọn trong từng nhóm do admin quản lý (admin → Bộ lọc). */
export const ATTR_KINDS: { kind: AttrKind; label: string; param: string }[] = [
  { kind: 'silhouette', label: 'Dáng váy', param: 'dang' },
  { kind: 'material', label: 'Chất liệu', param: 'chat-lieu' },
  { kind: 'neckline', label: 'Kiểu cổ', param: 'co' },
  { kind: 'sleeve', label: 'Tay áo', param: 'tay' },
  { kind: 'train', label: 'Đuôi váy', param: 'duoi' },
  { kind: 'color', label: 'Màu sắc', param: 'mau' },
  { kind: 'style', label: 'Phong cách', param: 'phong-cach' },
  { kind: 'occasion', label: 'Phù hợp cho', param: 'dip' },
]

export const PRICE_BUCKETS = [
  { id: 'duoi-5', label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  { id: '5-10', label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { id: '10-15', label: '10 – 15 triệu', min: 10_000_000, max: 15_000_000 },
  { id: 'tren-15', label: 'Trên 15 triệu', min: 15_000_000, max: Infinity },
]

export const attrSlug = (a: Attribute) => slugify(a.name)

/** Thuộc tính của một váy, gom theo nhóm: { silhouette: ['Chữ A'], material: ['Lụa', 'Satin'] } */
export function attrsByKind(p: Product, all: Attribute[]) {
  const map = new Map(all.map((a) => [a.id, a]))
  const out: Partial<Record<AttrKind, Attribute[]>> = {}
  for (const id of p.attrs ?? []) {
    const a = map.get(id)
    if (a) (out[a.kind] ??= []).push(a)
  }
  for (const k of Object.keys(out) as AttrKind[]) out[k]!.sort((x, y) => x.sort_order - y.sort_order)
  return out
}
