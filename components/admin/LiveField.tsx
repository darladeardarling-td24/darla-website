'use client'
import { useEffect, useRef, useState } from 'react'
import { loadFFmpeg, makeLive, uploadLive } from '@/lib/live'
import type { Img } from '@/lib/types'
import { useToast } from './ui'

type Props = { images: Img[]; onChange: (v: Img[]) => void }

/**
 * Ảnh sống cho ảnh bìa của váy: chọn video từ điện thoại → chọn đoạn 2–3 giây →
 * tự nén ngay trên máy (không cần phần mềm khác) → tải lên.
 */
export default function LiveField({ images, onChange }: Props) {
  const cover = images[0]
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState<number | null>(null)
  const [canPreview, setCanPreview] = useState(true)
  const [start, setStart] = useState(0)
  const [len, setLen] = useState(3)
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
    // Tải sẵn bộ xử lý trong lúc nhân viên chọn đoạn
    loadFFmpeg().catch(() => {})
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
    try {
      setStage('load')
      await loadFFmpeg()
      setStage('encode')
      setPct(0)
      const r = await makeLive(file, { start, duration: len }, setPct)
      setStage('upload')
      const { video, poster } = await uploadLive(r)
      const next = images.length ? [{ ...images[0], live: video }, ...images.slice(1)] : [{ url: poster, thumb: poster, live: video }]
      onChange(next)
      toast(`Đã tạo ảnh sống: ${(r.inputKB / 1024).toFixed(1)}MB → ${r.outputKB}KB. Bấm Lưu để cập nhật lên web.`)
      setFile(null)
    } catch (e) {
      toast((e as Error).message || 'Không tạo được ảnh sống.', 'error')
    }
    setStage('')
  }

  const busy = stage !== ''
  const maxStart = duration ? Math.max(0, duration - len) : 30

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-[0.8125rem] font-medium">Ảnh sống (video 2–3 giây)</p>
          <p className="meta mt-1">
            Chọn video quay bằng điện thoại (iPhone quay .MOV cũng được). Web tự cắt, bỏ tiếng và nén còn khoảng 150–300KB. Ảnh bìa sẽ chuyển động khi khách rê chuột hoặc lướt tới.
          </p>
        </div>
        {!file && (
          <button type="button" onClick={() => input.current?.click()} className="btn-line !px-4 !py-2 text-[0.875rem]">
            {cover?.live ? 'Tạo lại từ video khác' : 'Chọn video'}
          </button>
        )}
        <input ref={input} type="file" accept="video/*,.mov,.mp4,.m4v" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
      </div>

      {cover?.live && !file && (
        <div className="mt-4 flex items-end gap-4">
          <video src={cover.live} poster={cover.thumb} muted loop autoPlay playsInline className="aspect-[3/4] w-32 rounded-xl bg-stone object-cover" />
          <div className="space-y-2">
            <p className="text-[0.875rem]">Ảnh bìa đang có ảnh sống.</p>
            <button type="button" onClick={() => onChange([{ ...cover, live: undefined }, ...images.slice(1)])} className="text-[0.8125rem] text-[#7a1f1f] underline underline-offset-4">
              Gỡ ảnh sống
            </button>
          </div>
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
