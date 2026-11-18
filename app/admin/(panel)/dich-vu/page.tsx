'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SimpleList from '@/components/admin/SimpleList'
import { PageHead } from '@/components/admin/ui'
import { formatPrice } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import { SERVICE_KINDS, type Service } from '@/lib/types'

export default function ServicesAdmin() {
  const [rows, setRows] = useState<Service[] | null>(null)
  useEffect(() => {
    supabaseBrowser().from('services').select('*').order('kind').order('sort_order').then(({ data }: { data: Service[] | null }) => setRows(data ?? []))
  }, [])
  return (
    <>
      <PageHead title="Makeup & rạp cưới" desc="Các gói dịch vụ đi kèm váy cưới." action={<Link href="/admin/dich-vu/moi" className="btn-ink">Thêm dịch vụ</Link>} />
      <SimpleList
        base="/admin/dich-vu"
        empty="Chưa có dịch vụ nào."
        newLabel="Thêm dịch vụ"
        rows={rows && rows.map((s) => ({ id: s.id, title: s.name, sub: [SERVICE_KINDS[s.kind], `từ ${formatPrice(s.price_from)}`], status: s.status, thumb: s.image?.thumb ?? null }))}
      />
    </>
  )
}
