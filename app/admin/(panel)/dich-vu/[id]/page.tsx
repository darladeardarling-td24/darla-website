'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import ImageField from '@/components/admin/ImageField'
import { useStaff } from '@/components/admin/StaffContext'
import { BackLink, Card, Field, Input, PageHead, PriceInput, Select, Textarea, Toggle, useToast } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import { SERVICE_KINDS, type Service, type ServiceKind } from '@/lib/types'

type Draft = Omit<Service, 'id'>
const EMPTY: Draft = { kind: 'makeup', name: '', price_from: null, price_note: '', description: '', features: [], image: null, status: 'published', sort_order: 0 }

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'moi'
  const router = useRouter()
  const toast = useToast()
  const { isAdmin } = useStaff()
  const [d, setD] = useState<Draft>(EMPTY)
  const [features, setFeatures] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    if (isNew) return
    supabaseBrowser().from('services').select('*').eq('id', id).maybeSingle().then(({ data }: { data: (Service & { created_at?: string }) | null }) => {
      if (data) {
        const { id: _i, created_at: _c, ...rest } = data
        setD(rest)
        setFeatures(rest.features.join('\n'))
      }
      setLoading(false)
    })
  }, [id, isNew])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const sb = supabaseBrowser()
    const payload = { ...d, features: features.split('\n').map((s) => s.trim()).filter(Boolean) }
    const res = isNew ? await sb.from('services').insert(payload).select('id').single() : await sb.from('services').update(payload).eq('id', id).select('id').single()
    setSaving(false)
    if (res.error) return toast('Chưa lưu được: ' + res.error.message, 'error')
    await refreshSite()
    toast('Đã lưu dịch vụ.')
    if (isNew) router.replace(`/admin/dich-vu/${res.data.id}`)
  }

  async function remove() {
    if (!confirm(`Xoá dịch vụ "${d.name}"?`)) return
    const { error } = await supabaseBrowser().from('services').delete().eq('id', id)
    if (error) return toast('Chưa xoá được: ' + error.message, 'error')
    await refreshSite()
    router.replace('/admin/dich-vu')
  }

  if (loading) return <p className="meta">Đang tải…</p>
  return (
    <form onSubmit={save}>
      <BackLink href="/admin/dich-vu" label="Makeup & rạp cưới" />
      <PageHead title={isNew ? 'Thêm dịch vụ' : d.name} action={<button disabled={saving} className="btn-ink disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="Nhóm">
              <Select value={d.kind} onChange={(e) => set('kind', e.target.value as ServiceKind)}>
                {Object.entries(SERVICE_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tên gói">
              <Input required value={d.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
          </div>
          <Field label="Mô tả">
            <Textarea value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Bao gồm" hint="Mỗi dòng một ý, ví dụ: Trang điểm + làm tóc">
            <Textarea rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium">Ảnh (không bắt buộc)</p>
            <ImageField value={d.image ? [d.image] : []} onChange={(v) => set('image', v[0] ?? null)} folder="services" max={1} />
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="space-y-4">
            <Field label="Giá từ">
              <PriceInput value={d.price_from} onChange={(v) => set('price_from', v)} />
            </Field>
            <Field label="Ghi chú giá" hint="Ví dụ: Rạp 6 – 8 bàn">
              <Input value={d.price_note ?? ''} onChange={(e) => set('price_note', e.target.value)} />
            </Field>
            <Toggle checked={d.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} label="Hiện trên website" />
            <Field label="Thứ tự hiển thị">
              <Input type="number" value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </Field>
          </Card>
          {!isNew && isAdmin && (
            <button type="button" onClick={remove} className="w-full rounded-full border border-[#7a1f1f]/40 px-5 py-3 text-[0.9375rem] text-[#7a1f1f] hover:bg-[#7a1f1f] hover:text-veil">Xoá dịch vụ</button>
          )}
        </div>
      </div>
    </form>
  )
}
