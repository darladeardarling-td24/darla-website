import type { Metadata } from 'next'
import { ToastProvider } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Quản trị', robots: { index: false, follow: false } }

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
