'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import ImageField from '@/components/admin/ImageField'
import { useStaff } from '@/components/admin/StaffContext'
import { BackLink, Card, Field, Input, PageHead, Textarea, Toggle, useToast } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Offer } from '@/lib/types'

type Draft = Omit<Offer, 'id'>
const EMPTY: Draft = { title: '', highlight: '', description: '', terms: '', start_date: null, end_date: null, image: null, status: 'published', sort_order: 0 }

export default function OfferEdit() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'moi'
  const router = useRouter()
  const toast = useToast()
  const { isAdmin } = useStaff()
  const [d, setD] = useState<Draft>(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    if (isNew) return
    supabaseBrowser().from('offers').select('*').eq('id', id).maybeSingle().then(({ data }: { data: (Offer & { created_at?: string }) | null }) => {
      if (data) {
        const { id: _i, created_at: _c, ...rest } = data
        setD(rest)
      }
      setLoading(false)
    })
  }, [id, isNew])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const sb = supabaseBrowser()
    const payload = { ...d, start_date: d.start_date || null, end_date: d.end_date || null }
    const res = isNew ? await sb.from('offers').insert(payload).select('id').single() : await sb.from('offers').update(payload).eq('id', id).select('id').single()
    setSaving(false)
    if (res.error) return toast('Chưa lưu được: ' + res.error.message, 'error')
    await refreshSite()
    toast('Đã lưu ưu đãi.')
    if (isNew) router.replace(`/admin/uu-dai/${res.data.id}`)
  }

  async function remove() {
    if (!confirm(`Xoá ưu đãi "${d.title}"?`)) return
    const { error } = await supabaseBrowser().from('offers').delete().eq('id', id)
    if (error) return toast('Chưa xoá được: ' + error.message, 'error')
    await refreshSite()
    router.replace('/admin/uu-dai')
  }

  if (loading) return <p className="meta">Đang tải…</p>
  return (
    <form onSubmit={save}>
      <BackLink href="/admin/uu-dai" label="Ưu đãi" />
      <PageHead title={isNew ? 'Thêm ưu đãi' : d.title} action={<button disabled={saving} className="btn-ink disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Field label="Con số nổi bật" hint="Ví dụ: -20%, Miễn phí">
              <Input value={d.highlight ?? ''} onChange={(e) => set('highlight', e.target.value)} />
            </Field>
            <Field label="Tên ưu đãi">
              <Input required value={d.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
          </div>
          <Field label="Nội dung">
            <Textarea value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Điều kiện áp dụng">
            <Input value={d.terms ?? ''} onChange={(e) => set('terms', e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium">Ảnh (không bắt buộc)</p>
            <ImageField value={d.image ? [d.image] : []} onChange={(v) => set('image', v[0] ?? null)} folder="offers" max={1} />
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="space-y-4">
            <Field label="Ngày bắt đầu">
              <Input type="date" value={d.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} />
            </Field>
            <Field label="Ngày kết thúc" hint="Để trống nếu không giới hạn.">
              <Input type="date" value={d.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} />
            </Field>
            <Toggle checked={d.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} label="Hiện trên website" />
            <Field label="Thứ tự hiển thị">
              <Input type="number" value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </Field>
          </Card>
          {!isNew && isAdmin && (
            <button type="button" onClick={remove} className="w-full rounded-full border border-[#7a1f1f]/40 px-5 py-3 text-[0.9375rem] text-[#7a1f1f] hover:bg-[#7a1f1f] hover:text-veil">Xoá ưu đãi</button>
          )}
        </div>
      </div>
    </form>
  )
}
