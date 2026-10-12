'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { setSiteImage } from '@/app/admin/actions'

// Logo: decupat pătrat din mijloc, 400 px. Poza de început: maximum 1400 px.
async function prepare(file, kind) {
  const bmp = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const png = kind === 'logo' && file.type === 'image/png'
  if (kind === 'logo') {
    const side = Math.min(bmp.width, bmp.height)
    const out = Math.min(400, side)
    canvas.width = out
    canvas.height = out
    if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out, out) }
    ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out)
  } else {
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  }
  const type = png ? 'image/png' : 'image/jpeg'
  const blob = await new Promise((res) => canvas.toBlob(res, type, 0.88))
  return { blob, type, ext: png ? 'png' : 'jpg' }
}

export default function SiteImageUploader({ kind, current, fallback }) {
  const router = useRouter()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  function pick(e) {
    const f = e.target.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
    setMsg(null)
  }

  async function submit(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMsg({ err: true, text: 'Alege mai întâi o poză.' })
    setBusy(true)
    setMsg(null)
    const sb = createClient()
    let path = null
    try {
      const { blob, type, ext } = await prepare(file, kind)
      path = `site/${kind}-${crypto.randomUUID()}.${ext}`
      const { error } = await sb.storage.from('gallery').upload(path, blob, { contentType: type })
      if (error) throw new Error(error.message)
      const r = await setSiteImage(kind, path)
      if (r?.error) throw new Error(r.error)
      setMsg({ text: 'Imaginea a fost salvată.' })
      fileRef.current.value = ''
      setPreview(null)
    } catch (err) {
      if (path) await sb.storage.from('gallery').remove([path])
      setMsg({ err: true, text: `Nu am putut salva imaginea. ${err.message || ''}` })
    }
    setBusy(false)
    router.refresh()
  }

  const shown = preview || current || fallback
  return (
    <form onSubmit={submit} className="form">
      <div className={kind === 'logo' ? 'img-prev round' : 'img-prev wide'}>
        <img src={shown} alt={kind === 'logo' ? 'Logo' : 'Poza de la început'} />
      </div>
      <label>
        Alege poza
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} />
      </label>
      {msg && <p className={msg.err ? 'alert err' : 'alert ok'} role="status">{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Se încarcă…' : 'Salvează imaginea'}</button>
    </form>
  )
}
