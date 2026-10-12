import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { addChild, deleteChild, enroll, unenroll, saveProfile } from './actions'
import { slot, priceLabel, age, today, fmtDate, notExpired } from '@/lib/dates'

export const metadata = { title: 'Contul meu – Alușka Art Studio' }
export const dynamic = 'force-dynamic'

export default async function Cont({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')

  const [{ data: profile }, { data: children }, { data: groups }, { data: spots }, { data: closed }, { data: stars }] =
    await Promise.all([
      sb.from('profiles').select('full_name,phone').eq('id', user.id).single(),
      sb.from('children').select('id,name,birth_date,notes,enrollments(id,group_id)').eq('parent_id', user.id).order('created_at'),
      sb.from('groups').select('*').order('weekday').order('start_time'),
      sb.rpc('group_spots'),
      sb.from('cancelled_lessons').select('group_id,lesson_date').gte('lesson_date', today()).order('lesson_date'),
      sb.rpc('my_stars'),
    ])

  const taken = Object.fromEntries((spots || []).map((s) => [s.group_id, Number(s.taken)]))
  const byId = Object.fromEntries((groups || []).map((g) => [g.id, g]))
  const free = (g) => g.capacity - (taken[g.id] || 0)

  return (
    <main className="wrap">
      <h1>Bună, {profile?.full_name?.split(' ')[0] || 'părinte'}!</h1>

      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <section className="card stars-card">
        <div>
          <p className="stars-big"><span className="star">★</span> {stars ?? 0} {stars === 1 ? 'steluță' : 'steluțe'}</p>
          <p className="muted">Primești 5 steluțe pentru fiecare lecție la care copilul a fost prezent.</p>
        </div>
        <Link href="/magazin" className="btn small">Spre magazin</Link>
      </section>

      <h2>Copiii mei</h2>
      {!children?.length && (
        <p className="empty">Nu ai adăugat încă niciun copil. Completează formularul de mai jos.</p>
      )}

      <div className="stack">
        {(children || []).map((c) => {
          const enrolledIds = new Set(c.enrollments.map((e) => e.group_id))
          const options = (groups || []).filter((g) => g.is_open && notExpired(g) && !enrolledIds.has(g.id) && free(g) > 0)
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

              <h4>Grupe</h4>
              {!c.enrollments.length && <p className="muted">Nu este înscris la nicio grupă.</p>}
              <ul className="plain">
                {c.enrollments.map((e) => {
                  const g = byId[e.group_id]
                  if (!g) return null
                  const off = (closed || []).filter((x) => x.group_id === g.id)
                  return (
                    <li key={e.id} className="enr">
                      <div>
                        <strong>{g.name}</strong>
                        <div className="muted">{slot(g)}, {priceLabel(g)}</div>
                        {off.length > 0 && (
                          <div className="note">Lecție anulată: {off.map((x) => fmtDate(x.lesson_date)).join(', ')}</div>
                        )}
                      </div>
                      <form action={unenroll}>
                        <input type="hidden" name="enrollment_id" value={e.id} />
                        <ConfirmButton className="linklike danger" message={`Anulezi înscrierea la ${g.name}?`}>
                          Anulează
                        </ConfirmButton>
                      </form>
                    </li>
                  )
                })}
              </ul>

              {options.length > 0 ? (
                <form action={enroll} className="inline-form">
                  <input type="hidden" name="child_id" value={c.id} />
                  <label>
                    Înscrie la o grupă
                    <select name="group_id" required defaultValue="">
                      <option value="" disabled>Alege grupa</option>
                      {options.map((g) => (
                        <option key={g.id} value={g.id}>
                          {slot(g)}, {g.name} ({free(g)} {free(g) === 1 ? 'loc' : 'locuri'})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn">Înscrie</button>
                </form>
              ) : (
                <p className="muted">Nu sunt grupe disponibile pentru înscriere acum.</p>
              )}
            </article>
          )
        })}
      </div>

      <h2>Adaugă un copil</h2>
      <form action={addChild} className="form card">
        <label>Numele copilului<input name="name" required /></label>
        <label>Data nașterii<input name="birth_date" type="date" /></label>
        <label>Observații <small>(alergii, dorințe, opțional)</small><input name="notes" /></label>
        <button className="btn">Adaugă copilul</button>
      </form>

      <h2>Datele mele</h2>
      <form action={saveProfile} className="form card">
        <label>Nume<input name="full_name" defaultValue={profile?.full_name || ''} required /></label>
        <label>Telefon<input name="phone" type="tel" defaultValue={profile?.phone || ''} required /></label>
        <button className="btn ghost">Salvează datele</button>
      </form>
    </main>
  )
}
