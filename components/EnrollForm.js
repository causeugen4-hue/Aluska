'use client'
import { useState } from 'react'
import { enrollInLesson } from '@/app/lectie/[id]/[date]/actions'
import { lei, TRIAL_PRICE } from '@/lib/dates'

export default function EnrollForm({ groupId, lessonDate, price, kids }) {
  const firstFree = kids.find((k) => !k.booked)
  const [child, setChild] = useState(firstFree?.id || 'new')
  const isNew = child === 'new'
  const kid = kids.find((k) => k.id === child)
  const canTrial = isNew || kid?.firstTime
  const cheaper = Number(price) > TRIAL_PRICE

  return (
    <form action={enrollInLesson} className="form card">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="lesson_date" value={lessonDate} />

      <label>
        Copilul
        <select name="child_id" value={child} onChange={(e) => setChild(e.target.value)}>
          {kids.map((k) => (
            <option key={k.id} value={k.id} disabled={k.booked}>
              {k.name}{k.booked ? ' (deja înscris)' : ''}
            </option>
          ))}
          <option value="new">{kids.length ? '+ Alt copil (nou)' : '+ Copil nou'}</option>
        </select>
      </label>

      {isNew && (
        <>
          <label>Numele copilului<input name="name" required /></label>
          <label>Data nașterii<input name="birth_date" type="date" /></label>
          <label>Observații <small>(alergii, dorințe, opțional)</small><input name="notes" /></label>
        </>
      )}

      {canTrial && cheaper && (
        <label className="check trial-opt">
          <input type="checkbox" name="is_trial" />
          <span>
            Lecție de probă: {lei(TRIAL_PRICE)} în loc de {lei(price)}
            <small> (doar pentru prima lecție a copilului, se achită în prima zi)</small>
          </span>
        </label>
      )}

      <button className="btn">Înscrie la această lecție</button>
    </form>
  )
}
