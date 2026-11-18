'use client'
import Link from 'next/link'
import { StatusBadge } from './ui'

type Row = { id: string; title: string; sub: string[]; status: 'published' | 'draft'; thumb?: string | null }

/** Danh sách gọn cho ưu đãi và dịch vụ */
export default function SimpleList({ rows, base, empty, newLabel }: { rows: Row[] | null; base: string; empty: string; newLabel: string }) {
  if (rows === null) return <p className="meta py-10">Đang tải…</p>
  if (!rows.length)
    return (
      <div className="rounded-2xl bg-veil px-6 py-14 text-center">
        <p>{empty}</p>
        <Link href={`${base}/moi`} className="btn-ink mt-5">{newLabel}</Link>
      </div>
    )
  return (
    <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-veil">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`${base}/${r.id}`} className="flex items-center gap-4 p-4 hover:bg-stone/40">
            {r.thumb !== undefined && (
              <span className="aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-stone">
                {r.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumb} alt="" className="h-full w-full object-cover" />
                )}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.25rem]">{r.title}</span>
              <span className="meta flex flex-wrap gap-x-3">
                {r.sub.filter(Boolean).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            </span>
            <StatusBadge status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
