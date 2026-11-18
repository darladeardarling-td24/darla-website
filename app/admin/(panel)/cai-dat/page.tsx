'use client'
import { useEffect, useState } from 'react'
import { refreshSite } from '@/app/admin/actions'
import Link from 'next/link'
import { useStaff } from '@/components/admin/StaffContext'
import { Card, Field, Input, PageHead, Textarea, useToast } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Settings } from '@/lib/types'

const EMPTY: Settings = {
  brand_name: '', tagline: '', season_label: '', hero_title: '', hero_subtitle: '', about: '',
  instagram: '', phone: '', address: '', hours: '', marquee: '', hero_image: null,
}

export default function SettingsAdmin() {
  const { isAdmin } = useStaff()
  const toast = useToast()
  const [s, setS] = useState<Settings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    supabaseBrowser().from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }: { data: Settings | null }) => {
      if (data) setS({ ...EMPTY, ...data })
      setLoading(false)
    })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { brand_name, tagline, season_label, hero_title, hero_subtitle, about, instagram, phone, address, hours, marquee, hero_image } = s
    const { error } = await supabaseBrowser()
      .from('settings')
      .update({ brand_name, tagline, season_label, hero_title, hero_subtitle, about, instagram, phone, address, hours, marquee, hero_image, updated_at: new Date().toISOString() })
      .eq('id', 1)
    setSaving(false)
    if (error) return toast('Chưa lưu được: ' + error.message, 'error')
    await refreshSite()
    toast('Đã cập nhật thông tin website.')
  }

  if (!isAdmin) return <PageHead title="Thông tin website" desc="Mục này chỉ quản trị viên được chỉnh sửa." />
  if (loading) return <p className="meta">Đang tải…</p>

  const txt = (k: keyof Settings) => ({ value: (s[k] as string) ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never) })

  return (
    <form onSubmit={save}>
      <PageHead title="Thông tin website" desc="Chữ ở trang chủ, Instagram nhận tư vấn và thông tin liên hệ." action={<button disabled={saving} className="btn-ink disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-[1.375rem]">Trang chủ</h2>
          <Field label="Dòng mùa / bộ sưu tập" hint="Hiện ở góc trên và trên ảnh bìa.">
            <Input {...txt('season_label')} />
          </Field>
          <Field label="Câu tiêu đề" hint="Chữ lớn đè trên ảnh đầu trang. Nên ngắn, khoảng 5–8 chữ.">
            <Input {...txt('hero_title')} />
          </Field>
          <Field label="Đoạn giới thiệu dưới tiêu đề">
            <Textarea rows={3} {...txt('hero_subtitle')} />
          </Field>
          <Field label="Giới thiệu thương hiệu">
            <Textarea rows={4} {...txt('about')} />
          </Field>
          <Field label="Dải chữ chạy" hint="Các cụm cách nhau bằng dấu phẩy.">
            <Input {...txt('marquee')} />
          </Field>
          <p className="meta">
            Ảnh trên trang chủ được đổi trong mục{' '}
            <Link href="/admin/trang-chu" className="text-ink underline underline-offset-4">Ảnh trang chủ</Link>.
          </p>
        </Card>
        <Card className="space-y-4 self-start">
          <h2 className="font-display text-[1.375rem]">Liên hệ</h2>
          <Field label="Instagram nhận tư vấn" hint="Chỉ cần tên tài khoản, ví dụ: darla.deardarling. Mọi nút tư vấn trên web sẽ mở tin nhắn tới tài khoản này.">
            <Input {...txt('instagram')} placeholder="darla.deardarling" />
          </Field>
          <Field label="Số điện thoại">
            <Input {...txt('phone')} />
          </Field>
          <Field label="Địa chỉ showroom">
            <Input {...txt('address')} />
          </Field>
          <Field label="Giờ mở cửa">
            <Input {...txt('hours')} />
          </Field>
        </Card>
      </div>
    </form>
  )
}
