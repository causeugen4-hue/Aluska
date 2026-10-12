import { occupancyLevel } from '@/lib/dates'

// O linie cu un segment pentru fiecare loc; culoarea arată cât de ocupată e lecția
export default function SpotsBar({ taken, capacity, open = true }) {
  const level = occupancyLevel(taken, capacity, open)
  const n = Math.max(1, Math.min(capacity, 12))
  return (
    <div className="spots">
      <div
        className={`segs ${level}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        aria-label="Locuri ocupate"
      >
        {Array.from({ length: n }, (_, i) => <span key={i} className={i < taken ? 'on' : ''} />)}
      </div>
      <p className="spots-text">{taken} din {capacity} locuri ocupate</p>
    </div>
  )
}
