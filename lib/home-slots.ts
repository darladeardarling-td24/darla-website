import type { Img } from './types'

export type Focus = 'top' | 'center' | 'bottom'
export type HomeSlot = 'hero' | 'hero_mobile' | 'hero_detail' | 'look_1' | 'look_2' | 'look_3'
export type HomeMedia = { slot: HomeSlot; image: Img | null; focus: Focus; caption: string | null }

/** Các vị trí ảnh trên trang chủ — dùng chung cho trang khách và trang admin */
export const HOME_SLOTS: { slot: HomeSlot; label: string; hint: string; ratio: string; optional?: boolean }[] = [
  {
    slot: 'hero',
    label: 'Ảnh lớn đầu trang',
    hint: 'Ảnh ngang tràn toàn màn hình — thứ khách thấy đầu tiên. Chữ nằm bên trái (máy tính) và phía dưới (điện thoại), nên chọn ảnh cô dâu ở giữa hoặc lệch phải, nền thoáng.',
    ratio: '16 / 9',
  },
  {
    slot: 'hero_mobile',
    label: 'Ảnh đầu trang trên điện thoại',
    hint: 'Không bắt buộc. Để trống thì web tự cắt từ ảnh lớn theo điểm bạn chọn. Chỉ cần khi muốn dùng một ảnh dọc khác cho điện thoại.',
    ratio: '4 / 5',
    optional: true,
  },
  {
    slot: 'hero_detail',
    label: 'Ảnh chi tiết nhỏ',
    hint: 'Cận cảnh ren, voan, đường may hoặc phụ kiện. Nằm ở góc phải ảnh lớn (chỉ hiện trên máy tính).',
    ratio: '3 / 4',
    optional: true,
  },
  { slot: 'look_1', label: 'Lookbook · ảnh dọc bên trái', hint: 'Ảnh dọc toàn thân.', ratio: '3 / 4' },
  { slot: 'look_2', label: 'Lookbook · ảnh ngang ở giữa', hint: 'Ảnh ngang: không gian, nhóm phù dâu, hậu trường…', ratio: '4 / 3' },
  { slot: 'look_3', label: 'Lookbook · ảnh dọc bên phải', hint: 'Ảnh dọc, nên khác góc máy với ảnh bên trái.', ratio: '3 / 4' },
]

export const FOCUS_LABEL: Record<Focus, string> = { top: 'Giữ phần trên', center: 'Giữ phần giữa', bottom: 'Giữ phần dưới' }
export const focusClass = (f?: Focus | null) => (f === 'top' ? 'object-top' : f === 'bottom' ? 'object-bottom' : 'object-center')
