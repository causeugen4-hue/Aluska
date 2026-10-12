import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import { addChild, deleteChild, unenroll, saveProfile } from './actions'
import { enrollmentPriceLabel, age, today, fmtDay, hm, cap } from '@/lib/dates'

export const metadata = { title: 'Contul meu – Alușka Art Studio' }
export const dynamic = 'force-dynamic'

export default async function Cont({ searchParams }) {
  const sp = await searchParams
  const uid = await currentUserId()
  if (!uid) redirect('/autentificare')
  const sb = await createClient()
  const t = today()

  const [{ data: profile }, { data: children }, { data: groups }, { data: closed }, { data: stars }] =
    await Promise.all([
      sb.from('profiles').select('full_name,phone').eq('id', uid).maybeSingle(),
      sb.from('children').select('id,name,birth_date,notes,enrollments(id,group_id,lesson_date,is_trial)').eq('parent_id', uid).order('created_at'),
      sb.from('groups').select('*'),
      sb.from('cancelled_lessons').select('group_id,lesson_date').gte('lesson_date', t),
      sb.rpc('my_stars'),
    ])

  const byId = Object.fromEntries((groups || []).map((g) => [g.id, g]))
  const closedSet = new Set((closed || []).map((x) => `${x.group_id}|${x.lesson_date}`))
  const n = typeof stars === 'number' ? stars : 0

  return (
    <main className="wrap">
      <h1>Bună, {profile?.full_name?.split(' ')[0] || 'părinte'}!</h1>

      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <section className="card stars-card">
        <div>
          <p className="stars-big"><span className="star">★</span> {n} {n === 1 ? 'steluță' : 'steluțe'}</p>
          <p className="muted">Primești 5 steluțe pentru fiecare lecție la care copilul a fost prezent.</p>
        </div>
        <Link href="/magazin" className="btn small">Spre magazin</Link>
      </section>

      <h2>Copiii mei</h2>
      {!children?.length && (
        <p className="empty">Nu ai adăugat încă niciun copil. Îl adaugi când alegi prima lecție.</p>
      )}

      <div className="stack">
        {(children || []).map((c) => {
          const upcoming = c.enrollments
            .filter((e) => e.lesson_date >= t && byId[e.group_id])
            .sort((a, b) => a.lesson_date.localeCompare(b.lesson_date))
          return (
            <article className="card wide" key={c.id}>
              <div className="card-head">
                <div>
                  <h3>{c.name}</h3>
                  <p className="muted">{[age(c.birth_date), c.notes].filter(Boolean).join(', ')}</p>
                </div>
                <form action={deleteChild}>
                  <input type="hidden" name="child_id" value={c.id} />
                  <ConfirmButton className="linklike danger" message={`Ștergi ${c.name} și toate înscrierile lui?`}>
                    Șterge copilul
                  </ConfirmButton>
                </form>
              </div>

              <h4>Lecțiile următoare</h4>
              {!upcoming.length && <p className="muted">Nu este înscris la nicio lecție viitoare.</p>}
              <ul className="plain">
                {upcoming.map((e) => {
                  const g = byId[e.group_id]
                  return (
                    <li key={e.id} className="enr">
                      <div>
                        <strong>{cap(fmtDay(e.lesson_date))}</strong>, {hm(g.start_time)}–{hm(g.end_time)}
                        <div className="muted">{g.name}, {enrollmentPriceLabel(g, e)}</div>
                        {closedSet.has(`${g.id}|${e.lesson_date}`) && <div className="note">Lecție anulată</div>}
                      </div>
                      <form action={unenroll}>
                        <input type="hidden" name="enrollment_id" value={e.id} />
                        <ConfirmButton className="linklike danger" message={`Anulezi înscrierea de ${fmtDay(e.lesson_date)}?`}>
                          Anulează
                        </ConfirmButton>
                      </form>
                    </li>
                  )
                })}
              </ul>
              <div className="row"><Link href="/#grupe" className="btn small">Alege o lecție</Link></div>
            </article>
          )
        })}
      </div>

      {children?.length > 0 && (
        <>
          <h2>Adaugă un copil</h2>
          <form action={addChild} className="form card">
            <label>Numele copilului<input name="name" required /></label>
            <label>Data nașterii<input name="birth_date" type="date" /></label>
            <label>Observații <small>(alergii, dorințe, opțional)</small><input name="notes" /></label>
            <button className="btn">Adaugă copilul</button>
          </form>
        </>
      )}

      <h2>Datele mele</h2>
      <form action={saveProfile} className="form card">
        <label>Nume<input name="full_name" defaultValue={profile?.full_name || ''} required /></label>
        <label>Telefon<input name="phone" type="tel" defaultValue={profile?.phone || ''} required /></label>
        <button className="btn ghost">Salvează datele</button>
      </form>
    </main>
  )
}
