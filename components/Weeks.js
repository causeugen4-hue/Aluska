import LessonCard from '@/components/LessonCard'
import { fmtDate, fmtDay, cap } from '@/lib/dates'

// Grupează lecțiile pe zile, ca fiecare zi să fie un bloc separat
function byDay(list) {
  const days = new Map()
  for (const x of list) {
    if (!days.has(x.date)) days.set(x.date, [])
    days.get(x.date).push(x)
  }
  return [...days]
}

export default function Weeks({ thisWeek, nextWeek, range, loggedIn }) {
  const blocks = [
    { title: 'Săptămâna aceasta', sub: `${fmtDate(range.mon)} – ${fmtDate(range.split)}`, list: thisWeek },
    { title: 'Săptămâna viitoare', sub: `${fmtDate(range.next)} – ${fmtDate(range.end)}`, list: nextWeek },
  ]
  return (
    <>
      {blocks.map((b) => {
        const list = loggedIn ? b.list.filter((x) => x.available) : b.list
        return (
          <div key={b.title} className="week">
            <h2 className="week-title">{b.title} <small>{b.sub}</small></h2>
            {!list.length && (
              <p className="empty">
                {loggedIn ? 'Nu mai sunt lecții cu locuri libere în această săptămână.' : 'Nu sunt lecții programate în această săptămână.'}
              </p>
            )}
            {byDay(list).map(([date, items]) => (
              <section key={date} className="day" aria-labelledby={`day-${date}`}>
                <h3 id={`day-${date}`} className="day-title">{cap(fmtDay(date))}</h3>
                <div className="grid">
                  {items.map((x) => <LessonCard key={`${x.g.id}|${x.date}`} {...x} loggedIn={loggedIn} />)}
                </div>
              </section>
            ))}
          </div>
        )
      })}
    </>
  )
}
