import type { Img } from './types'

export type Focus = 'top' | 'center' | 'bottom'
export type HomeSlot = 'hero' | 'hero_mobile' | 'hero_detail'
export type HomeMedia = { slot: HomeSlot; image: Img | null; focus: Focus; caption: string | null }

/** Các vị trí ảnh trên trang chủ — dùng chung cho trang khách và trang admin */
export const HOME_SLOTS: { slot: HomeSlot; label: string; hint: string; ratio: string; optional?: boolean }[] = [
  {
    slot: 'hero',
    label: 'Ảnh lớn đầu trang',
    hint: 'Ảnh ngang tràn chiều ngang màn hình, để trơn không có chữ đè lên — thứ khách thấy đầu tiên. Tiêu đề và nút nằm ngay bên dưới ảnh.',
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
    hint: 'Cận cảnh ren, voan, đường may hoặc phụ kiện. Nằm nhỏ bên phải phần chữ dưới ảnh bìa (chỉ hiện trên máy tính).',
    ratio: '3 / 4',
    optional: true,
  },
]

export const FOCUS_LABEL: Record<Focus, string> = { top: 'Giữ phần trên', center: 'Giữ phần giữa', bottom: 'Giữ phần dưới' }
export const focusClass = (f?: Focus | null) => (f === 'top' ? 'object-top' : f === 'bottom' ? 'object-bottom' : 'object-center')
