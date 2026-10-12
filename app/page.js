import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { slot, lei } from '@/lib/dates'
import SpotsBar from '@/components/SpotsBar'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await createClient()
  const [{ data: { user } }, { data: groups }, { data: spots }] = await Promise.all([
    sb.auth.getUser(),
    sb.from('groups').select('*').order('weekday').order('start_time'),
    sb.rpc('group_spots'),
  ])
  const taken = Object.fromEntries((spots || []).map((s) => [s.group_id, Number(s.taken)]))
  const isFree = (g) => g.is_open && g.capacity - (taken[g.id] || 0) > 0

  // Părinte autentificat: doar grupele disponibile
  if (user) {
    const available = (groups || []).filter(isFree)
    return (
      <main>
        <section id="grupe" className="wrap">
          <h1 className="page-title">Alege o grupă</h1>
          <p className="lead">Apasă pe o grupă ca să înscrii copilul.</p>
          {!available.length && (
            <p className="empty">Momentan nu sunt grupe cu locuri libere. Revino în curând.</p>
          )}
          <div className="grid">
            {available.map((g) => (
              <Link href={`/grupa/${g.id}`} className="card group-link" key={g.id}>
                <p className="when">{slot(g)}</p>
                <h3>{g.name}</h3>
                <p className="muted">{lei(g.price)} pe lecție</p>
                <SpotsBar taken={taken[g.id] || 0} capacity={g.capacity} />
                <span className="go">Înscrie copilul →</span>
              </Link>
            ))}
          </div>
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
            Alege grupa potrivită și înscrie copilul online, în câteva minute. Pensulele, vopselele și
            buna dispoziție le punem noi.
          </p>
          <div className="row">
            <Link href="/inregistrare" className="btn">Creează cont și înscrie copilul</Link>
            <Link href="/#grupe" className="btn ghost">Vezi grupele</Link>
          </div>
        </div>
        <div className="palette" aria-hidden="true">
          <i className="d d1" /><i className="d d2" /><i className="d d3" />
          <i className="d d4" /><i className="d d5" /><i className="hole" />
        </div>
      </section>

      <section id="grupe" className="wrap">
        <h2>Grupele și programul</h2>
        {!groups?.length && <p className="empty">Programul va apărea aici în curând.</p>}
        <div className="grid">
          {(groups || []).map((g) => {
            const t = taken[g.id] || 0
            const free = g.capacity - t
            const status = !g.is_open ? 'Înscrieri închise' : free <= 0 ? 'Grupă plină' : free === 1 ? 'Un singur loc liber' : `${free} locuri libere`
            return (
              <Link href={`/grupa/${g.id}`} className="card group-link" key={g.id}>
                <p className="when">{slot(g)}</p>
                <h3>{g.name}</h3>
                <p className="muted">{lei(g.price)} pe lecție</p>
                <SpotsBar taken={t} capacity={g.capacity} open={g.is_open} />
                <p className={isFree(g) ? 'tag good' : 'tag'}>{status}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="wrap">
        <h2>Cum te înscrii</h2>
        <ol className="steps">
          <li><strong>Creează un cont</strong> cu emailul și telefonul tău.</li>
          <li><strong>Adaugă copilul</strong> cu numele și data nașterii.</li>
          <li><strong>Alege grupa</strong> din programul de mai sus. Gata!</li>
        </ol>
      </section>
    </main>
  )
}
