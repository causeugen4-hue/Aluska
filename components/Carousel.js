'use client'
import { useEffect, useRef, useState } from 'react'

export default function Carousel({ photos }) {
  const ref = useRef(null)
  const [paused, setPaused] = useState(false)

  const move = (dir) => {
    const el = ref.current
    if (!el) return
    const first = el.firstElementChild
    const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth
    const max = el.scrollWidth - el.clientWidth
    let left = el.scrollLeft + dir * step
    if (dir > 0 && el.scrollLeft >= max - 4) left = 0
    if (dir < 0 && el.scrollLeft <= 4) left = max
    el.scrollTo({ left, behavior: 'smooth' })
  }

  useEffect(() => {
    if (paused || photos.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => move(1), 4500)
    return () => clearInterval(t)
  }, [paused, photos.length])

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="car-track" ref={ref} tabIndex={0} aria-label="Poze de la lecțiile noastre">
        {photos.map((p) => (
          <figure className="slide" key={p.id}>
            <img src={p.url} alt={p.caption || 'Lucrări ale copiilor de la lecții'} loading="lazy" />
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button type="button" className="car-btn prev" onClick={() => move(-1)} aria-label="Pozele anterioare">‹</button>
          <button type="button" className="car-btn next" onClick={() => move(1)} aria-label="Pozele următoare">›</button>
        </>
      )}
    </div>
  )
}
