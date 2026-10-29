'use client'
import { useState } from 'react'
import { enrollInLesson } from '@/app/lectie/[id]/[date]/actions'
import { lei, TRIAL_PRICE } from '@/lib/dates'
import { lessonsWord } from '@/lib/subscriptions'
import SubmitButton from '@/components/SubmitButton'

export default function EnrollForm({ groupId, lessonDate, lessonLabel, price, kids, subRemaining = 0 }) {
  const firstFree = kids.find((k) => !k.booked)
  const [child, setChild] = useState(firstFree?.id || 'new')
  const hasSub = subRemaining > 0
  const [pay, setPay] = useState(hasSub ? 'sub' : 'single')
  const isNew = child === 'new'
  const kid = kids.find((k) => k.id === child)
  const canTrial = isNew || kid?.firstTime
  const cheaper = Number(price) > TRIAL_PRICE
  const showTrial = canTrial && cheaper
  // dacă s-a ales copilul pentru care proba nu mai e posibilă, revenim la altă variantă
  const effPay = pay === 'trial' && !showTrial ? (hasSub ? 'sub' : 'single') : pay

  return (
    <form action={enrollInLesson} className="form card">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="lesson_date" value={lessonDate} />

      <p className="confirm-day">Te înscrii la: <strong>{lessonLabel}</strong></p>

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

      {hasSub ? (
        <fieldset className="pay-opts">
          <legend>Cum achiți lecția?</legend>
          <label className="pay-opt">
            <input type="radio" name="pay" value="sub" checked={effPay === 'sub'} onChange={() => setPay('sub')} />
            <span>
              Cu abonamentul <small>(mai ai {lessonsWord(subRemaining)})</small>
              {subRemaining === 1 && <small className="last-lesson"> Aceasta este ultima lecție din abonament.</small>}
            </span>
          </label>
          {showTrial && (
            <label className="pay-opt">
              <input type="radio" name="pay" value="trial" checked={effPay === 'trial'} onChange={() => setPay('trial')} />
              <span>Lecție de probă: {lei(TRIAL_PRICE)} <small>(doar pentru prima lecție a copilului)</small></span>
            </label>
          )}
          <label className="pay-opt">
            <input type="radio" name="pay" value="single" checked={effPay === 'single'} onChange={() => setPay('single')} />
            <span>Plătesc doar această lecție: {lei(price)}</span>
          </label>
        </fieldset>
      ) : (
        showTrial && (
          <label className="check trial-opt">
            <input type="checkbox" name="is_trial" />
            <span>
              Lecție de probă: {lei(TRIAL_PRICE)} în loc de {lei(price)}
              <small> (doar pentru prima lecție a copilului, se achită în prima zi)</small>
            </span>
          </label>
        )
      )}

      <SubmitButton pendingText="Se face înscrierea…">Înscrie la această lecție</SubmitButton>
    </form>
  )
}
