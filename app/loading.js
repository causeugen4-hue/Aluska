export default function Loading() {
  return (
    <main className="wrap" aria-busy="true">
      <div className="skeleton sk-title" />
      <div className="grid">
        <div className="skeleton sk-card" />
        <div className="skeleton sk-card" />
        <div className="skeleton sk-card" />
      </div>
    </main>
  )
}
