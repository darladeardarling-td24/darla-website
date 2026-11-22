'use client'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { supabaseBrowser } from './supabase/client'

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

export async function makeLive(file: File, opts: { start: number; duration: number }, onProgress?: (p: number) => void): Promise<LiveResult> {
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
    if (code !== 0) throw new Error('Không xử lý được video này. Hãy thử một video khác hoặc chọn đoạn bắt đầu sớm hơn.')
    await ff.exec(['-i', 'out.mp4', '-frames:v', '1', '-q:v', '3', 'poster.jpg'])
    const mp4 = (await ff.readFile('out.mp4')) as Uint8Array
    const jpg = (await ff.readFile('poster.jpg')) as Uint8Array
    const out = {
      mp4: new Blob([mp4.slice()], { type: 'video/mp4' }),
      poster: new Blob([jpg.slice()], { type: 'image/jpeg' }),
      inputKB: Math.round(file.size / 1024),
      outputKB: Math.round(mp4.byteLength / 1024),
    }
    return out
  } finally {
    ff.off('progress', handler)
    for (const f of [input, 'out.mp4', 'poster.jpg']) await ff.deleteFile(f).catch(() => {})
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
