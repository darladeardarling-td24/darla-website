import Footer from '@/components/site/Footer'
import Header from '@/components/site/Header'
import { getHero, getSettings } from '@/lib/data'

export const revalidate = 60

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, hero] = await Promise.all([getSettings(), getHero()])
  return (
    <>
      <Header season={s.season_label} instagram={s.instagram} heroTone={hero.tone} />
      <main>{children}</main>
      <Footer s={s} />
    </>
  )
}
