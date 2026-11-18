'use client'
import { useState } from 'react'
import { instagramHandle } from '@/lib/format'

type Props = {
  handle: string | null
  message?: string
  label?: string
  className?: string
}

/**
 * Mở tin nhắn Instagram của Darla. Nếu có `message` (ví dụ mã váy),
 * nội dung được sao chép sẵn để khách chỉ cần dán vào ô chat.
 */
export default function InstaButton({ handle, message, label = 'Nhắn Darla qua Instagram', className = 'btn-ink' }: Props) {
  const [copied, setCopied] = useState(false)
  const user = instagramHandle(handle)
  const href = user ? `https://ig.me/m/${user}` : 'https://instagram.com'

  async function onClick() {
    if (!message) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 4000)
    } catch {
      /* trình duyệt không cho sao chép: vẫn mở Instagram bình thường */
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
        {label}
      </a>
      {message && (
        <span className="meta min-h-5" aria-live="polite">
          {copied ? 'Đã sao chép mã váy — dán vào tin nhắn để được tư vấn nhanh.' : `Mã váy sẽ được sao chép sẵn để bạn gửi cho Darla.`}
        </span>
      )}
    </span>
  )
}
