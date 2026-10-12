import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import GalleryUploader from '@/components/GalleryUploader'
import { deletePhoto } from '../actions'
import { photoUrl } from '@/lib/gallery'

export const metadata = { title: 'Galerie – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Galerie({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const { data: photos } = await sb.from('gallery_photos').select('*').order('created_at', { ascending: false })

  return (
    <main>
      <h1>Galerie</h1>
      <p className="muted">Pozele apar în carusel pe pagina principală, cele mai noi primele.</p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <GalleryUploader />

      <h2>Pozele adăugate</h2>
      {!photos?.length && <p className="empty">Nu ai adăugat încă nicio poză.</p>}
      <div className="thumbs">
        {(photos || []).map((p) => (
          <figure className="thumb" key={p.id}>
            <img src={photoUrl(p.path)} alt={p.caption || 'Poză din galerie'} loading="lazy" />
            {p.caption && <figcaption>{p.caption}</figcaption>}
            <form action={deletePhoto}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton className="linklike danger" message="Ștergi poza?">Șterge</ConfirmButton>
            </form>
          </figure>
        ))}
      </div>
    </main>
  )
}
