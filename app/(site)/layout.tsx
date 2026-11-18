import Footer from '@/components/site/Footer'
import Header from '@/components/site/Header'
import { getSettings } from '@/lib/data'

export const revalidate = 60

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings()
  return (
    <>
      <Header season={s.season_label} instagram={s.instagram} />
      <main>{children}</main>
      <Footer s={s} />
    </>
  )
}
