import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'
import { today, lessonsWindow } from '@/lib/dates'
import { photoUrl } from '@/lib/gallery'
import { getSiteImages, getDayThemes } from '@/lib/site'
import Weeks from '@/components/Weeks'
import Carousel from '@/components/Carousel'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await createClient()
  const uid = await currentUserId()
  const [{ data: groups }, { data: spots }, { data: photosRaw }, { data: cl }, imgs, themes] = await Promise.all([
    sb.from('groups').select('*'),
    sb.rpc('group_spots'),
    sb.from('gallery_photos').select('*').order('created_at', { ascending: false }).limit(24),
    sb.from('cancelled_lessons').select('group_id,lesson_date').gte('lesson_date', today()),
    getSiteImages(),
    getDayThemes(),
  ])

  const cancelled = new Set((cl || []).map((c) => `${c.group_id}|${c.lesson_date}`))
  const taken = Object.fromEntries((spots || []).map((s) => [`${s.group_id}|${s.lesson_date}`, Number(s.taken)]))
  const { thisWeek, nextWeek, range } = lessonsWindow(groups || [], cancelled, taken)
  const photos = (photosRaw || []).map((p) => ({ ...p, url: photoUrl(p.path) }))

  const gallery = photos.length > 0 && (
    <section className="wrap gallery-section" aria-labelledby="gal-title">
      <h2 id="gal-title">Din lecțiile noastre</h2>
      <Carousel photos={photos} />
    </section>
  )

  // Părinte autentificat: galerie + doar lecțiile cu locuri libere
  if (uid) {
    return (
      <main>
        {gallery}
        <section id="grupe" className="wrap">
          <h1 className="page-title">Alege o lecție</h1>
          <Weeks thisWeek={thisWeek} nextWeek={nextWeek} range={range} themes={themes} loggedIn />
        </section>
      </main>
    )
  }

  // Vizitator
  return (
    <main>
      <section className="hero">
        <div className="hero-text">
          <h1>Lecții de pictură pentru copii, în grupe mici</h1>
          <p className="lead">
            Alege lecția potrivită și înscrie copilul online, în câteva minute. Pensulele, vopselele și
            buna dispoziție le punem noi.
          </p>
          <div className="row">
            <Link href="/inregistrare" className="btn">Creează cont și înscrie copilul</Link>
            <Link href="/#grupe" className="btn ghost">Vezi lecțiile</Link>
          </div>
        </div>
        {imgs.hero
          ? <img src={imgs.hero} alt="Alușka Art Studio" className="hero-photo" />
          : <img src="/logo.png" alt="Alușka Art Studio" className="hero-logo" width="480" height="480" />}
      </section>

      {gallery}

      <section id="grupe" className="wrap">
        <Weeks thisWeek={thisWeek} nextWeek={nextWeek} range={range} themes={themes} />
      </section>

      <section className="wrap">
        <h2>Cum te înscrii</h2>
        <ol className="steps">
          <li><strong>Creează un cont</strong> cu emailul și telefonul tău.</li>
          <li><strong>Alege lecția</strong> din programul de mai sus.</li>
          <li><strong>Adaugă copilul</strong> și gata! Data viitoare poți alege altă lecție, dacă vrei.</li>
        </ol>
      </section>
    </main>
  )
}
