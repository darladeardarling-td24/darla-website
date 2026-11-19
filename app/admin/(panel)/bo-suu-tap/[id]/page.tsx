'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import ImageField from '@/components/admin/ImageField'
import { useStaff } from '@/components/admin/StaffContext'
import { BackLink, Card, Field, Input, PageHead, Select, Textarea, Toggle, useToast } from '@/components/admin/ui'
import { slugify } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Category, Collection, Product } from '@/lib/types'

type Draft = Omit<Collection, 'id'>
const EMPTY: Draft = {
  name: '', slug: '', category_id: null, tagline: '', description: '', cover: null,
  launched_on: new Date().toISOString().slice(0, 10), is_new: true, status: 'published', sort_order: 0,
}

export default function CollectionEdit() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'moi'
  const router = useRouter()
  const toast = useToast()
  const { isAdmin } = useStaff()
  const [d, setD] = useState<Draft>(EMPTY)
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('categories').select('*').order('sort_order').then(({ data }: { data: Category[] | null }) => {
      setCats(data ?? [])
      if (isNew && data?.[0]) setD((x) => ({ ...x, category_id: x.category_id ?? data[0].id }))
    })
    if (!isNew) {
      sb.from('collections').select('*').eq('id', id).maybeSingle().then(({ data }: { data: (Collection & { created_at?: string }) | null }) => {
        if (data) {
          const { id: _i, created_at: _c, ...rest } = data
          setD(rest)
        }
        setLoading(false)
      })
      sb.from('products').select('*').eq('collection_id', id).order('sort_order').then(({ data }: { data: Product[] | null }) => setItems(data ?? []))
    }
  }, [id, isNew])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!d.name.trim()) return toast('Hãy đặt tên bộ sưu tập.', 'error')
    setSaving(true)
    const payload = { ...d, name: d.name.trim(), slug: slugify(d.slug || d.name), launched_on: d.launched_on || null }
    const sb = supabaseBrowser()
    const res = isNew
      ? await sb.from('collections').insert(payload).select('id').single()
      : await sb.from('collections').update(payload).eq('id', id).select('id').single()
    setSaving(false)
    if (res.error) return toast(res.error.code === '23505' ? 'Tên đường dẫn này đã có bộ sưu tập khác dùng.' : 'Chưa lưu được: ' + res.error.message, 'error')
    await refreshSite()
    toast('Đã lưu bộ sưu tập.')
    if (isNew) router.replace(`/admin/bo-suu-tap/${res.data.id}`)
  }

  async function remove() {
    if (!confirm(`Xoá bộ sưu tập "${d.name}"? Các váy bên trong vẫn còn, chỉ không thuộc bộ sưu tập nào nữa.`)) return
    const { error } = await supabaseBrowser().from('collections').delete().eq('id', id)
    if (error) return toast('Chưa xoá được: ' + error.message, 'error')
    await refreshSite()
    router.replace('/admin/bo-suu-tap')
  }

  if (loading) return <p className="meta">Đang tải…</p>
  return (
    <form onSubmit={save}>
      <BackLink href="/admin/bo-suu-tap" label="Bộ sưu tập" />
      <PageHead
        title={isNew ? 'Thêm bộ sưu tập' : d.name}
        action={
          <div className="flex gap-2">
            {!isNew && d.status === 'published' && <a href={`/bo-suu-tap?bst=${d.slug}`} target="_blank" className="btn-line">Xem trên web</a>}
            <button disabled={saving} className="btn-ink disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <Field label="Tên bộ sưu tập" hint="Ngắn, dễ nhớ. Ví dụ: Lumière, Héritage, Soirée.">
              <Input
                required
                value={d.name}
                onChange={(e) => {
                  set('name', e.target.value)
                  if (!slugTouched) set('slug', slugify(e.target.value))
                }}
              />
            </Field>
            <Field label="Câu giới thiệu ngắn" hint="Hiện dưới tên trên thẻ bộ sưu tập.">
              <Input value={d.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Lụa trơn, phom sạch, ánh sáng tự nhiên" />
            </Field>
            <Field label="Mô tả">
              <Textarea value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Ảnh bìa (không bắt buộc)</p>
              <ImageField value={d.cover ? [d.cover] : []} onChange={(v) => set('cover', v[0] ?? null)} folder="collections" max={1} />
            </div>
          </Card>
          {!isNew && (
            <Card>
              <p className="mb-3 text-[0.8125rem] font-medium">Váy trong bộ sưu tập ({items.length})</p>
              {items.length ? (
                <ul className="flex flex-wrap gap-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      <a href={`/admin/san-pham/${p.id}`} className="rounded-full bg-oyster px-3 py-1.5 text-[0.875rem] hover:bg-stone">{p.name}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="meta">Chưa có váy nào. Mở một sản phẩm và chọn bộ sưu tập này.</p>
              )}
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card className="space-y-4">
            <Field label="Thuộc danh mục">
              <Select value={d.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                <option value="">Chưa chọn</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày ra mắt">
              <Input type="date" value={d.launched_on ?? ''} onChange={(e) => set('launched_on', e.target.value)} />
            </Field>
            <Toggle checked={d.is_new} onChange={(v) => set('is_new', v)} label="Gắn nhãn Mới ra (hiện ở trang chủ)" />
            <Toggle checked={d.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} label="Hiện trên website" />
            <Field label="Thứ tự hiển thị" hint="Số nhỏ hiện trước.">
              <Input type="number" value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Đường dẫn" hint={`website/bo-suu-tap?bst=${d.slug || '…'}`}>
              <Input
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', slugify(e.target.value))
                }}
              />
            </Field>
          </Card>
          {!isNew && isAdmin && (
            <button type="button" onClick={remove} className="w-full rounded-full border border-[#7a1f1f]/40 px-5 py-3 text-[0.9375rem] text-[#7a1f1f] hover:bg-[#7a1f1f] hover:text-veil">
              Xoá bộ sưu tập
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
