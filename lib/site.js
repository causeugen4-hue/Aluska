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

// Temele de sărbătoare alese pe zile: { '2026-10-31': 'halloween', ... }
export const getDayThemes = cache(async () => {
  const sb = await createClient()
  const { data } = await sb.from('day_themes').select('lesson_date,theme')
  const out = {}
  for (const r of data || []) if (THEME_IDS.includes(r.theme)) out[r.lesson_date] = r.theme
  return out
})
