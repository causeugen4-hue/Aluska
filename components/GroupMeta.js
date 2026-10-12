import { ageLabel } from '@/lib/dates'

export default function GroupMeta({ g }) {
  return (
    <p className="chips">
      <span className="chip">{ageLabel(g)}</span>
      {g.trial_date && <span className="chip trial">Lecție de probă</span>}
    </p>
  )
}
