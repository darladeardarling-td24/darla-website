'use client'
import { supabaseBrowser } from './supabase/client'
import type { Img } from './types'

/**
 * Nén ảnh ngay trên trình duyệt trước khi tải lên:
 *  - Ảnh lớn: cạnh dài tối đa 2000px, WebP chất lượng 0.86 (giữ chi tiết ren, voan)
 *  - Ảnh nhỏ (thumb): cạnh dài 900px cho danh sách, tải nhanh trên điện thoại
 * Ảnh 8–15MB từ máy ảnh thường còn khoảng 300–600KB mà mắt thường khó thấy khác biệt.
 */
const FULL = { max: 2000, quality: 0.86 }
const THUMB = { max: 900, quality: 0.82 }

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  }
}

async function encode(src: ImageBitmap | HTMLImageElement, max: number, quality: number): Promise<Blob> {
  const w0 = 'naturalWidth' in src ? src.naturalWidth : src.width
  const h0 = 'naturalHeight' in src ? src.naturalHeight : src.height
  const scale = Math.min(1, max / Math.max(w0, h0))
  const w = Math.round(w0 * scale)
  const h = Math.round(h0 * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), type, q))
  let blob = await toBlob('image/webp', quality)
  // Một số bản Safari cũ không xuất được WebP → dùng JPEG chất lượng cao
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', Math.min(0.9, quality + 0.03))
  if (!blob) throw new Error('Không xử lý được ảnh này.')
  return blob
}

export type UploadResult = Img & { originalKB: number; savedKB: number }

/** Đo độ sáng vùng thường đặt chữ (nửa trái + phần dưới ảnh) để chọn màu chữ phù hợp */
function suggestText(src: ImageBitmap | HTMLImageElement): 'sand' | 'veil' {
  try {
    const c = document.createElement('canvas')
    c.width = 48
    c.height = 48
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(src, 0, 0, 48, 48)
    const d = ctx.getImageData(0, 0, 48, 48).data
    let sum = 0
    let n = 0
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        if (x > 26 && y < 28) continue // bỏ góc trên bên phải (thường là chủ thể)
        const i = (y * 48 + x) * 4
        sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
        n++
      }
    return sum / n > 0.58 ? 'sand' : 'veil'
  } catch {
    return 'veil'
  }
}

export async function compressAndUpload(file: File, folder: string): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" không phải là ảnh.`)
  const bmp = await loadBitmap(file)
  const text = suggestText(bmp)
  const [full, thumb] = await Promise.all([encode(bmp, FULL.max, FULL.quality), encode(bmp, THUMB.max, THUMB.quality)])
  if ('close' in bmp) bmp.close()
  const ext = full.type === 'image/webp' ? 'webp' : 'jpg'
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const sb = supabaseBrowser()
  const paths = { full: `${folder}/${id}.${ext}`, thumb: `${folder}/${id}_t.${ext}` }
  for (const [key, blob] of [['full', full], ['thumb', thumb]] as const) {
    const { error } = await sb.storage.from('media').upload(paths[key], blob, {
      contentType: blob.type,
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) throw new Error('Tải ảnh lên thất bại: ' + error.message)
  }
  const pub = (p: string) => sb.storage.from('media').getPublicUrl(p).data.publicUrl
  return {
    url: pub(paths.full),
    thumb: pub(paths.thumb),
    text,
    originalKB: Math.round(file.size / 1024),
    savedKB: Math.round(full.size / 1024),
  }
}

/** Xoá file ảnh khỏi kho khi gỡ khỏi sản phẩm */
export async function removeImage(img: Img) {
  const sb = supabaseBrowser()
  const toPath = (u: string) => u.split('/storage/v1/object/public/media/')[1]
  const paths = [toPath(img.url), toPath(img.thumb)].filter(Boolean) as string[]
  if (paths.length) await sb.storage.from('media').remove(paths)
}
