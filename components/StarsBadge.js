'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StarsBadge({ initial }) {
  const [n, setN] = useState(initial)
  const path = usePathname()

  useEffect(() => { setN(initial) }, [initial])

  // La fiecare schimbare de pagină reîmprospătăm numărul, fără să blocăm pagina
  useEffect(() => {
    let live = true
    createClient().rpc('my_stars').then(({ data }) => {
      if (live && typeof data === 'number') setN(data)
    })
    return () => { live = false }
  }, [path])

  return (
    <Link href="/magazin" className="stars-badge" aria-label={`${n} steluțe, spre magazin`}>
      <span className="star">★</span> {n}
    </Link>
  )
}
