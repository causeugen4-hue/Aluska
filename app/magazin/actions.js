'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const back = (msg, type = 'eroare') => redirect(`/magazin?${type}=${encodeURIComponent(msg)}`)

export async function buy(fd) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')

  const { error } = await sb.rpc('buy_item', { p_item: fd.get('item_id') })
  if (error) {
    back(error.code === 'P0001' && error.message ? error.message : 'Nu am putut face comanda. Încearcă din nou.')
  }
  back('Comanda a fost trimisă. O primești la următoarea lecție.', 'ok')
}
