'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { Card, Input, PageHead, useToast } from '@/components/admin/ui'
import { HOME_SLOTS, type HomeMedia, type HomeSlot } from '@/lib/home-slots'
import { compressAndUpload } from '@/lib/image'
import { supabaseBrowser } from '@/lib/supabase/client'

type Row = Omit<HomeMedia, 'slot'>
const EMPTY: Row = { image: null, focus: 'center', caption: null }

export default function HomeImagesAdmin() {
  const [rows, setRows] = useState<Partial<Record<HomeSlot, Row>> | null>(null)
  const toast = useToast()

  useEffect(() => {
    supabaseBrowser()
      .from('home_media')
      .select('*')
      .then(({ data, error }: { data: HomeMedia[] | null; error: { message: string } | null }) => {
        if (error) toast('Chưa đọc được ảnh trang chủ. Bạn đã chạy file supabase/update-01-anh-trang-chu.sql chưa?', 'error')
        setRows(Object.fromEntries((data ?? []).map((r) => [r.slot, r])))
      })
  }, [toast])

  async function save(slot: HomeSlot, patch: Partial<Row>) {
    const next = { ...EMPTY, ...rows?.[slot], ...patch }
    setRows((r) => ({ ...r, [slot]: next }))
    const { error } = await supabaseBrowser()
      .from('home_media')
      .upsert({ slot, ...next, updated_at: new Date().toISOString() }, { onConflict: 'slot' })
    if (error) return toast('Chưa lưu được: ' + error.message, 'error')
    await refreshSite()
    toast('Đã cập nhật trang chủ.')
  }

  return (
    <>
      <PageHead
        title="Ảnh trang chủ"
        desc="Mỗi ô là một vị trí trên trang chủ (ô đen trong sơ đồ). Bấm vào ảnh để chọn điểm giữ lại khi ảnh bị cắt; khung xem trước bên cạnh cho thấy đúng như trên web."
        action={<Link href="/" target="_blank" className="btn-line">Xem trang chủ</Link>}
      />
      {rows === null ? (
        <p className="meta">Đang tải…</p>
      ) : (
        <div className="space-y-4">
          {HOME_SLOTS.map((def) => (
            <SlotCard key={def.slot} def={def} row={{ ...EMPTY, ...rows[def.slot] }} onSave={(p) => save(def.slot, p)} />
          ))}
        </div>
      )}
    </>
  )
}

function SlotCard({ def, row, onSave }: { def: (typeof HOME_SLOTS)[number]; row: Row; onSave: (p: Partial<Row>) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [caption, setCaption] = useState(row.caption ?? '')
  const toast = useToast()
  const img = row.image
  const isHero = def.slot === 'hero' || def.slot === 'hero_mobile'
  const pos = img ? `${img.fx ?? 50}% ${img.fy ?? 50}%` : '50% 50%'

  async function upload(file: File) {
    setBusy(true)
    try {
      const r = await compressAndUpload(file, 'home')
      await onSave({ image: { url: r.url, thumb: r.thumb, text: r.text, fx: 50, fy: 40 } })
    } catch (e) {
      toast((e as Error).message, 'error')
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  function pickPoint(e: React.MouseEvent<HTMLImageElement>) {
    if (!img) return
    const r = e.currentTarget.getBoundingClientRect()
    const fx = Math.round(((e.clientX - r.left) / r.width) * 100)
    const fy = Math.round(((e.clientY - r.top) / r.height) * 100)
    onSave({ image: { ...img, fx, fy } })
  }

  // Khung xem trước theo đúng tỉ lệ hiển thị trên web
  const previews: [string, string][] =
    def.slot === 'hero' ? [['Máy tính', '16 / 9'], ['Điện thoại', '9 / 19']] : def.slot === 'hero_mobile' ? [['Điện thoại', '9 / 19']] : [['Trên web', def.ratio]]

  return (
    <Card className="grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)]">
      <Schematic slot={def.slot} />

      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <h2 className="font-display text-[1.375rem] leading-tight">{def.label}</h2>
            <p className="meta mt-1">{def.hint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-ink !px-5 !py-2.5 text-[0.875rem] disabled:opacity-50">
              {busy ? 'Đang nén và tải ảnh…' : img ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {img && (
              <button type="button" onClick={() => onSave({ image: null })} className="btn-line !px-5 !py-2.5 text-[0.875rem]">
                Gỡ ảnh
              </button>
            )}
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
        </div>

        {!img ? (
          <p className="meta rounded-xl bg-oyster px-4 py-6 text-center">
            {def.optional ? 'Không bắt buộc. Để trống thì web dùng ảnh mặc định.' : 'Đang dùng tạm ảnh từ các váy nổi bật.'}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-5">
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Bấm vào điểm quan trọng nhất (thường là gương mặt cô dâu)</p>
              <div className="relative inline-block overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb || img.url} alt="" onClick={pickPoint} className="block h-[160px] w-auto max-w-full cursor-crosshair sm:h-[180px]" />
                <span
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                  style={{ left: `${img.fx ?? 50}%`, top: `${img.fy ?? 50}%` }}
                />
              </div>
            </div>
            {previews.map(([label, ratio]) => (
              <div key={label}>
                <p className="meta mb-1.5">{label}</p>
                <div className="relative h-[160px] overflow-hidden rounded-xl bg-stone sm:h-[180px]" style={{ aspectRatio: ratio }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb || img.url} alt="" className="h-full w-full object-cover" style={{ objectPosition: pos }} />
                  {isHero && (
                    <span className={`absolute bottom-3 left-3 font-display text-[1rem] leading-tight ${img.text === 'sand' ? 'text-latte' : img.text === 'ink' ? 'text-ink' : 'text-veil'}`}>
                      Tiêu đề
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {img && (
          <div className="grid gap-4 md:grid-cols-2">
            {isHero && (
              <div>
                <p className="mb-1.5 text-[0.8125rem] font-medium">Màu chữ trên ảnh</p>
                <div className="inline-flex rounded-full bg-oyster p-1" role="radiogroup" aria-label="Màu chữ trên ảnh">
                  {([
                    ['sand', 'Chữ be'],
                    ['ink', 'Chữ đen'],
                    ['veil', 'Chữ trắng'],
                  ] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={(img.text ?? 'veil') === v}
                      onClick={() => onSave({ image: { ...img, text: v } })}
                      className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors ${(img.text ?? 'veil') === v ? 'bg-ink text-veil' : 'hover:bg-stone'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <p className="meta mt-1.5">Áp dụng cho logo, menu, tiêu đề và nút trên ảnh. Chữ be và chữ đen hợp ảnh sáng; chữ trắng hợp ảnh tối.</p>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[0.8125rem] font-medium">Chú thích nhỏ (không bắt buộc)</span>
              <div className="flex gap-2">
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ví dụ: Váy Amélie, lụa satin Ý" />
                {caption !== (row.caption ?? '') && (
                  <button type="button" onClick={() => onSave({ caption: caption.trim() || null })} className="btn-ink shrink-0 !px-4 !py-2 text-[0.875rem]">
                    Lưu
                  </button>
                )}
              </div>
            </label>
          </div>
        )}
      </div>
    </Card>
  )
}

/** Sơ đồ thu nhỏ của trang chủ, tô đen vị trí đang chỉnh */
function Schematic({ slot }: { slot: HomeSlot }) {
  const on = (s: HomeSlot) => (s === slot ? 'bg-ink' : 'bg-ink/10')
  if (slot === 'hero_mobile')
    return (
      <div className="mx-auto h-[150px] w-[76px] rounded-[14px] border border-ink/25 p-1.5" aria-hidden>
        <div className="mb-1 h-1.5 w-6 rounded bg-ink/15" />
        <div className="h-[82px] rounded-md bg-ink" />
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 rounded bg-ink/10" />
          <div className="h-1.5 w-2/3 rounded bg-ink/10" />
        </div>
      </div>
    )
  return (
    <div className="relative mx-auto h-[150px] w-[120px] rounded-lg border border-ink/20 bg-veil p-1.5" aria-hidden>
      <div className="mb-1 h-1.5 w-8 rounded bg-ink/15" />
      <div className={`relative h-[58px] rounded ${on('hero')}`}>
        <div className={`absolute bottom-1.5 right-1.5 h-[30px] w-[22px] rounded-sm ${slot === 'hero_detail' ? 'bg-veil ring-2 ring-ink' : 'bg-veil/40'}`} />
      </div>
      <div className="my-1.5 h-1.5 rounded bg-ink/80" />
      <div className="grid grid-cols-[1fr_1.3fr_0.8fr] gap-1">
        <div className={`h-[52px] rounded-sm ${on('look_1')}`} />
        <div className="space-y-1">
          <div className="h-1.5 rounded bg-ink/10" />
          <div className={`h-[28px] rounded-sm ${on('look_2')}`} />
        </div>
        <div className={`mt-3 h-[40px] rounded-sm ${on('look_3')}`} />
      </div>
    </div>
  )
}
