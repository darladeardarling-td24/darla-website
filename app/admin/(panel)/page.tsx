'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useStaff } from '@/components/admin/StaffContext'
import { Card, PageHead } from '@/components/admin/ui'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function Dashboard() {
  const { profile, isAdmin } = useStaff()
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const sb = supabaseBrowser()
    Promise.all(
      ['products', 'offers', 'services', 'categories'].map(async (t) => {
        const { count } = await sb.from(t).select('*', { count: 'exact', head: true })
        return [t, count ?? 0] as const
      }),
    ).then((r) => setCounts(Object.fromEntries(r)))
  }, [])

  const tiles = [
    { href: '/admin/san-pham', label: 'Sản phẩm', n: counts.products, action: 'Thêm váy mới', to: '/admin/san-pham/moi' },
    { href: '/admin/uu-dai', label: 'Ưu đãi', n: counts.offers, action: 'Thêm ưu đãi', to: '/admin/uu-dai/moi' },
    { href: '/admin/dich-vu', label: 'Makeup & rạp cưới', n: counts.services, action: 'Thêm dịch vụ', to: '/admin/dich-vu/moi' },
    { href: '/admin/danh-muc', label: 'Danh mục', n: counts.categories, action: 'Quản lý danh mục', to: '/admin/danh-muc' },
  ]

  return (
    <>
      <PageHead title={`Chào ${profile?.full_name || ''}`.trim()} desc="Nội dung bạn lưu ở đây sẽ hiện trên website ngay sau khi bấm Lưu." />
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Card key={t.href} className="flex items-end justify-between gap-4">
            <Link href={t.href} className="group">
              <p className="meta">{t.label}</p>
              <p className="font-display text-[3rem] leading-none group-hover:underline">{t.n ?? '…'}</p>
            </Link>
            <Link href={t.to} className="btn-line !px-4 !py-2 text-[0.875rem]">{t.action}</Link>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="font-display text-[1.5rem]">Ghi chú nhanh</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-6 text-ink/85">
          <li>Sản phẩm để <b>Bản nháp</b> sẽ không hiện cho khách. Chuyển sang <b>Đang hiện</b> khi đã đủ ảnh và giá.</li>
          <li>Bật <b>Nổi bật</b> để váy xuất hiện ở trang chủ (nên chọn 4–6 mẫu).</li>
          <li>Ảnh đầu tiên trong danh sách ảnh là ảnh bìa. Dùng nút ‹ › để đổi thứ tự.</li>
          <li>Để giá trống thì website hiện chữ “Liên hệ”.</li>
          {!isAdmin && <li>Xoá nội dung và đổi thông tin website do quản trị viên thực hiện.</li>}
        </ul>
      </Card>
    </>
  )
}
