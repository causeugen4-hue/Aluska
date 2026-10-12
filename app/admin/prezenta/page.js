import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { saveAttendance } from '../actions'
import { slot, today, addDays, datesOfWeekday, fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Prezență – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Prezenta({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const t = today()
  const { data: groups } = await sb.from('groups').select('*').order('weekday').order('start_time')
  const g = (groups || []).find((x) => x.id === sp.grupa) || null

  let dates = []
  if (g) {
    dates = g.trial_date
      ? (g.trial_date <= t ? [g.trial_date] : [])
      : datesOfWeekday(g.weekday, addDays(t, -56), t).reverse()
  }
  const date = dates.includes(sp.data) ? sp.data : dates[0]

  let kids = []
  let present = new Set()
  let isClosed = false
  if (g && date) {
    const [{ data: enr }, { data: att }, { data: cl }] = await Promise.all([
      sb.from('enrollments')
        .select('id, child:children(id,name,parent:profiles(full_name))')
        .eq('group_id', g.id).order('created_at'),
      sb.from('attendance').select('child_id').eq('group_id', g.id).eq('lesson_date', date),
      sb.from('cancelled_lessons').select('group_id').eq('group_id', g.id).eq('lesson_date', date),
    ])
    kids = (enr || []).filter((e) => e.child)
    present = new Set((att || []).map((a) => a.child_id))
    isClosed = !!cl?.length
  }

  return (
    <main>
      <h1>Prezență</h1>
      <p className="muted">
        Bifează copiii care au fost la lecție. Părintele primește câte 5 steluțe pentru fiecare copil prezent.
      </p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <h2>Grupa</h2>
      <ul className="plain choices">
        {(groups || []).map((x) => (
          <li key={x.id}>
            <Link href={`/admin/prezenta?grupa=${x.id}`} className={x.id === g?.id ? 'choice on' : 'choice'}>
              {x.name} <span className="muted">{slot(x)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {g && (
        <>
          <h2>Lecția</h2>
          {!dates.length && <p className="empty">Nu a avut loc încă nicio lecție la această grupă.</p>}
          <ul className="plain choices">
            {dates.map((d) => (
              <li key={d}>
                <Link href={`/admin/prezenta?grupa=${g.id}&data=${d}`} className={d === date ? 'choice on' : 'choice'}>
                  {fmtDateLong(d)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {g && date && isClosed && <p className="empty">Lecția din {fmtDateLong(date)} a fost închisă, nu se notează prezența.</p>}

      {g && date && !isClosed && (
        <section className="block">
          <h2>{g.name}, {fmtDateLong(date)}</h2>
          {!kids.length && <p className="empty">Nu sunt copii înscriși la această grupă.</p>}
          {kids.length > 0 && (
            <form action={saveAttendance} className="form">
              <input type="hidden" name="group_id" value={g.id} />
              <input type="hidden" name="date" value={date} />
              <ul className="plain">
                {kids.map((k) => (
                  <li key={k.id} className="enr">
                    <label className="check">
                      <input type="checkbox" name="present" value={k.child.id} defaultChecked={present.has(k.child.id)} />
                      {k.child.name}
                    </label>
                    <span className="muted">{k.child.parent?.full_name}</span>
                  </li>
                ))}
              </ul>
              <button className="btn">Salvează prezența</button>
            </form>
          )}
        </section>
      )}
    </main>
  )
}
