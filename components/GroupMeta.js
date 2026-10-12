import { ageLabel } from '@/lib/dates'

export default function GroupMeta({ g }) {
  return (
    <p className="chips">
      <span className="chip">{ageLabel(g)}</span>
    </p>
  )
}
