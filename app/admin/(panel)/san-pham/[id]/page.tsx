'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import ImageField from '@/components/admin/ImageField'
import { useStaff } from '@/components/admin/StaffContext'
import { BackLink, Card, Field, Input, PageHead, PriceInput, Select, Textarea, Toggle, useToast } from '@/components/admin/ui'
import { slugify } from '@/lib/format'
import { removeImage } from '@/lib/image'
import { supabaseBrowser } from '@/lib/supabase/client'
import { ATTR_KINDS } from '@/lib/attributes'
import type { Attribute, Category, Collection, Product } from '@/lib/types'

type Draft = Omit<Product, 'id' | 'created_at' | 'updated_at'>

const EMPTY: Draft = {
  code: '', name: '', slug: '', category_id: null, silhouette: '', material: '', sizes: '',
  price_rent: null, price_sale: null, price_note: 'Giá thuê trọn gói 3 ngày', short_desc: '', description: '',
  images: [], collection_id: null, attrs: [], is_featured: false, is_new: true, status: 'published', sort_order: 0,
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'moi'
  const router = useRouter()
  const toast = useToast()
  const { isAdmin } = useStaff()
  const [d, setD] = useState<Draft>(EMPTY)
  const [cats, setCats] = useState<Category[]>([])
  const [cols, setCols] = useState<Collection[]>([])
  const [attrs, setAttrs] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('collections').select('*').order('sort_order').then(({ data }: { data: Collection[] | null }) => setCols(data ?? []))
    sb.from('attributes').select('*').order('sort_order').then(({ data }: { data: Attribute[] | null }) => setAttrs(data ?? []))
    sb.from('categories').select('*').order('sort_order').then(({ data }: { data: Category[] | null }) => {
      setCats(data ?? [])
      if (isNew && data?.[0]) setD((x) => ({ ...x, category_id: x.category_id ?? data[0].id }))
    })
    if (!isNew)
      sb.from('products').select('*').eq('id', id).maybeSingle().then(({ data }: { data: Product | null }) => {
        if (data) {
          const { id: _i, created_at: _c, updated_at: _u, ...rest } = data
          setD(rest)
        }
        setLoading(false)
      })
  }, [id, isNew])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!d.name.trim()) return toast('Hãy nhập tên sản phẩm.', 'error')
    setSaving(true)
    const payload = { ...d, name: d.name.trim(), slug: slugify(d.slug || d.name) || `vay-${Date.now()}` }
    const sb = supabaseBrowser()
    const res = isNew
      ? await sb.from('products').insert(payload).select('id').single()
      : await sb.from('products').update(payload).eq('id', id).select('id').single()
    setSaving(false)
    if (res.error) {
      const dup = res.error.code === '23505'
      return toast(dup ? 'Đường dẫn này đã có sản phẩm khác dùng. Hãy đổi đường dẫn.' : 'Chưa lưu được: ' + res.error.message, 'error')
    }
    await refreshSite()
    toast('Đã lưu sản phẩm.')
    if (isNew) router.replace(`/admin/san-pham/${res.data.id}`)
  }

  async function remove() {
    if (!confirm(`Xoá vĩnh viễn "${d.name}" và toàn bộ ảnh của sản phẩm này?`)) return
    const { error } = await supabaseBrowser().from('products').delete().eq('id', id)
    if (error) return toast('Chưa xoá được: ' + error.message, 'error')
    await Promise.all(d.images.map((im) => removeImage(im).catch(() => {})))
    await refreshSite()
    toast('Đã xoá sản phẩm.')
    router.replace('/admin/san-pham')
  }

  if (loading) return <p className="meta">Đang tải…</p>

  return (
    <form onSubmit={save}>
      <BackLink href="/admin/san-pham" label="Sản phẩm" />
      <PageHead
        title={isNew ? 'Thêm sản phẩm' : d.name || 'Sửa sản phẩm'}
        action={
          <div className="flex gap-2">
            {!isNew && d.status === 'published' && (
              <a href={`/bo-suu-tap/${d.slug}`} target="_blank" className="btn-line">Xem trên web</a>
            )}
            <button disabled={saving} className="btn-ink disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Field label="Tên sản phẩm">
                <Input
                  value={d.name}
                  onChange={(e) => {
                    set('name', e.target.value)
                    if (!slugTouched) set('slug', slugify(e.target.value))
                  }}
                  placeholder="Ví dụ: Amélie"
                  required
                />
              </Field>
              <Field label="Mã váy">
                <Input value={d.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="DL-001" />
              </Field>
            </div>
            <Field label="Mô tả ngắn" hint="Một câu, hiện trong danh sách và đầu trang chi tiết.">
              <Input value={d.short_desc ?? ''} onChange={(e) => set('short_desc', e.target.value)} />
            </Field>
            <Field label="Mô tả chi tiết">
              <Textarea rows={6} value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </Card>

          <Card>
            <p className="mb-3 text-[0.8125rem] font-medium">Ảnh sản phẩm</p>
            <ImageField value={d.images} onChange={(v) => set('images', v)} folder="products" />
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="font-display text-[1.375rem]">Thông số & bộ lọc</h2>
              <p className="meta mt-1">
                Bấm để chọn (chọn được nhiều). Khách dùng các lựa chọn này để lọc váy. Thiếu lựa chọn nào thì thêm ở{' '}
                <a href="/admin/bo-loc" target="_blank" className="text-ink underline underline-offset-4">Bộ lọc</a>.
              </p>
            </div>
            {ATTR_KINDS.map((k) => {
              const opts = attrs.filter((a) => a.kind === k.kind)
              if (!opts.length) return null
              return (
                <div key={k.kind}>
                  <p className="mb-2 text-[0.8125rem] font-medium">{k.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opts.map((a) => {
                      const on = (d.attrs ?? []).includes(a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set('attrs', on ? (d.attrs ?? []).filter((x) => x !== a.id) : [...(d.attrs ?? []), a.id])}
                          className={`rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors ${on ? 'border-ink bg-ink text-veil' : 'border-ink/20 hover:border-ink'}`}
                        >
                          {a.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {(d.silhouette || d.material) && !(d.attrs ?? []).length && (
              <p className="meta rounded-xl bg-oyster px-3 py-2">
                Thông tin cũ: {[d.silhouette, d.material].filter(Boolean).join(', ')}. Hãy chọn lại ở trên để váy xuất hiện khi khách lọc.
              </p>
            )}
            <Field label="Size">
              <Input value={d.sizes ?? ''} onChange={(e) => set('sizes', e.target.value)} placeholder="XS – L (may đo theo số đo)" />
            </Field>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4">
            <Field label="Giá thuê">
              <PriceInput value={d.price_rent} onChange={(v) => set('price_rent', v)} />
            </Field>
            <Field label="Giá bán / may đo">
              <PriceInput value={d.price_sale} onChange={(v) => set('price_sale', v)} />
            </Field>
            <Field label="Ghi chú giá">
              <Input value={d.price_note ?? ''} onChange={(e) => set('price_note', e.target.value)} />
            </Field>
          </Card>

          <Card className="space-y-4">
            <Field label="Danh mục">
              <Select
                value={d.category_id ?? ''}
                onChange={(e) => {
                  const v = e.target.value || null
                  set('category_id', v)
                  const cur = cols.find((c) => c.id === d.collection_id)
                  if (cur && cur.category_id && cur.category_id !== v) set('collection_id', null)
                }}
              >
                <option value="">Chưa phân loại</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Bộ sưu tập" hint="Quản lý tên bộ sưu tập ở mục Bộ sưu tập.">
              <Select value={d.collection_id ?? ''} onChange={(e) => set('collection_id', e.target.value || null)}>
                <option value="">Không thuộc bộ sưu tập nào</option>
                {cols
                  .filter((c) => !d.category_id || !c.category_id || c.category_id === d.category_id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.status === 'draft' ? ' (nháp)' : ''}</option>
                  ))}
              </Select>
            </Field>
            <Toggle checked={d.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} label="Hiện trên website" />
            <Toggle checked={d.is_featured} onChange={(v) => set('is_featured', v)} label="Nổi bật ở trang chủ" />
            <Toggle checked={d.is_new} onChange={(v) => set('is_new', v)} label="Gắn nhãn Mới" />
            <Field label="Thứ tự hiển thị" hint="Số nhỏ hiện trước.">
              <Input type="number" value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Đường dẫn" hint={`website/bo-suu-tap/${d.slug || '…'}`}>
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
              Xoá sản phẩm
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
