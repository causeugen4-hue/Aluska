import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'
import { today, lessonsWindow, lei, TRIAL_PRICE } from '@/lib/dates'
import { photoUrl } from '@/lib/gallery'
import Weeks from '@/components/Weeks'
import Carousel from '@/components/Carousel'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await createClient()
  const uid = await currentUserId()
  const [{ data: groups }, { data: spots }, { data: photosRaw }, { data: cl }] = await Promise.all([
    sb.from('groups').select('*'),
    sb.rpc('group_spots'),
    sb.from('gallery_photos').select('*').order('created_at', { ascending: false }).limit(24),
    sb.from('cancelled_lessons').select('group_id,lesson_date').gte('lesson_date', today()),
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
          <p className="lead">Apasă pe lecția la care vrei să vină copilul. După înscriere poți alege și altă lecție.</p>
          <p className="trial-note">Prima lecție a copilului poate fi lecție de probă: plătești doar {lei(TRIAL_PRICE)}.</p>
          <Weeks thisWeek={thisWeek} nextWeek={nextWeek} range={range} loggedIn />
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
        <div className="palette" aria-hidden="true">
          <i className="d d1" /><i className="d d2" /><i className="d d3" />
          <i className="d d4" /><i className="d d5" /><i className="hole" />
        </div>
      </section>

      {gallery}

      <section id="grupe" className="wrap">
        <p className="trial-note">Prima lecție a copilului poate fi lecție de probă: plătești doar {lei(TRIAL_PRICE)}.</p>
        <Weeks thisWeek={thisWeek} nextWeek={nextWeek} range={range} />
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
