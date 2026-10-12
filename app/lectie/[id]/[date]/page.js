import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'
import SpotsBar from '@/components/SpotsBar'
import GroupMeta from '@/components/GroupMeta'
import EnrollForm from '@/components/EnrollForm'
import { hm, priceLabel, fmtDay, cap, isLessonDate, hasStarted, occupancyLevel } from '@/lib/dates'
import { withUsage } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f-]{36}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

export default async function Lectie({ params, searchParams }) {
  const { id, date } = await params
  const sp = await searchParams
  if (!UUID.test(id) || !DATE.test(date)) notFound()

  const sb = await createClient()
  const uid = await currentUserId()

  const [{ data: g }, { data: spots }, { data: cl }, { data: kidsRaw }, { data: subsRaw }, { data: usage }] = await Promise.all([
    sb.from('groups').select('*').eq('id', id).maybeSingle(),
    sb.rpc('group_spots'),
    sb.from('cancelled_lessons').select('group_id').eq('group_id', id).eq('lesson_date', date),
    uid
      ? sb.from('children').select('id,name,enrollments(group_id,lesson_date)').eq('parent_id', uid).order('created_at')
      : Promise.resolve({ data: [] }),
    uid ? sb.from('subscriptions').select('id,total_lessons').eq('parent_id', uid) : Promise.resolve({ data: [] }),
    uid ? sb.rpc('subscription_usage') : Promise.resolve({ data: [] }),
  ])
  if (!g || !isLessonDate(g, date)) notFound()

  const taken = Number((spots || []).find((s) => s.group_id === g.id && s.lesson_date === date)?.taken || 0)
  const free = g.capacity - taken
  const closed = !!cl?.length
  const started = hasStarted(g, date)
  const canEnroll = g.is_open && !closed && !started && free > 0

  const reason = !g.is_open ? 'Înscrierile la această lecție sunt închise.'
    : closed ? 'Lecția aceasta este anulată.'
    : started ? 'Lecția aceasta a avut deja loc sau a început.'
    : free <= 0 ? 'Lecția este plină. Alege o altă lecție.'
    : null

  const subRemaining = withUsage(subsRaw, usage).reduce((a, x) => a + x.remaining, 0)
  const lessonLabel = `${cap(fmtDay(date))}, ${hm(g.start_time)}–${hm(g.end_time)}`

  const kids = (kidsRaw || []).map((c) => ({
    id: c.id,
    name: c.name,
    booked: c.enrollments.some((e) => e.group_id === g.id && e.lesson_date === date),
    firstTime: c.enrollments.length === 0,
  }))

  return (
    <main className="wrap">
      <p><Link href="/#grupe">← Toate lecțiile</Link></p>

      <article className={`card wide group-detail occ-${occupancyLevel(taken, g.capacity, g.is_open)}`}>
        <GroupMeta g={g} />
        <h1 className="page-title">{cap(fmtDay(date))}, {hm(g.start_time)}–{hm(g.end_time)}</h1>
        <p className="when">{g.name}</p>
        <p className="muted">{priceLabel(g)}</p>
        <SpotsBar taken={taken} capacity={g.capacity} open={g.is_open} />
        <p className={canEnroll ? 'tag good' : 'tag'}>
          {reason ? (free <= 0 && g.is_open && !closed && !started ? 'Lecție plină' : 'Indisponibilă') : free === 1 ? 'Un singur loc liber' : `${free} locuri libere`}
        </p>
      </article>

      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}
      {reason && <p className="empty">{reason}</p>}

      {canEnroll && uid && (
        <section>
          <h2>Înscrie copilul</h2>
          <EnrollForm groupId={g.id} lessonDate={date} lessonLabel={lessonLabel} price={g.price} kids={kids} subRemaining={subRemaining} />
        </section>
      )}

      {canEnroll && !uid && (
        <section>
          <h2>Înscrie copilul</h2>
          <p className="lead">Ca să înscrii copilul, intră în cont sau creează unul.</p>
          <div className="row">
            <Link href="/inregistrare" className="btn">Creează cont</Link>
            <Link href="/autentificare" className="btn ghost">Autentificare</Link>
          </div>
        </section>
      )}
    </main>
  )
}
