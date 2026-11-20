'use client'
import { useRef, useState } from 'react'
import { compressAndUpload } from '@/lib/image'
import type { Img } from '@/lib/types'
import { useToast } from './ui'

type Props = {
  value: Img[]
  onChange: (v: Img[]) => void
  folder: string
  max?: number
}

/**
 * Quản lý ảnh: chọn nhiều ảnh cùng lúc, tự nén trước khi tải lên,
 * sắp xếp thứ tự (ảnh đầu tiên là ảnh bìa) và gỡ ảnh.
 */
export default function ImageField({ value, onChange, folder, max = 12 }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string>('')
  const [drag, setDrag] = useState(false)
  const toast = useToast()

  async function handle(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, max - value.filter((v) => !v.live).length))
    if (!list.length) return toast(`Tối đa ${max} ảnh.`, 'error')
    let next = [...value]
    let before = 0
    let after = 0
    for (let i = 0; i < list.length; i++) {
      setBusy(`Đang nén và tải ảnh ${i + 1}/${list.length}…`)
      try {
        const r = await compressAndUpload(list[i], folder)
        next = [...next, { url: r.url, thumb: r.thumb }]
        before += r.originalKB
        after += r.savedKB
        onChange(next)
      } catch (e) {
        toast((e as Error).message, 'error')
      }
    }
    setBusy('')
    if (after) toast(`Đã tải ${list.length} ảnh: ${(before / 1024).toFixed(1)}MB → ${(after / 1024).toFixed(1)}MB`)
    if (input.current) input.current.value = ''
  }

  function move(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
          {value.map((im, i) => (
            <li key={im.url} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-stone">
              {im.live ? (
                <video src={im.live} poster={im.thumb || im.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={im.thumb || im.url} alt="" className="h-full w-full object-cover" />
              )}
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] text-veil">Ảnh bìa</span>}
              {im.live && (
                <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-veil/90 text-mocha" title="Ảnh sống" aria-label="Ảnh sống">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="12" r="6.5" />
                  </svg>
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-7 w-7 rounded-full bg-veil/90 text-[0.8rem] disabled:opacity-30" aria-label="Đưa lên trước">‹</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="h-7 w-7 rounded-full bg-veil/90 text-[0.8rem] disabled:opacity-30" aria-label="Đưa ra sau">›</button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, k) => k !== i))}
                  className="h-7 rounded-full bg-veil/90 px-2.5 text-[0.75rem]"
                >
                  Gỡ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.filter((v) => !v.live).length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            handle(e.dataTransfer.files)
          }}
          disabled={!!busy}
          className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${drag ? 'border-ink bg-stone' : 'border-ink/30 hover:border-ink'}`}
        >
          <span className="text-[0.9375rem] font-medium">{busy || (value.length ? 'Thêm ảnh' : 'Chọn ảnh hoặc kéo thả vào đây')}</span>
          <span className="meta mt-1">Ảnh được tự động nén (giữ nét ren, voan). Nên dùng ảnh dọc 3:4.</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => e.target.files && handle(e.target.files)} />
    </div>
  )
}
