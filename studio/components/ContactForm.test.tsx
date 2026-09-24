// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Locale, StudioContent } from '../lib/content'
import { ContactForm } from './ContactForm'

const copy: StudioContent['contact'] = {
  eyebrow: 'Contact', title: 'Say hello', intro: 'Write to us.', directTitle: 'Email us', directBody: 'Our inbox',
  nameLabel: 'Name', emailLabel: 'Email address', messageLabel: 'Message', namePlaceholder: 'Your name',
  emailPlaceholder: 'you@example.com', messagePlaceholder: 'How can we help?', requiredHint: 'All fields are required.',
  privacyIntro: 'Read our', privacyLink: 'privacy notice', privacyLabel: 'I have read the privacy notice.',
  submit: 'Send message', sending: 'Sending message…', successTitle: 'Your message has been sent.',
  successBody: 'We will reply to the email address you provided.', reset: 'Send another message',
  errors: {
    name: 'Enter your name.', email: 'Enter a valid email address.', message: 'Use 10 to 5,000 characters.',
    privacyAccepted: 'Please acknowledge the privacy notice.', rateLimit: 'Too many messages. Try again later or email us.',
    send: 'We could not confirm delivery. Try again or email us.', unavailable: 'The form is unavailable. Email us instead.',
  },
}
const uuid = 'f7f88fda-bb69-478a-a6d5-531a3727d1d0'
const secondUuid = 'e6fb29dc-df55-44ac-a260-e6c5cbe4ee76'
const jsonResponse = (data: unknown, status = 200, headers?: Record<string, string>) => new Response(JSON.stringify(data), { status, headers })
const getForm = () => screen.getByTestId('contact-form')
function fillValid() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Developer' } })
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alex@example.com' } })
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'I would like to discuss a game collaboration.' } })
  fireEvent.click(screen.getByLabelText(copy.privacyLabel))
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true })))
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(uuid)
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders labeled, constrained fields and a localized privacy link', () => {
    render(<ContactForm locale="nl" copy={copy} />)
    expect(screen.getByLabelText('Name').getAttribute('id')).toBe('contact-name')
    expect(screen.getByLabelText('Name').getAttribute('maxlength')).toBe('100')
    expect(screen.getByLabelText('Email address').getAttribute('type')).toBe('email')
    expect(screen.getByLabelText('Message').getAttribute('maxlength')).toBe('5000')
    expect(screen.getByLabelText(copy.privacyLabel).hasAttribute('required')).toBe(true)
    expect(screen.getByRole('link', { name: 'privacy notice' }).getAttribute('href')).toBe('/nl/privacy')
    expect(screen.getByLabelText('Website').getAttribute('tabindex')).toBe('-1')
    expect(getForm().getAttribute('method')).toBe('post')
    expect(getForm().getAttribute('action')).toBe('/api/contact')
  })

  it('shows localized inline errors on submit and focuses the first invalid field', () => {
    render(<ContactForm locale="en" copy={copy} />)
    fireEvent.submit(getForm())
    expect(screen.getByText(copy.errors.name)).toBeDefined()
    expect(screen.getByText(copy.errors.email)).toBeDefined()
    expect(screen.getByText(copy.errors.message)).toBeDefined()
    expect(screen.getByText(copy.errors.privacyAccepted)).toBeDefined()
    expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toBe('contact-name-error')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('validates on blur and clears an existing error when fixed', () => {
    render(<ContactForm locale="en" copy={copy} />)
    const input = screen.getByLabelText('Email address')
    fireEvent.change(input, { target: { value: 'not-email' } })
    fireEvent.blur(input)
    expect(screen.getByText(copy.errors.email)).toBeDefined()
    fireEvent.change(input, { target: { value: 'alex@example.com' } })
    expect(screen.queryByText(copy.errors.email)).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('false')
  })

  it.each([
    ['Name', 'A', 'name'], ['Name', '   ', 'name'], ['Name', 'Alex\u0000', 'name'],
    ['Email address', 'invalid', 'email'], ['Message', 'short', 'message'],
    ['Message', 'Invalid\u0000message.', 'message'],
  ])('blocks invalid %s value %j', (label, value, error) => {
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.submit(getForm())
    expect(screen.getByText(copy.errors[error as 'name' | 'email' | 'message'])).toBeDefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['nl', 'en', 'de', 'fr', 'es', 'pt', 'tl'] as Locale[])('sends validated locale %s with the exact backend contract', async locale => {
    render(<ContactForm locale={locale} copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByTestId('contact-success')
    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/contact')
    expect(options?.method).toBe('POST')
    expect(options?.credentials).toBe('same-origin')
    expect(JSON.parse(String(options?.body))).toEqual({
      name: 'Alex Developer', email: 'alex@example.com', message: 'I would like to discuss a game collaboration.',
      locale, privacyAccepted: true, website: '', requestId: uuid,
    })
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })

  it('only confirms success after an explicit successful response and moves focus to confirmation', async () => {
    let resolve: (response: Response) => void = () => {}
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(accept => { resolve = accept }))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    expect(screen.queryByTestId('contact-success')).toBeNull()
    expect((screen.getByRole('button', { name: /Sending message/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(true)
    expect(getForm().getAttribute('aria-busy')).toBe('true')
    await act(async () => resolve(jsonResponse({ success: true })))
    expect(screen.getByRole('status')).toBeDefined()
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: copy.successTitle }))
  })

  it('blocks synchronous duplicate submissions before React rerenders', async () => {
    let resolve: (response: Response) => void = () => {}
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(accept => { resolve = accept }))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    const form = getForm()
    act(() => {
      fireEvent.submit(form)
      fireEvent.submit(form)
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    await act(async () => resolve(jsonResponse({ success: true })))
  })

  it('retains inputs and the exact same payload/UUID after a network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network disconnected'))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(copy.errors.send)
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Alex Developer')
    expect((screen.getByLabelText(copy.privacyLabel) as HTMLInputElement).checked).toBe(true)
    const original = vi.mocked(fetch).mock.calls[0][1]?.body
    fireEvent.submit(getForm())
    await screen.findByTestId('contact-success')
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(original)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })

  it('gives an edited message a new UUID while whitespace-only changes retain normalized payload', async () => {
    vi.mocked(crypto.randomUUID).mockReturnValueOnce(uuid).mockReturnValueOnce(secondUuid)
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false, error: 'delivery_failed' }, 502))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(copy.errors.send)
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'This is a different message about our collaboration.' } })
    fireEvent.submit(getForm())
    await screen.findByTestId('contact-success')
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)).requestId).toBe(secondUuid)
  })

  it('keeps the retry ID when only surrounding whitespace changes', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection lost'))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(copy.errors.send)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' Alex Developer ' } })
    fireEvent.submit(getForm())
    await screen.findByTestId('contact-success')
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(vi.mocked(fetch).mock.calls[0][1]?.body)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })

  it.each([
    [jsonResponse({ success: false, error: 'delivery_failed' }, 502), copy.errors.send],
    [jsonResponse({ success: false, error: 'unavailable' }, 503), copy.errors.unavailable],
    [jsonResponse({ success: true }, 500), copy.errors.send],
    [jsonResponse({ success: false }, 200), copy.errors.send],
    [jsonResponse(null, 200), copy.errors.send],
    [new Response('<html>upstream failure</html>', { status: 502 }), copy.errors.send],
  ])('does not report a malformed or unsuccessful response as success', async (response, message) => {
    vi.mocked(fetch).mockResolvedValueOnce(response)
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(message)
    expect(screen.queryByTestId('contact-success')).toBeNull()
    expect((screen.getByRole('button', { name: /Send message/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('maps server field validation to local copy without echoing server text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false, error: 'invalid_input', fieldErrors: { email: ['UNTRUSTED error message'] } }, 400))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(copy.errors.email)
    expect(document.activeElement).toBe(screen.getByLabelText('Email address'))
    expect(screen.queryByText('UNTRUSTED error message')).toBeNull()
  })

  it('shows a recoverable notice for a server validation error without supported fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false, error: 'invalid_input', fieldErrors: { form: ['invalid'] } }, 400))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByText(copy.errors.send)
  })

  it('explains rate limiting and respects Retry-After before enabling a retry', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false, error: 'rate_limited' }, 429, { 'retry-after': '120' }))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    await act(async () => fireEvent.submit(getForm()))
    expect(screen.getByText(copy.errors.rateLimit)).toBeDefined()
    expect((screen.getByRole('button', { name: /Send message/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.submit(getForm())
    expect(fetch).toHaveBeenCalledTimes(1)
    await act(async () => vi.advanceTimersByTime(120_000))
    expect((screen.getByRole('button', { name: /Send message/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('aborts at 30 seconds, keeps input, and leaves retries safe', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(screen.getByText(copy.errors.send)).toBeDefined()
    expect(screen.queryByTestId('contact-success')).toBeNull()
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toContain('game collaboration')
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true)
  })

  it('aborts an outstanding request on unmount', () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}))
    const view = render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal
    expect(signal?.aborted).toBe(false)
    view.unmount()
    expect(signal?.aborted).toBe(true)
  })

  it('resets to a fresh accessible form after a confirmed message', async () => {
    const user = userEvent.setup()
    render(<ContactForm locale="en" copy={copy} />)
    fillValid()
    fireEvent.submit(getForm())
    await screen.findByTestId('contact-success')
    await user.click(screen.getByRole('button', { name: copy.reset }))
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(copy.privacyLabel) as HTMLInputElement).checked).toBe(false)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Name')))
  })
})
