'use client'
import { useEffect, useRef, useState } from 'react'
import { makeLive, prepareReadyLive, uploadLive, READY_MAX_MB, type LiveQuality } from '@/lib/live'
import type { Img } from '@/lib/types'
import { useToast } from './ui'

type Props = { images: Img[]; onChange: (v: Img[]) => void }

/**
 * Ảnh sống cho ảnh bìa của váy: chọn video từ điện thoại → chọn đoạn 2–3 giây →
 * tự nén ngay trên máy (không cần phần mềm khác) → tải lên.
 */
export const MAX_LIVE = 3

export default function LiveField({ images, onChange }: Props) {
  const liveCount = images.filter((im) => im.live).length
  const full = liveCount >= MAX_LIVE
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const readyInput = useRef<HTMLInputElement>(null)
  const [readyBusy, setReadyBusy] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const preview = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState<number | null>(null)
  const [canPreview, setCanPreview] = useState(true)
  const [start, setStart] = useState(0)
  const [len, setLen] = useState(3)
  const [quality, setQuality] = useState<LiveQuality>('sharp')
  const [stage, setStage] = useState<'' | 'load' | 'encode' | 'upload'>('')
  const [pct, setPct] = useState(0)

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])

  function pick(f: File) {
    if (!f.type.startsWith('video/') && !/\.(mov|mp4|m4v|hevc)$/i.test(f.name)) return toast('Hãy chọn một file video.', 'error')
    if (url) URL.revokeObjectURL(url)
    setFile(f)
    setUrl(URL.createObjectURL(f))
    setDuration(null)
    setCanPreview(true)
    setStart(0)
  }

  function playSegment() {
    const v = preview.current
    if (!v) return
    v.currentTime = start
    v.play().catch(() => {})
    const stop = () => {
      if (v.currentTime >= start + len) {
        v.pause()
        v.removeEventListener('timeupdate', stop)
      }
    }
    v.addEventListener('timeupdate', stop)
  }

  async function create() {
    if (!file) return
    if (full) return toast(`Mỗi váy tối đa ${MAX_LIVE} ảnh sống. Gỡ bớt ở hàng ảnh phía trên để thêm mới.`, 'error')
    try {
      setStage('encode')
      setPct(0)
      const r = await makeLive(file, { start, duration: len, quality }, setPct)
      setStage('upload')
      const { video, poster } = await uploadLive(r)
      onChange([...images, { url: poster, thumb: poster, live: video }])
      toast(`Đã thêm ảnh sống: ${(r.inputKB / 1024).toFixed(1)}MB → ${r.outputKB}KB. Dùng nút ‹ › ở hàng ảnh để đổi vị trí, rồi bấm Lưu.`)
      setFile(null)
    } catch (e) {
      toast((e instanceof Error && e.message) || String(e || '') || 'Không tạo được ảnh sống.', 'error')
    }
    setStage('')
  }

  async function uploadReady(f: File) {
    if (full) return toast(`Mỗi váy tối đa ${MAX_LIVE} ảnh sống. Gỡ bớt ở hàng ảnh phía trên để thêm mới.`, 'error')
    setReadyBusy(true)
    try {
      const r = await prepareReadyLive(f)
      const { video, poster } = await uploadLive(r)
      onChange([...images, { url: poster, thumb: poster, live: video }])
      toast(`Đã thêm ảnh sống làm sẵn (${r.outputKB}KB). Dùng nút ‹ › ở hàng ảnh để đổi vị trí, rồi bấm Lưu.`)
      if (r.outputKB > 1024) toast('Video hơi nặng: nên dưới 1MB để khách xem mượt trên điện thoại.', 'error')
    } catch (e) {
      toast((e instanceof Error && e.message) || 'Không tải lên được ảnh sống.', 'error')
    }
    setReadyBusy(false)
  }

  const busy = stage !== ''
  const maxStart = duration ? Math.max(0, duration - len) : 30

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-[0.8125rem] font-medium">
            Ảnh sống (video 2–3 giây) <span className="meta">{liveCount}/{MAX_LIVE}</span>
          </p>
          <p className="meta mt-1">
            Chọn video quay bằng điện thoại (iPhone quay .MOV cũng được). Web tự cắt, bỏ tiếng và nén nhẹ (khoảng 0,5–1MB ở mức Nét, 300–500KB ở mức Nhẹ). Ảnh sống được thêm vào hàng ảnh phía trên: dùng nút ‹ › để sắp thứ tự cùng ảnh thường. Nếu ảnh sống đứng đầu, ảnh bìa của váy sẽ chuyển động.
          </p>
        </div>
        {!file && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={full || readyBusy}
              onClick={() => input.current?.click()}
              className="btn-line !px-4 !py-2 text-[0.875rem] disabled:opacity-40"
              title={full ? `Mỗi váy tối đa ${MAX_LIVE} ảnh sống. Gỡ bớt ở hàng ảnh phía trên để thêm mới.` : undefined}
            >
              {full ? `Đã đủ ${MAX_LIVE} ảnh sống` : 'Thêm ảnh sống từ video'}
            </button>
            {!full && (
              <button
                type="button"
                disabled={readyBusy}
                onClick={() => readyInput.current?.click()}
                className="btn-line !px-4 !py-2 text-[0.875rem] disabled:opacity-60"
              >
                {readyBusy ? 'Đang tải lên…' : 'Tải ảnh sống làm sẵn (MP4)'}
              </button>
            )}
          </div>
        )}
        <input ref={readyInput} type="file" accept="video/mp4,.mp4,.m4v,.mov" hidden onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) uploadReady(f)
          }}
        />
        <input ref={input} type="file" accept="video/*,.mov,.mp4,.m4v" hidden onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = '' // cho phép chọn lại cùng một video để cắt đoạn khác
            if (f) pick(f)
          }}
        />
      </div>

      {!file && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowGuide((x) => !x)} className="text-[0.8125rem] text-taupe underline underline-offset-4">
            {showGuide ? 'Ẩn hướng dẫn làm ảnh sống sẵn' : 'Cách tự làm ảnh sống sẵn bằng CapCut'}
          </button>
          {showGuide && (
            <ol className="meta mt-2 max-w-xl list-decimal space-y-1 pl-5">
              <li>Mở video trong CapCut, cắt còn 2–3 giây đẹp nhất, tắt tiếng.</li>
              <li>Bấm xuất: độ phân giải 720p hoặc 1080p, tốc độ khung hình 30.</li>
              <li>Tắt HDR và tắt HEVC (để dạng H.264) nếu có tuỳ chọn này.</li>
              <li>File xuất ra là MP4, nên dưới 1MB (tối đa {READY_MAX_MB}MB). Bấm “Tải ảnh sống làm sẵn (MP4)” để tải lên, web dùng nguyên file, không nén lại.</li>
            </ol>
          )}
        </div>
      )}

      {file && (
        <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
          <div className="aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-xl bg-stone">
            {canPreview ? (
              <video
                ref={preview}
                src={url}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration
                  if (Number.isFinite(d)) {
                    setDuration(d)
                    setLen(d < 3 ? Math.max(1, Math.floor(d * 10) / 10) : 3)
                  }
                }}
                onError={() => setCanPreview(false)}
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="meta grid h-full place-items-center p-3 text-center">Máy này không xem trước được video, nhưng vẫn tạo ảnh sống bình thường.</p>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-[0.875rem]">
              {file.name} <span className="meta">({(file.size / 1024 / 1024).toFixed(1)}MB{duration ? `, ${duration.toFixed(1)} giây` : ''})</span>
            </p>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Độ dài</p>
              <div className="inline-flex rounded-full bg-oyster p-1">
                {[2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={!!duration && duration < n}
                    onClick={() => setLen(n)}
                    className={`rounded-full px-4 py-1.5 text-[0.8125rem] disabled:opacity-30 ${len === n ? 'bg-ink text-veil' : 'hover:bg-stone'}`}
                  >
                    {n} giây
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Chất lượng</p>
              <div className="inline-flex rounded-full bg-oyster p-1">
                {([
                  ['sharp', 'Nét (1080p)'],
                  ['light', 'Nhẹ (720p)'],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setQuality(k)}
                    className={`rounded-full px-4 py-1.5 text-[0.8125rem] ${quality === k ? 'bg-ink text-veil' : 'hover:bg-stone'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[0.8125rem] font-medium">Bắt đầu từ giây {start.toFixed(1)}</span>
              <input
                type="range"
                min={0}
                max={maxStart}
                step={0.1}
                value={start}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setStart(v)
                  if (preview.current) preview.current.currentTime = v
                }}
                className="w-full accent-[#7D6650]"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {canPreview && (
                <button type="button" onClick={playSegment} disabled={busy} className="btn-line !px-4 !py-2 text-[0.875rem]">
                  Xem thử đoạn này
                </button>
              )}
              <button type="button" onClick={create} disabled={busy} className="btn-ink !px-5 !py-2 text-[0.875rem] disabled:opacity-60">
                {stage === 'load'
                  ? 'Đang tải bộ xử lý video…'
                  : stage === 'encode'
                    ? `Đang nén… ${Math.round(pct * 100)}%`
                    : stage === 'upload'
                      ? 'Đang tải lên…'
                      : 'Tạo ảnh sống'}
              </button>
              {!busy && (
                <button type="button" onClick={() => setFile(null)} className="px-2 text-[0.8125rem] text-taupe underline underline-offset-4">
                  Huỷ
                </button>
              )}
            </div>
            {stage === 'load' && <p className="meta">Lần đầu cần tải bộ xử lý khoảng 30MB, những lần sau sẽ nhanh hơn.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
