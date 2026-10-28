'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Unele linkuri din email aduc datele după semnul # (browserul nu le trimite serverului).
// Aici le citim: fie ducem părintele la parola nouă, fie îi arătăm că linkul a expirat.
export default function AuthHashRedirect() {
  useEffect(() => {
    const h = window.location.hash
    if (!h || h.length < 2) return
    const p = new URLSearchParams(h.slice(1))
    if (p.get('error_code') || p.get('error') === 'access_denied') {
      window.location.replace('/parola-uitata?eroare=1')
      return
    }
    if (p.get('type') === 'recovery' && p.get('access_token') && p.get('refresh_token')) {
      createClient()
        .auth.setSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token') })
        .then(({ error }) => window.location.replace(error ? '/parola-uitata?eroare=1' : '/parola-noua'))
    }
  }, [])
  return null
}
