import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { updateEnrollment, deleteEnrollment } from '../actions'
import { slot, age, today, fmtDay, cap, lei, TRIAL_PRICE } from '@/lib/dates'

export const metadata = { title: 'Înscrieri – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Inscrieri({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const [{ data: groups }, { data: rows }] = await Promise.all([
    sb.from('groups').select('*').order('weekday').order('start_time'),
    sb.from('enrollments')
      .select('id,group_id,lesson_date,is_trial,subscription_id,child:children(id,name,birth_date,parent:profiles(full_name,phone,email))')
      .gte('lesson_date', today())
      .order('lesson_date')
      .order('created_at'),
  ])

  return (
    <main>
      <h1>Înscrieri</h1>
      <p className="muted">Înscrierile la lecțiile viitoare, pe grupe și pe zile.</p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      {(groups || []).map((g) => {
        const list = (rows || []).filter((r) => r.group_id === g.id && r.child)
        const dates = [...new Set(list.map((r) => r.lesson_date))]
        return (
          <section key={g.id} className="block">
            <h2>{g.name} <span className="muted">{slot(g)}</span></h2>
            {!dates.length && <p className="empty">Nicio înscriere la lecțiile viitoare.</p>}
            {dates.map((d) => {
              const day = list.filter((r) => r.lesson_date === d)
              return (
                <div key={d}>
                  <h4>{cap(fmtDay(d))}, {day.length}/{g.capacity} copii</h4>
                  {day.map((r) => (
                    <details className="enrow" key={r.id}>
                      <summary className="en-sum">
                        <strong>{r.child.name}</strong>
                        <span className="muted">{age(r.child.birth_date)}</span>
                        {r.is_trial && <span className="chip trial">Probă, {lei(TRIAL_PRICE)}</span>}
                        {r.subscription_id && <span className="chip">Abonament</span>}
                        <span className="muted en-parent">{r.child.parent?.full_name}</span>
                      </summary>
                      <div className="en-body">
                        <form action={updateEnrollment} className="enform">
                          <input type="hidden" name="enrollment_id" value={r.id} />
                          <input type="hidden" name="child_id" value={r.child.id} />
                          <label>Copil<input name="name" defaultValue={r.child.name} required /></label>
                          <label>Data nașterii<input type="date" name="birth_date" defaultValue={r.child.birth_date || ''} /></label>
                          <label>Grupa
                            <select name="group_id" defaultValue={g.id}>
                              {groups.map((x) => <option key={x.id} value={x.id}>{x.name}, {slot(x)}</option>)}
                            </select>
                          </label>
                          <label>Data lecției<input type="date" name="lesson_date" defaultValue={r.lesson_date} required /></label>
                          <label className="check"><input type="checkbox" name="is_trial" defaultChecked={r.is_trial} /> Lecție de probă</label>
                          <button className="btn small">Salvează</button>
                        </form>
                        <div className="parent">
                          <span>Părinte: {r.child.parent?.full_name}</span>
                          <a href={`tel:${r.child.parent?.phone}`}>{r.child.parent?.phone}</a>
                          <span className="muted">{r.child.parent?.email}</span>
                        </div>
                        <form action={deleteEnrollment}>
                          <input type="hidden" name="enrollment_id" value={r.id} />
                          <ConfirmButton className="linklike danger" message={`Ștergi înscrierea lui ${r.child.name}?`}>
                            Șterge înscrierea
                          </ConfirmButton>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              )
            })}
          </section>
        )
      })}
    </main>
  )
}
