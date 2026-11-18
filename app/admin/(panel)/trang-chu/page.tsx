'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import { Card, Input, PageHead, useToast } from '@/components/admin/ui'
import { FOCUS_LABEL, HOME_SLOTS, focusClass, type Focus, type HomeMedia, type HomeSlot } from '@/lib/home-slots'
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
        desc="Mỗi ô là một vị trí trên trang chủ (ô đen trong sơ đồ). Đổi ảnh xong, trang chủ cập nhật ngay. Ô để trống sẽ tự lấy ảnh từ các váy nổi bật."
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

  async function upload(file: File) {
    setBusy(true)
    try {
      const r = await compressAndUpload(file, 'home')
      await onSave({ image: { url: r.url, thumb: r.thumb } })
    } catch (e) {
      toast((e as Error).message, 'error')
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  return (
    <Card className="grid gap-5 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.1fr)] md:items-start">
      <Schematic slot={def.slot} />

      <div
        className="relative h-[200px] max-w-full overflow-hidden rounded-xl bg-stone sm:h-[240px]"
        style={{ aspectRatio: def.ratio }}
      >
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image.url} alt="" className={`h-full w-full object-cover ${focusClass(row.focus)}`} />
        ) : (
          <span className="meta absolute inset-0 grid place-items-center p-4 text-center">
            {def.optional ? 'Không bắt buộc' : 'Đang dùng ảnh váy nổi bật'}
          </span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-veil/80 text-[0.875rem]">Đang nén và tải ảnh…</span>}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-display text-[1.375rem] leading-tight">{def.label}</h2>
          <p className="meta mt-1">{def.hint}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-ink !px-5 !py-2.5 text-[0.875rem] disabled:opacity-50">
            {row.image ? 'Đổi ảnh' : 'Tải ảnh lên'}
          </button>
          {row.image && (
            <button type="button" onClick={() => onSave({ image: null })} className="btn-line !px-5 !py-2.5 text-[0.875rem]">
              Gỡ ảnh
            </button>
          )}
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>

        {row.image && (
          <>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Khi ảnh bị cắt cho vừa khung</p>
              <div className="inline-flex rounded-full bg-oyster p-1" role="radiogroup" aria-label="Phần ảnh cần giữ">
                {(Object.keys(FOCUS_LABEL) as Focus[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={row.focus === f}
                    onClick={() => onSave({ focus: f })}
                    className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors ${row.focus === f ? 'bg-ink text-veil' : 'hover:bg-stone'}`}
                  >
                    {FOCUS_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>
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
          </>
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
