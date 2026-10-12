import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { slot, lei } from '@/lib/dates'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await createClient()
  const [{ data: groups }, { data: spots }] = await Promise.all([
    sb.from('groups').select('*').order('weekday').order('start_time'),
    sb.rpc('group_spots'),
  ])
  const taken = Object.fromEntries((spots || []).map((s) => [s.group_id, Number(s.taken)]))

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
            const free = g.capacity - (taken[g.id] || 0)
            const status = !g.is_open ? 'Înscrieri închise' : free <= 0 ? 'Grupă plină' : free === 1 ? 'Un singur loc liber' : `${free} locuri libere`
            const ok = g.is_open && free > 0
            return (
              <article className="card" key={g.id}>
                <p className="when">{slot(g)}</p>
                <h3>{g.name}</h3>
                <p className="muted">{lei(g.price)} pe lecție</p>
                <p className={ok ? 'tag good' : 'tag'}>{status}</p>
              </article>
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
