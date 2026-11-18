'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SimpleList from '@/components/admin/SimpleList'
import { PageHead } from '@/components/admin/ui'
import { formatDate } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Offer } from '@/lib/types'

export default function OffersAdmin() {
  const [rows, setRows] = useState<Offer[] | null>(null)
  useEffect(() => {
    supabaseBrowser().from('offers').select('*').order('sort_order').then(({ data }: { data: Offer[] | null }) => setRows(data ?? []))
  }, [])
  const today = new Date().toISOString().slice(0, 10)
  return (
    <>
      <PageHead title="Ưu đãi" desc="Ưu đãi đã quá ngày kết thúc sẽ tự ẩn khỏi website." action={<Link href="/admin/uu-dai/moi" className="btn-ink">Thêm ưu đãi</Link>} />
      <SimpleList
        base="/admin/uu-dai"
        empty="Chưa có ưu đãi nào."
        newLabel="Thêm ưu đãi"
        rows={
          rows &&
          rows.map((o) => ({
            id: o.id,
            title: `${o.highlight ? o.highlight + '  ' : ''}${o.title}`,
            sub: [o.end_date ? (o.end_date < today ? `Đã hết hạn ${formatDate(o.end_date)}` : `Đến ${formatDate(o.end_date)}`) : 'Không giới hạn thời gian'],
            status: o.status,
          }))
        }
      />
    </>
  )
}
