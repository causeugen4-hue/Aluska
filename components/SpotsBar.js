export default function SpotsBar({ taken, capacity, open = true }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((taken / capacity) * 100)) : 0
  const full = taken >= capacity
  const level = !open ? 'closed' : full ? 'full' : pct >= 75 ? 'high' : 'ok'
  return (
    <div className="spots">
      <div
        className={`bar ${level}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        aria-label="Locuri ocupate"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="spots-text">{taken} din {capacity} locuri ocupate</p>
    </div>
  )
}
