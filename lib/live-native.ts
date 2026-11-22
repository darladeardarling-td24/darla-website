'use client'
/**
 * Tạo ảnh sống bằng chính trình duyệt (Chrome, Edge, Safari mới):
 *  - trình duyệt tự giải mã video iPhone (HEVC, HDR) bằng phần cứng → nhanh, ít tốn bộ nhớ
 *  - vẽ từng khung hình lên canvas → màu được trình duyệt chuyển về màu thường, giống lúc xem thử
 *  - nén H.264 bằng WebCodecs, đóng gói MP4 (phát được trên mọi trình duyệt)
 * Nếu trình duyệt không hỗ trợ, lib/live.ts sẽ dùng bộ xử lý ffmpeg dự phòng.
 */
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

const FPS = 30
const SHORT_SIDE = 720
const BITRATE = 800_000

/** Video có phải HDR (HLG/PQ) không: đọc hộp màu 'colr' trong file MOV/MP4 */
async function isHdrFile(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.arrayBuffer())
  // Thông tin màu thường nằm ở đầu hoặc cuối file (iPhone để ở cuối)
  for (let i = b.length - 12; i >= 0; i--) {
    // 'colr' + 'nclx' (MP4) hoặc 'nclc' (MOV của iPhone) → primaries(2 byte), transfer(2 byte)
    if (b[i] === 0x6e && b[i + 1] === 0x63 && b[i + 2] === 0x6c && (b[i + 3] === 0x78 || b[i + 3] === 0x63) && b[i - 4] === 0x63 && b[i - 1] === 0x72) {
      const transfer = (b[i + 6] << 8) | b[i + 7]
      if (transfer === 16 || transfer === 18) return true
    }
  }
  return false
}

const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

/**
 * Bảng chỉnh sáng cho video HDR sau khi trình duyệt chuyển về màu thường.
 * Trình duyệt thường nén cả dải sáng HDR vào màu thường nên hình bị xám, tối.
 * Đo vùng sáng nhất (99,5%) của khung đầu, kéo nó về gần trắng, vùng sáng hơn được uốn mềm
 * (không bị cháy). Nếu hình đã đủ sáng thì không chỉnh gì.
 */
function hdrLut(img: ImageData): Uint8ClampedArray | null {
  const d = img.data
  const hist = new Uint32Array(256)
  let n = 0
  for (let i = 0; i < d.length; i += 16) {
    hist[Math.max(d[i], d[i + 1], d[i + 2])]++
    n++
  }
  let acc = 0
  let p = 255
  for (let v = 0; v < 256; v++) {
    acc += hist[v]
    if (acc >= n * 0.995) {
      p = v
      break
    }
  }
  if (p >= 232) return null
  const gain = 0.97 / Math.max(0.02, toLin(Math.max(p, 40) / 255))
  const knee = 0.8
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) {
    const L = toLin(v / 255) * gain
    const out = L <= knee ? L : knee + (1 - knee) * (1 - Math.exp(-(L - knee) / (1 - knee)))
    lut[v] = Math.round(toSrgb(Math.min(1, out)) * 255)
  }
  return lut
}

export function canMakeNative(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window && 'requestVideoFrameCallback' in HTMLVideoElement.prototype
}

function once(el: HTMLMediaElement, ok: string, timeoutMs = 15000) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => done(new Error('Trình duyệt không mở được video này.')), timeoutMs)
    const onOk = () => done()
    const onErr = () => done(new Error('Trình duyệt không mở được video này.'))
    function done(err?: Error) {
      clearTimeout(t)
      el.removeEventListener(ok, onOk)
      el.removeEventListener('error', onErr)
      err ? reject(err) : resolve()
    }
    el.addEventListener(ok, onOk)
    el.addEventListener('error', onErr)
  })
}

async function pickCodec(width: number, height: number): Promise<string> {
  for (const codec of ['avc1.4d401f', 'avc1.4d4028', 'avc1.42e01f', 'avc1.640028']) {
    const s = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: BITRATE, framerate: FPS }).catch(() => null)
    if (s?.supported) return codec
  }
  throw new Error('Trình duyệt không nén được video H.264.')
}

export async function makeLiveNative(
  file: File,
  opts: { start: number; duration: number },
  onProgress?: (p: number) => void,
): Promise<{ mp4: Blob; poster: Blob }> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url
  let encoder: VideoEncoder | null = null
  try {
    await once(video, 'loadedmetadata')
    if (!video.videoWidth || !video.videoHeight) throw new Error('Trình duyệt không đọc được hình của video này.')

    // Kích thước ra: cạnh ngắn 720px, số chẵn (trình duyệt đã tự xoay video dọc của iPhone)
    const vw = video.videoWidth
    const vh = video.videoHeight
    const k = Math.min(1, SHORT_SIDE / Math.min(vw, vh))
    const width = Math.round((vw * k) / 2) * 2
    const height = Math.round((vh * k) / 2) * 2

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true })!
    ctx.imageSmoothingQuality = 'high'

    const codec = await pickCodec(width, height)
    const hdr = await isHdrFile(file).catch(() => false)
    let lut: Uint8ClampedArray | null | undefined = hdr ? undefined : null
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height, frameRate: FPS },
      fastStart: 'in-memory',
    })
    let encodeError: Error | null = null
    encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => (encodeError = e instanceof Error ? e : new Error(String(e))),
    })
    encoder.configure({ codec, width, height, bitrate: BITRATE, framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } })

    const start = Math.max(0, Math.min(opts.start, Math.max(0, (video.duration || 0) - 0.1)))
    const end = Math.min(start + opts.duration, video.duration || start + opts.duration)
    video.currentTime = start
    await once(video, 'seeked')

    let poster: Blob | null = null
    let frames = 0
    let lastFrameTime = -1

    // Phát đoạn đã chọn và chụp lại từng khung hình, đặt đều 30 hình/giây
    await new Promise<void>((resolve, reject) => {
      let finished = false
      const finish = (err?: Error) => {
        if (finished) return
        finished = true
        video.pause()
        err ? reject(err) : resolve()
      }
      const total = Math.max(1, Math.round((end - start) * FPS))
      const draw = (t: number) => {
        ctx.drawImage(video, 0, 0, width, height)
        if (lut !== null) {
          const img = ctx.getImageData(0, 0, width, height)
          if (lut === undefined) lut = hdrLut(img) // tính một lần từ khung đầu → cả đoạn sáng đều nhau
          if (lut) {
            const d = img.data
            for (let i = 0; i < d.length; i += 4) {
              d[i] = lut[d[i]]
              d[i + 1] = lut[d[i + 1]]
              d[i + 2] = lut[d[i + 2]]
            }
            ctx.putImageData(img, 0, 0)
          }
        }
        // Lấp các khung còn thiếu (video gốc 24/25 hình/giây hoặc máy chậm) bằng khung hiện tại
        const target = Math.min(total, Math.floor((t - start) * FPS) + 1)
        while (frames < target) {
          const vf = new VideoFrame(canvas, { timestamp: Math.round((frames * 1e6) / FPS), duration: Math.round(1e6 / FPS) })
          encoder!.encode(vf, { keyFrame: frames % (FPS * 2) === 0 })
          vf.close()
          frames++
        }
        if (!poster) canvas.toBlob((b) => (poster = b), 'image/jpeg', 0.85)
        onProgress?.(frames / total)
        return frames >= total
      }
      const onFrame = (_now: number, meta: VideoFrameCallbackMetadata) => {
        if (finished) return
        if (encodeError) return finish(encodeError)
        const t = meta.mediaTime
        if (t !== lastFrameTime) {
          lastFrameTime = t
          if (t >= start - 0.05 && draw(Math.max(t, start))) return finish()
        }
        if (t >= end || video.ended) {
          draw(end)
          return finish()
        }
        video.requestVideoFrameCallback(onFrame)
      }
      video.requestVideoFrameCallback(onFrame)
      video.addEventListener('ended', () => {
        draw(end)
        finish()
      }, { once: true })
      // Không bị kẹt nếu trình duyệt ngừng phát
      setTimeout(() => finish(frames > FPS ? undefined : new Error('Trình duyệt không phát được video này.')), (end - start) * 1000 * 4 + 8000)
      video.play().catch((e) => finish(e instanceof Error ? e : new Error(String(e))))
    })

    await encoder.flush()
    if (encodeError) throw encodeError
    encoder.close()
    encoder = null
    muxer.finalize()
    const buf = (muxer.target as ArrayBufferTarget).buffer
    if (!buf.byteLength || frames < 2) throw new Error('Không ghi được video.')

    // Ảnh đại diện = khung đầu tiên
    for (let i = 0; i < 20 && !poster; i++) await new Promise((r) => setTimeout(r, 50))
    if (!poster) throw new Error('Không tạo được ảnh đại diện.')
    return { mp4: new Blob([buf], { type: 'video/mp4' }), poster }
  } finally {
    try { encoder?.close() } catch {}
    video.pause()
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}
