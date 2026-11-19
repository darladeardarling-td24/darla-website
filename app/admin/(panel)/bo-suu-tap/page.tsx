'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SimpleList from '@/components/admin/SimpleList'
import { PageHead } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Category, Collection } from '@/lib/types'

export default function CollectionsAdmin() {
  const [rows, setRows] = useState<Collection[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('collections').select('*').order('sort_order').then(({ data }: { data: Collection[] | null }) => setRows(data ?? []))
    sb.from('categories').select('*').order('sort_order').then(({ data }: { data: Category[] | null }) => setCats(data ?? []))
    sb.from('products').select('collection_id').then(({ data }: { data: { collection_id: string | null }[] | null }) => {
      const c: Record<string, number> = {}
      for (const r of data ?? []) if (r.collection_id) c[r.collection_id] = (c[r.collection_id] ?? 0) + 1
      setCounts(c)
    })
  }, [])

  const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]))
  return (
    <>
      <PageHead
        title="Bộ sưu tập"
        desc="Nhóm nhiều váy cùng phân khúc trong một danh mục, ví dụ Lumière (váy cưới tối giản) hay Soirée (váy đi bàn). Tên do bạn tự đặt. Gắn váy vào bộ sưu tập trong trang sửa sản phẩm."
        action={<Link href="/admin/bo-suu-tap/moi" className="btn-ink">Thêm bộ sưu tập</Link>}
      />
      <SimpleList
        base="/admin/bo-suu-tap"
        empty="Chưa có bộ sưu tập nào."
        newLabel="Thêm bộ sưu tập"
        rows={
          rows &&
          rows.map((c) => ({
            id: c.id,
            title: c.name,
            sub: [catName[c.category_id ?? ''] ?? 'Chưa chọn danh mục', `${counts[c.id] ?? 0} mẫu`, c.is_new ? 'Mới ra' : ''],
            status: c.status,
            thumb: c.cover?.thumb ?? null,
          }))
        }
      />
    </>
  )
}
