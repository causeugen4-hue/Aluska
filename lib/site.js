import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { photoUrl } from '@/lib/gallery'
import { THEME_IDS } from '@/lib/themes'

// Imaginile alese de administrator ({ logo, hero }); lipsește cheia dacă nu a ales nimic.
// cache() face o singură interogare pe cerere, chiar dacă o cer și antetul, și pagina.
export const getSiteImages = cache(async () => {
  const sb = await createClient()
  const { data } = await sb.from('site_images').select('key,path')
  const out = {}
  for (const r of data || []) out[r.key] = photoUrl(r.path)
  return out
})

// Tema de sărbătoare aleasă de administrator ('' = fără temă)
export const getTheme = cache(async () => {
  const sb = await createClient()
  const { data } = await sb.from('site_settings').select('value').eq('key', 'theme').maybeSingle()
  return THEME_IDS.includes(data?.value) ? data.value : ''
})
