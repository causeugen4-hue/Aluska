import LessonCard from '@/components/LessonCard'
import { fmtDate } from '@/lib/dates'

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
            <div className="grid">
              {list.map((x) => <LessonCard key={`${x.g.id}|${x.date}`} {...x} loggedIn={loggedIn} />)}
            </div>
          </div>
        )
      })}
    </>
  )
}
