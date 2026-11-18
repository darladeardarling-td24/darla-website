'use client'
import Link from 'next/link'
import { createContext, useCallback, useContext, useState } from 'react'

export const inputCls =
  'w-full rounded-xl border border-ink/15 bg-veil px-3.5 py-2.5 text-[0.9375rem] outline-none transition-colors placeholder:text-taupe/60 focus:border-ink'

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[0.8125rem] font-medium">{label}</span>
      {children}
      {hint && <span className="meta mt-1 block">{hint}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputCls} leading-6 ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

/** Ô nhập giá tiền: hiển thị 8.500.000, lưu số */
export function PriceInput({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  const shown = value === null || value === undefined ? '' : new Intl.NumberFormat('vi-VN').format(value)
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={shown}
        placeholder={placeholder ?? 'Để trống = Liên hệ'}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          onChange(digits ? Number(digits) : null)
        }}
        className={`${inputCls} pr-9`}
      />
      <span className="meta pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">đ</span>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 text-[0.9375rem]">
      <span className={`relative h-6 w-10 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-ink/20'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-veil transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </span>
      {label}
    </button>
  )
}

export function PageHead({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2.25rem] leading-tight sm:text-[2.75rem]">{title}</h1>
        {desc && <p className="meta mt-1 max-w-xl">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-veil p-5 sm:p-7 ${className}`}>{children}</div>
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="meta mb-4 inline-flex items-center gap-1.5 hover:text-ink">
      <span aria-hidden>‹</span> {label}
    </Link>
  )
}

export function StatusBadge({ status }: { status: 'published' | 'draft' }) {
  return status === 'published' ? (
    <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.75rem] text-veil">Đang hiện</span>
  ) : (
    <span className="rounded-full border border-ink/30 px-2.5 py-0.5 text-[0.75rem] text-taupe">Bản nháp</span>
  )
}

/* ---------- Thông báo nhỏ ---------- */
type Toast = { id: number; text: string; tone: 'ok' | 'error' }
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x.filter((t) => t.text !== text), { id, text, tone }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 3500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`rounded-xl px-4 py-3 text-[0.9375rem] shadow-lg ${t.tone === 'ok' ? 'bg-ink text-veil' : 'bg-[#7a1f1f] text-veil'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
