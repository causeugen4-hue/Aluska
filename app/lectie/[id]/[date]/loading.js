export default function Loading() {
  return (
    <main className="wrap" aria-busy="true">
      <div className="skeleton sk-line" style={{ width: 120 }} />
      <div className="skeleton sk-card" />
      <div className="skeleton sk-card" style={{ height: 180 }} />
    </main>
  )
}
