import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { updateEnrollment, deleteEnrollment } from '../actions'
import { slot, age } from '@/lib/dates'

export const metadata = { title: 'Înscrieri – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Inscrieri({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const [{ data: groups }, { data: rows }] = await Promise.all([
    sb.from('groups').select('*').order('weekday').order('start_time'),
    sb.from('enrollments')
      .select('id,group_id,child:children(id,name,birth_date,parent:profiles(full_name,phone,email))')
      .order('created_at'),
  ])

  return (
    <main>
      <h1>Înscrieri</h1>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      {(groups || []).map((g) => {
        const list = (rows || []).filter((r) => r.group_id === g.id && r.child)
        return (
          <section key={g.id} className="block">
            <h2>{g.name} <span className="muted">{slot(g)}, {list.length}/{g.capacity} copii</span></h2>
            {!list.length && <p className="empty">Nicio înscriere la această grupă.</p>}
            {list.map((r) => (
              <div className="enrow" key={r.id}>
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
                  <button className="btn small">Salvează</button>
                </form>
                <div className="parent">
                  <span className="muted">{age(r.child.birth_date)}</span>
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
            ))}
          </section>
        )
      })}
    </main>
  )
}
