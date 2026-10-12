import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { saveGroup, deleteGroup, toggleLesson } from '../actions'
import { ZILE, hm, today, addDays, datesOfWeekday, fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Grupe și lecții – Administrare' }
export const dynamic = 'force-dynamic'

function GroupFields({ g }) {
  return (
    <>
      {g && <input type="hidden" name="id" value={g.id} />}
      <label>Numele grupei<input name="name" defaultValue={g?.name || ''} required /></label>
      <label>Categoria de vârstă
        <select name="age_group" defaultValue={g?.age_group || '4-7'}>
          <option value="4-7">4–7 ani</option>
          <option value="8-12">8–12 ani</option>
        </select>
      </label>
      <label>Ziua
        <select name="weekday" defaultValue={g?.weekday || 1}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{ZILE[d]}</option>)}
        </select>
      </label>
      <label>De la<input type="time" name="start_time" defaultValue={hm(g?.start_time) || '17:00'} required /></label>
      <label>Până la<input type="time" name="end_time" defaultValue={hm(g?.end_time) || '18:30'} required /></label>
      <label>Preț pe lecție (lei)<input type="number" name="price" min="0" step="0.01" defaultValue={g?.price ?? ''} required /></label>
      <label>Locuri <small>(maximum 5)</small><input type="number" name="capacity" min="1" max="5" defaultValue={g?.capacity ?? 5} required /></label>
      <label className="check">
        <input type="checkbox" name="is_open" defaultChecked={g ? g.is_open : true} /> Înscrieri deschise
      </label>
    </>
  )
}

export default async function Grupe({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const t = today()
  const [{ data: groups }, { data: cl }] = await Promise.all([
    sb.from('groups').select('*').order('weekday').order('start_time'),
    sb.from('cancelled_lessons').select('group_id,lesson_date').gte('lesson_date', t),
  ])
  const cancelled = new Set((cl || []).map((c) => `${c.group_id}|${c.lesson_date}`))

  return (
    <main>
      <h1>Grupe și lecții</h1>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <details className="card add">
        <summary>Adaugă o grupă nouă</summary>
        <form action={saveGroup} className="form grid-form"><GroupFields /><button className="btn">Adaugă grupa</button></form>
      </details>

      {(groups || []).map((g) => {
        const next = datesOfWeekday(g.weekday, t, addDays(t, 27))
        return (
          <section key={g.id} className="block">
            <form action={saveGroup} className="form grid-form">
              <GroupFields g={g} />
              <button className="btn small">Salvează</button>
            </form>

            <h4>Lecțiile următoare</h4>
            <ul className="plain lessons">
              {next.map((d) => {
                const closed = cancelled.has(`${g.id}|${d}`)
                return (
                  <li key={d}>
                    <span>{fmtDateLong(d)} {closed && <em className="tag">Închisă</em>}</span>
                    <form action={toggleLesson}>
                      <input type="hidden" name="group_id" value={g.id} />
                      <input type="hidden" name="date" value={d} />
                      <input type="hidden" name="closed" value={closed ? '1' : '0'} />
                      <button className="linklike">{closed ? 'Redeschide' : 'Închide lecția'}</button>
                    </form>
                  </li>
                )
              })}
            </ul>

            <form action={deleteGroup}>
              <input type="hidden" name="id" value={g.id} />
              <ConfirmButton className="linklike danger" message={`Ștergi grupa ${g.name} și toate înscrierile ei?`}>
                Șterge grupa
              </ConfirmButton>
            </form>
          </section>
        )
      })}
    </main>
  )
}
