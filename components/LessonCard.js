import Link from 'next/link'
import SpotsBar from '@/components/SpotsBar'
import GroupMeta from '@/components/GroupMeta'
import { hm, priceLabel, fmtDay, cap } from '@/lib/dates'

export default function LessonCard({ g, date, taken, available, full, loggedIn }) {
  const free = g.capacity - taken
  const status = !g.is_open ? 'Înscrieri închise'
    : full ? 'Lecție plină'
    : free === 1 ? 'Un singur loc liber'
    : `${free} locuri libere`

  return (
    <Link href={`/lectie/${g.id}/${date}`} className="card group-link">
      <GroupMeta g={g} />
      <p className="when">{cap(fmtDay(date))}, {hm(g.start_time)}–{hm(g.end_time)}</p>
      <h3>{g.name}</h3>
      <p className="muted">{priceLabel(g)}</p>
      <SpotsBar taken={taken} capacity={g.capacity} open={g.is_open} />
      {loggedIn
        ? <span className="go">Înscrie copilul →</span>
        : <p className={available ? 'tag good' : 'tag'}>{status}</p>}
    </Link>
  )
}
