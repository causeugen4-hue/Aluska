import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  today, mondayOf, addDays, monthRange, addMonths, datesOfWeekday,
  fmtDate, fmtDateLong, fmtMonth, lei, ZILE,
} from '@/lib/dates'

export const metadata = { title: 'Bani – Administrare' }
export const dynamic = 'force-dynamic'

function calc(groups, cancelled, from, to) {
  const rows = groups.map((g) => {
    const dates = datesOfWeekday(g.weekday, from, to)
    const held = dates.filter((d) => !cancelled.has(`${g.id}|${d}`))
    const kids = g.enrollments?.[0]?.count || 0
    return {
      g, kids,
      held: held.length,
      closed: dates.length - held.length,
      income: held.length * kids * Number(g.price),
    }
  }).filter((r) => r.held + r.closed > 0)
  return { rows, total: rows.reduce((s, r) => s + r.income, 0) }
}

function Table({ data }) {
  if (!data.rows.length) return <p className="empty">Nu sunt lecții în această perioadă.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Grupa</th><th>Lecții</th><th>Copii</th><th>Preț lecție</th><th>Venit</th></tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.g.id}>
              <td>{r.g.name}<div className="muted">{ZILE[r.g.weekday]}</div></td>
              <td>{r.held}{r.closed > 0 && <div className="note">{r.closed} închise</div>}</td>
              <td>{r.kids}</td>
              <td>{lei(r.g.price)}</td>
              <td><strong>{lei(r.income)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function Bani({ searchParams }) {
  const sp = await searchParams
  const t = today()
  const weekStart = mondayOf(sp.sapt || t)
  const weekEnd = addDays(weekStart, 6)
  const ym = /^\d{4}-\d{2}$/.test(sp.luna || '') ? sp.luna : t.slice(0, 7)
  const { from, to } = monthRange(ym)

  const sb = await createClient()
  const [{ data: groups }, { data: cl }] = await Promise.all([
    sb.from('groups').select('*, enrollments(count)'),
    sb.from('cancelled_lessons').select('group_id,lesson_date'),
  ])
  const cancelled = new Set((cl || []).map((c) => `${c.group_id}|${c.lesson_date}`))

  const week = calc(groups || [], cancelled, weekStart, weekEnd)
  const month = calc(groups || [], cancelled, from, to)
  const href = (s, l) => `/admin?sapt=${s}&luna=${l}`

  return (
    <main>
      <h1>Bani</h1>
      <p className="muted">
        Venitul se calculează din înscrierile active: lecții ținute × copii înscriși × prețul lecției.
        Lecțiile închise nu se numără.
      </p>

      <section className="money">
        <div className="money-head">
          <h2>Săptămâna {fmtDate(weekStart)} – {fmtDate(weekEnd)}</h2>
          <div className="pager">
            <Link href={href(addDays(weekStart, -7), ym)}>Săptămâna trecută</Link>
            <Link href={href(mondayOf(t), ym)}>Această săptămână</Link>
            <Link href={href(addDays(weekStart, 7), ym)}>Următoarea</Link>
          </div>
        </div>
        <p className="big">{lei(week.total)}</p>
        <Table data={week} />
      </section>

      <section className="money">
        <div className="money-head">
          <h2>Luna {fmtMonth(ym)}</h2>
          <div className="pager">
            <Link href={href(weekStart, addMonths(ym, -1))}>Luna trecută</Link>
            <Link href={href(weekStart, t.slice(0, 7))}>Luna aceasta</Link>
            <Link href={href(weekStart, addMonths(ym, 1))}>Următoarea</Link>
          </div>
        </div>
        <p className="big">{lei(month.total)}</p>
        <Table data={month} />
      </section>
    </main>
  )
}
