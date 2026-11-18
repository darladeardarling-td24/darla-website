import type { Metadata, Viewport } from 'next'
import './globals.css'
// Font được nhúng sẵn trong dự án (không phụ thuộc Google Fonts), có đủ bộ dấu tiếng Việt.
// Playfair Display: chữ Didone tương phản cao, cùng tinh thần với logo DARLA
import '@fontsource-variable/playfair-display/index.css'
import '@fontsource-variable/playfair-display/wght-italic.css'
// Be Vietnam Pro: thiết kế riêng cho tiếng Việt, dấu rõ ràng ở cỡ chữ nhỏ
import '@fontsource/be-vietnam-pro/300.css'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'

export const metadata: Metadata = {
  title: { default: 'Darla — Dear Darling | Váy cưới', template: '%s | Darla Dear Darling' },
  description: 'Bộ sưu tập váy cưới, makeup cô dâu và rạp cưới theo phong cách châu Âu tối giản.',
}

export const viewport: Viewport = { themeColor: '#EAE3D6' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-oyster font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
