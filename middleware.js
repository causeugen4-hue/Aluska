import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const pending = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          pending.push(...list)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const apply = (res) => {
    pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  if (!user && (path.startsWith('/cont') || path.startsWith('/magazin') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/autentificare'
    url.search = ''
    return apply(NextResponse.redirect(url))
  }

  // Paginile citesc utilizatorul de aici, fără să mai întrebe încă o dată Supabase.
  // Antetul e șters mai întâi, ca să nu poată fi falsificat din exterior.
  const headers = new Headers(request.headers)
  headers.delete('x-user-id')
  if (user) headers.set('x-user-id', user.id)
  return apply(NextResponse.next({ request: { headers } }))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
