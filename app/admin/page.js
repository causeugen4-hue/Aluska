import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  TRIAL_PRICE, today, mondayOf, addDays, monthRange, addMonths, datesOfWeekday,
  fmtDate, fmtDateLong, fmtMonth, lei, ZILE,
} from '@/lib/dates'

export const metadata = { title: 'Bani – Administrare' }
export const dynamic = 'force-dynamic'

function calc(groups, enr, cancelled, from, to) {
  const rows = groups.map((g) => {
    const per = {}
    for (const e of enr) {
      if (e.group_id === g.id && e.lesson_date >= from && e.lesson_date <= to) {
        const x = per[e.lesson_date] || (per[e.lesson_date] = { n: 0, trial: 0 })
        x.n++
        if (e.is_trial) x.trial++
      }
    }
    let held = 0, closed = 0, kids = 0, trials = 0
    for (const [d, x] of Object.entries(per)) {
      if (cancelled.has(`${g.id}|${d}`)) closed++
      else { held++; kids += x.n; trials += x.trial }
    }
    return { g, kids, trials, held, closed, income: (kids - trials) * Number(g.price) + trials * TRIAL_PRICE }
  }).filter((r) => r.held + r.closed > 0)
  return { rows, total: rows.reduce((s, r) => s + r.income, 0) }
}

function Table({ data }) {
  if (!data.rows.length) return <p className="empty">Nu sunt lecții în această perioadă.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Grupa</th><th>Lecții</th><th>Înscrieri</th><th>Preț lecție</th><th>Venit</th></tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.g.id}>
              <td>{r.g.name}<div className="muted">{ZILE[r.g.weekday]}</div></td>
              <td>{r.held}{r.closed > 0 && <div className="note">{r.closed} închise</div>}</td>
              <td>{r.kids}{r.trials > 0 && <div className="muted">din care {r.trials} de probă</div>}</td>
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
  const lo = weekStart < from ? weekStart : from
  const hi = weekEnd > to ? weekEnd : to
  const [{ data: groups }, { data: cl }, { data: enr }] = await Promise.all([
    sb.from('groups').select('*'),
    sb.from('cancelled_lessons').select('group_id,lesson_date'),
    sb.from('enrollments').select('group_id,lesson_date,is_trial').gte('lesson_date', lo).lte('lesson_date', hi).limit(5000),
  ])
  const cancelled = new Set((cl || []).map((c) => `${c.group_id}|${c.lesson_date}`))

  const week = calc(groups || [], enr || [], cancelled, weekStart, weekEnd)
  const month = calc(groups || [], enr || [], cancelled, from, to)
  const href = (s, l) => `/admin?sapt=${s}&luna=${l}`

  return (
    <main>
      <h1>Bani</h1>
      <p className="muted">
        Venitul se calculează din înscrierile la fiecare lecție: numărul de copii × prețul lecției (lecția de probă se numără cu {lei(TRIAL_PRICE)}).
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
