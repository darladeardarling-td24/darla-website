export function formatPrice(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN').format(v) + ' đ'
}

/** Giá rút gọn cho danh sách: 8.500.000 → "8,5 triệu" */
export function shortPrice(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'Liên hệ'
  if (v >= 1_000_000) {
    const m = v / 1_000_000
    return (Number.isInteger(m) ? m.toString() : m.toFixed(1).replace('.', ',')) + ' triệu'
  }
  return new Intl.NumberFormat('vi-VN').format(v) + ' đ'
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(d: string | null): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function instagramHandle(raw: string | null | undefined): string {
  return (raw || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '')
}
