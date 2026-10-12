'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addPhoto } from '@/app/admin/actions'

async function shrink(file, max = 1600) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82))
}

export default function GalleryUploader() {
  const router = useRouter()
  const fileRef = useRef(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function submit(e) {
    e.preventDefault()
    const files = Array.from(fileRef.current?.files || [])
    if (!files.length) return setMsg({ err: true, text: 'Alege cel puțin o poză.' })
    setBusy(true)
    setMsg(null)
    const sb = createClient()
    let ok = 0
    try {
      for (const f of files) {
        const blob = await shrink(f)
        const path = `${crypto.randomUUID()}.jpg`
        const { error } = await sb.storage.from('gallery').upload(path, blob, { contentType: 'image/jpeg' })
        if (error) throw new Error(error.message)
        const r = await addPhoto(path, caption)
        if (r?.error) throw new Error(r.error)
        ok++
      }
      setMsg({ text: ok === 1 ? 'Poza a fost adăugată.' : `${ok} poze au fost adăugate.` })
      setCaption('')
      fileRef.current.value = ''
    } catch (err) {
      setMsg({ err: true, text: `Nu am putut încărca poza. ${err.message || ''}` })
    }
    setBusy(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="form card">
      <label>
        Poze <small>(poți alege mai multe odată)</small>
        <input ref={fileRef} type="file" accept="image/*" multiple />
      </label>
      <label>
        Descriere <small>(opțional, apare sub poză)</small>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} />
      </label>
      {msg && <p className={msg.err ? 'alert err' : 'alert ok'} role="status">{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Se încarcă…' : 'Încarcă pozele'}</button>
    </form>
  )
}
