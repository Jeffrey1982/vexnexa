'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Locale, StudioContent } from '../lib/content'
import type { ContactPayload, ContactResponse } from '../lib/contact'

type Props = { locale: Locale; copy: StudioContent['contact'] }
type FieldName = 'name' | 'email' | 'message' | 'privacyAccepted'
type Fields = { name: string; email: string; message: string; privacyAccepted: boolean; website: string }
type FieldErrors = Partial<Record<FieldName, string>>
const emptyFields: Fields = { name: '', email: '', message: '', privacyAccepted: false, website: '' }
const fieldOrder: FieldName[] = ['name', 'email', 'message', 'privacyAccepted']
const fieldId = (field: FieldName) => `contact-${field === 'privacyAccepted' ? 'privacy' : field}`

function validField(field: FieldName, fields: Fields): boolean {
  if (field === 'privacyAccepted') return fields.privacyAccepted
  const value = fields[field].trim()
  if (field === 'name') return value.length >= 2 && value.length <= 100 && !/[\u0000-\u001f\u007f]/.test(value)
  if (field === 'email') return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  return value.length >= 10 && value.length <= 5000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
}

export function ContactForm({ locale, copy }: Props) {
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const [ready, setReady] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  const inFlight = useRef(false)
  const mounted = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const attempt = useRef<{ fingerprint: string; payload: ContactPayload } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const restoreFocus = useRef(false)
  const pendingFieldFocus = useRef<FieldName | null>(null)

  useEffect(() => {
    mounted.current = true
    setReady(true)
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
    if (status === 'idle' && pendingFieldFocus.current) {
      formRef.current?.querySelector<HTMLElement>(`#${fieldId(pendingFieldFocus.current)}`)?.focus()
      pendingFieldFocus.current = null
    }
    if (status === 'idle' && restoreFocus.current) {
      formRef.current?.querySelector<HTMLInputElement>('#contact-name')?.focus()
      restoreFocus.current = false
    }
  }, [status])

  useEffect(() => {
    if (!retryAt) return
    const timer = window.setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [retryAt])

  function focusField(field: FieldName) {
    formRef.current?.querySelector<HTMLElement>(`#${fieldId(field)}`)?.focus()
  }

  function changeField<K extends keyof Fields>(field: K, value: Fields[K]) {
    const next = { ...fields, [field]: value }
    setFields(next)
    if (field !== 'website') {
      const validatedField = field as FieldName
      if (errors[validatedField]) {
        setErrors(previous => ({ ...previous, [validatedField]: validField(validatedField, next) ? undefined : copy.errors[validatedField] }))
      }
    }
  }

  function validateBlur(field: FieldName) {
    setErrors(previous => ({ ...previous, [field]: validField(field, fields) ? undefined : copy.errors[field] }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !ready || retryAt > Date.now()) return
    const validation: FieldErrors = {}
    for (const field of fieldOrder) {
      if (!validField(field, fields)) validation[field] = copy.errors[field]
    }
    setErrors(validation)
    setNotice('')
    const firstInvalid = fieldOrder.find(field => validation[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }

    inFlight.current = true
    setStatus('pending')
    const abortController = new AbortController()
    controller.current = abortController
    const timeout = window.setTimeout(() => abortController.abort(), 30_000)

    try {
      const normalized = {
        name: fields.name.trim(), email: fields.email.trim(), message: fields.message.trim(),
        locale, privacyAccepted: true as const, website: fields.website,
      }
      const fingerprint = JSON.stringify(normalized)
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, payload: { ...normalized, requestId: crypto.randomUUID() } }
      }
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(attempt.current.payload),
        signal: abortController.signal,
      })
      const result = await response.json().catch(() => null) as ContactResponse | null
      if (!mounted.current) return
      if (response.ok && result?.success === true) {
        setStatus('success')
        return
      }

      if (response.status === 429) {
        const seconds = Number(response.headers.get('retry-after'))
        const wait = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 900) : 60
        setRetryAt(Date.now() + wait * 1000)
        setNotice(copy.errors.rateLimit)
      } else if (result && !result.success && result.error === 'invalid_input' && result.fieldErrors) {
        const serverErrors: FieldErrors = {}
        for (const field of fieldOrder) {
          if (Object.hasOwn(result.fieldErrors, field)) serverErrors[field] = copy.errors[field]
        }
        setErrors(serverErrors)
        const first = fieldOrder.find(field => serverErrors[field])
        if (first) pendingFieldFocus.current = first
        else setNotice(copy.errors.send)
      } else {
        setNotice(response.status === 503 ? copy.errors.unavailable : copy.errors.send)
      }
      setStatus('idle')
    } catch {
      if (mounted.current) {
        setNotice(copy.errors.send)
        setStatus('idle')
      }
    } finally {
      window.clearTimeout(timeout)
      controller.current = null
      inFlight.current = false
    }
  }

  if (status === 'success') {
    return (
      <section className="form-notice form-success" role="status" data-testid="contact-success">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h2 ref={successRef} tabIndex={-1}>{copy.successTitle}</h2>
        <p>{copy.successBody}</p>
        <button className="button button-secondary" type="button" onClick={() => {
          attempt.current = null
          setFields(emptyFields)
          setErrors({})
          setNotice('')
          restoreFocus.current = true
          setStatus('idle')
        }}>{copy.reset}</button>
      </section>
    )
  }

  const pending = status === 'pending'
  const describe = (field: FieldName) => errors[field] ? `${fieldId(field)}-error` : undefined
  const fieldError = (field: FieldName) => errors[field]
    ? <p className="field-error" id={`${fieldId(field)}-error`} role="alert">{errors[field]}</p>
    : null

  return (
    <form ref={formRef} className="contact-form" data-testid="contact-form" method="post" action="/api/contact" noValidate onSubmit={submit} aria-busy={pending}>
      <p className="form-required">{copy.requiredHint}</p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="contact-name">{copy.nameLabel}</label>
          <input id="contact-name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={100}
            placeholder={copy.namePlaceholder} value={fields.name} disabled={pending}
            aria-invalid={Boolean(errors.name)} aria-describedby={describe('name')}
            onChange={event => changeField('name', event.target.value)} onBlur={() => validateBlur('name')} />
          {fieldError('name')}
        </div>
        <div className="field">
          <label htmlFor="contact-email">{copy.emailLabel}</label>
          <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254}
            placeholder={copy.emailPlaceholder} value={fields.email} disabled={pending}
            aria-invalid={Boolean(errors.email)} aria-describedby={describe('email')}
            onChange={event => changeField('email', event.target.value)} onBlur={() => validateBlur('email')} />
          {fieldError('email')}
        </div>
        <div className="field field-full">
          <label htmlFor="contact-message">{copy.messageLabel}</label>
          <textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={7}
            placeholder={copy.messagePlaceholder} value={fields.message} disabled={pending}
            aria-invalid={Boolean(errors.message)} aria-describedby={describe('message')}
            onChange={event => changeField('message', event.target.value)} onBlur={() => validateBlur('message')} />
          {fieldError('message')}
        </div>
      </div>
      <div className="honey-pot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" name="website" autoComplete="off" tabIndex={-1} value={fields.website}
          onChange={event => changeField('website', event.target.value)} />
      </div>
      <p className="form-privacy">{copy.privacyIntro} <a href={`/${locale}/privacy`}>{copy.privacyLink}</a>.</p>
      <div className="field privacy-field">
        <label className="privacy-check" htmlFor="contact-privacy">
          <input id="contact-privacy" type="checkbox" name="privacyAccepted" required checked={fields.privacyAccepted} disabled={pending}
            aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={describe('privacyAccepted')}
            onChange={event => changeField('privacyAccepted', event.target.checked)} onBlur={() => validateBlur('privacyAccepted')} />
          <span>{copy.privacyLabel}</span>
        </label>
        {fieldError('privacyAccepted')}
      </div>
      {notice && <p className="form-notice form-error" role="alert">{notice}</p>}
      <button className="button button-primary" type="submit" disabled={!ready || pending || retryAt > Date.now()}>
        {pending ? copy.sending : copy.submit}<span aria-hidden="true">↗</span>
      </button>
      <noscript><p className="form-notice">{copy.errors.unavailable} <a href="mailto:info@vexnexa.com">info@vexnexa.com</a></p></noscript>
    </form>
  )
}
