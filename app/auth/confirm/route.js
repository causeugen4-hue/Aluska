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
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/parola-noua'

  const sb = await createClient()
  let error = null
  if (tokenHash && type === 'recovery') {
    ;({ error } = await sb.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash }))
  } else if (code) {
    ;({ error } = await sb.auth.exchangeCodeForSession(code))
  } else {
    error = new Error('link incomplet')
  }

  if (error) return NextResponse.redirect(`${origin}/parola-uitata?eroare=1`)
  return NextResponse.redirect(`${origin}${target}`)
}
