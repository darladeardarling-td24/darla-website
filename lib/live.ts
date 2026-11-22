'use client'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { supabaseBrowser } from './supabase/client'
import { canMakeNative, makeLiveNative } from './live-native'

/**
 * Tạo "ảnh sống" từ video quay bằng điện thoại (kể cả video HEVC .MOV 4K của iPhone):
 *  - cắt 2–3 giây, bỏ tiếng
 *  - thu nhỏ: cạnh ngắn 720px, 30 hình/giây
 *  - nén H.264 MP4 (phát được trên mọi trình duyệt), thêm ảnh đại diện JPEG
 * Bộ xử lý (ffmpeg.wasm, ~32MB) chỉ tải khi nhân viên bấm tạo, và được trình duyệt lưu lại cho lần sau.
 */
let ffmpeg: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg: new () => FFmpeg }
  }
}

/** Nạp thư viện từ /public/ffmpeg (không đóng gói chung để tránh lỗi build), chỉ một lần */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FFmpegWASM) return resolve()
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('Không tải được bộ xử lý video. Kiểm tra kết nối mạng rồi thử lại.'))
    document.head.appendChild(el)
  })
}

export function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return Promise.resolve(ffmpeg)
  if (!loading) {
    loading = (async () => {
      await loadScript('/ffmpeg/ffmpeg.js')
      const ff = new window.FFmpegWASM!.FFmpeg()
      const base = window.location.origin + '/ffmpeg'
      await ff.load({ coreURL: `${base}/ffmpeg-core.js`, wasmURL: `${base}/ffmpeg-core.wasm` })
      ffmpeg = ff
      return ff
    })().catch((e) => {
      loading = null
      throw e
    })
  }
  return loading
}

export type LiveResult = { mp4: Blob; poster: Blob; inputKB: number; outputKB: number }

/** Đổi mọi kiểu lỗi (kể cả lỗi không có nội dung từ bộ xử lý) thành câu dễ hiểu */
function describe(e: unknown): string {
  const raw = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  if (/memory|out of bounds|abort|OOM/i.test(raw))
    return 'Trình duyệt hết bộ nhớ khi xử lý video. Hãy đóng bớt tab rồi thử lại, hoặc dùng Chrome trên máy tính.'
  return raw ? `Không xử lý được video (${raw}).` : 'Không xử lý được video. Hãy tải lại trang rồi thử lại.'
}

/** Bỏ bộ xử lý đang hỏng để lần sau nạp lại từ đầu */
function resetFFmpeg() {
  try { ffmpeg?.terminate() } catch {}
  ffmpeg = null
  loading = null
}

export async function makeLive(file: File, opts: { start: number; duration: number }, onProgress?: (p: number) => void): Promise<LiveResult> {
  const inputKB = Math.round(file.size / 1024)
  // 1) Cách chính: để trình duyệt tự xử lý (nhanh, đúng màu, ổn định với video iPhone)
  if (canMakeNative()) {
    try {
      const r = await makeLiveNative(file, opts, onProgress)
      return { ...r, inputKB, outputKB: Math.round(r.mp4.size / 1024) }
    } catch (e) {
      console.warn('Tạo ảnh sống bằng trình duyệt lỗi, chuyển sang bộ xử lý dự phòng:', e)
      onProgress?.(0)
    }
  }
  // 2) Dự phòng: bộ xử lý ffmpeg chạy trong trình duyệt
  try {
    return await makeLiveOnce(file, opts, onProgress)
  } catch (first) {
    // Bộ xử lý có thể bị hỏng sau lần chạy trước: nạp lại và thử thêm một lần
    resetFFmpeg()
    try {
      return await makeLiveOnce(file, opts, onProgress)
    } catch (e) {
      resetFFmpeg()
      console.error('Tạo ảnh sống lỗi:', first, e)
      throw new Error(describe(e))
    }
  }
}

/** Ảnh đại diện lấy từ khung đầu của video đã nén (H.264 trình duyệt nào cũng mở được) */
async function posterFrom(mp4: Blob): Promise<Blob> {
  const url = URL.createObjectURL(mp4)
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.src = url
  try {
    await new Promise<void>((ok, bad) => {
      v.onloadeddata = () => ok()
      v.onerror = () => bad(new Error('Không tạo được ảnh đại diện.'))
    })
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    return await new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('Không tạo được ảnh đại diện.'))), 'image/jpeg', 0.85))
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function makeLiveOnce(file: File, opts: { start: number; duration: number }, onProgress?: (p: number) => void): Promise<LiveResult> {
  const ff = await loadFFmpeg()
  const ext = (file.name.split('.').pop() || 'mov').toLowerCase()
  const input = `in.${ext}`
  const handler = ({ progress }: { progress: number }) => onProgress?.(Math.max(0, Math.min(1, progress)))
  ff.on('progress', handler)
  try {
    await ff.writeFile(input, new Uint8Array(await file.arrayBuffer()))
    const code = await ff.exec([
      '-ss', String(Math.max(0, opts.start)),
      '-t', String(opts.duration),
      '-i', input,
      '-an',
      // cạnh ngắn 720px (dọc hay ngang đều đúng), tự xoay theo hướng quay của iPhone
      '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)':flags=lanczos,fps=30,format=yuv420p",
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-profile:v', 'main',
      '-movflags', '+faststart',
      'out.mp4',
    ])
    if (code !== 0) throw new Error('mã lỗi ' + code)
    const mp4 = (await ff.readFile('out.mp4')) as Uint8Array
    const video = new Blob([mp4.slice()], { type: 'video/mp4' })
    // Bộ xử lý thường không chạy ổn lần thứ hai liên tiếp: nạp lại cho lần sau
    resetFFmpeg()
    return { mp4: video, poster: await posterFrom(video), inputKB: Math.round(file.size / 1024), outputKB: Math.round(mp4.byteLength / 1024) }
  } finally {
    ff.off('progress', handler)
    if (ffmpeg === ff) for (const f of [input, 'out.mp4']) await ff.deleteFile(f).catch(() => {})
  }
}

/** Tải ảnh sống lên kho media, trả về đường dẫn video & ảnh đại diện */
export async function uploadLive(r: LiveResult): Promise<{ video: string; poster: string }> {
  const sb = supabaseBrowser()
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const paths = { video: `live/${id}.mp4`, poster: `live/${id}.jpg` }
  const up = async (path: string, blob: Blob) => {
    const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
    if (error) {
      if (/mime|type/i.test(error.message))
        throw new Error('Kho ảnh chưa nhận video. Hãy chạy file supabase/update-03-anh-song.sql trong Supabase (SQL Editor) rồi thử lại.')
      throw new Error('Tải lên thất bại: ' + error.message)
    }
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl
  }
  const [video, poster] = await Promise.all([up(paths.video, r.mp4), up(paths.poster, r.poster)])
  return { video, poster }
}

/** Kiểu nén của video: đọc tên bộ mã trong file MP4/MOV */
async function videoCodec(file: File): Promise<'h264' | 'hevc' | 'other'> {
  const b = new Uint8Array(await file.arrayBuffer())
  const has = (s: string) => {
    const c = [...s].map((x) => x.charCodeAt(0))
    for (let i = 0; i < b.length - 4; i++) if (b[i] === c[0] && b[i + 1] === c[1] && b[i + 2] === c[2] && b[i + 3] === c[3]) return true
    return false
  }
  if (has('avc1') || has('avc3')) return 'h264'
  if (has('hvc1') || has('hev1')) return 'hevc'
  return 'other'
}

export const READY_MAX_MB = 5
export const READY_MAX_SECONDS = 8

/**
 * Ảnh sống tự làm sẵn bên ngoài (CapCut, HandBrake…): kiểm tra rồi dùng nguyên file, không nén lại.
 * Chỉ nhận MP4 H.264 (mọi trình duyệt đều phát được), ngắn và nhẹ.
 */
export async function prepareReadyLive(file: File): Promise<LiveResult> {
  if (!/\.(mp4|m4v|mov)$/i.test(file.name)) throw new Error('Hãy chọn file video MP4.')
  if (file.size > READY_MAX_MB * 1024 * 1024)
    throw new Error(`Video nặng ${(file.size / 1024 / 1024).toFixed(1)}MB, tối đa ${READY_MAX_MB}MB. Hãy xuất lại ở 720p hoặc 1080p, cắt còn 2–3 giây.`)
  const codec = await videoCodec(file)
  if (codec === 'hevc')
    throw new Error('Video đang ở dạng HEVC (mặc định của iPhone), nhiều máy không phát được. Hãy xuất lại dạng H.264, hoặc dùng nút “Thêm ảnh sống từ video”.')
  if (codec !== 'h264') throw new Error('Video không phải dạng H.264. Hãy xuất lại dạng MP4 H.264.')

  const url = URL.createObjectURL(file)
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.preload = 'auto'
  v.src = url
  try {
    await new Promise<void>((ok, bad) => {
      v.onloadeddata = () => ok()
      v.onerror = () => bad(new Error('Trình duyệt không mở được video này. Hãy xuất lại dạng MP4 H.264.'))
    })
    if (v.duration > READY_MAX_SECONDS + 0.5)
      throw new Error(`Video dài ${v.duration.toFixed(1)} giây, tối đa ${READY_MAX_SECONDS} giây. Ảnh sống đẹp nhất khi dài 2–3 giây.`)
    // Ảnh đại diện: khung đầu, cạnh ngắn tối đa 1080px
    const k = Math.min(1, 1080 / Math.min(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * k)
    c.height = Math.round(v.videoHeight * k)
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
    const poster = await new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('Không tạo được ảnh đại diện.'))), 'image/jpeg', 0.85))
    const kb = Math.round(file.size / 1024)
    return { mp4: new Blob([file], { type: 'video/mp4' }), poster, inputKB: kb, outputKB: kb }
  } finally {
    v.removeAttribute('src')
    v.load()
    URL.revokeObjectURL(url)
  }
}
