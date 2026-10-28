import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Linkul din emailul de resetare a parolei ajunge aici.
// Acceptă ambele variante de link: token_hash (merge pe orice dispozitiv) și code (același browser).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const explicit = next && next.startsWith('/') && !next.startsWith('//') ? next : null

  const sb = await createClient()
  let error = null
  let recovery = type === 'recovery'
  if (tokenHash && type === 'recovery') {
    ;({ error } = await sb.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash }))
  } else if (code) {
    const res = await sb.auth.exchangeCodeForSession(code)
    error = res.error
    // linkul de resetare tocmai a fost trimis? atunci e resetare de parolă
    const sent = res.data?.user?.recovery_sent_at
    if (sent && Date.now() - Date.parse(sent) < 2 * 3600 * 1000) recovery = true
  } else {
    error = new Error('link incomplet')
  }

  if (error) return NextResponse.redirect(`${origin}/parola-uitata?eroare=1`)
  return NextResponse.redirect(`${origin}${explicit || (recovery ? '/parola-noua' : '/cont')}`)
}
