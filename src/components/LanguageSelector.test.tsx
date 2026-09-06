// @vitest-environment jsdom
import { act } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LanguageSelector } from './LanguageSelector'
let root: Root | undefined
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  vi.stubGlobal('PointerEvent', MouseEvent)
})
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; container.remove(); vi.unstubAllGlobals() })
const ui = (locale: string) => <NextIntlClientProvider locale={locale} messages={{ nav: { language: 'Language' } }} timeZone="UTC"><LanguageSelector /></NextIntlClientProvider>
it.each([['en', 'EN'], ['nl', 'NL'], ['de', 'DE']])('renders the correct %s label before hydration and disables the inert trigger', (locale, label) => {
  container.innerHTML = renderToString(ui(locale))
  const trigger = container.querySelector('button')!
  expect(trigger.textContent).toBe(label)
  expect(trigger.disabled).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})
it('enables the trigger only after hydration and opens the real menu on the first pointer interaction', async () => {
  container.innerHTML = renderToString(ui('en'))
  await act(async () => { root = hydrateRoot(container, ui('en')) })
  const trigger = container.querySelector('button')!
  expect(trigger.disabled).toBe(false)
  await act(async () => {
    trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: false }))
  })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect([...document.querySelectorAll('[role="menuitem"]')].some(item => item.textContent?.includes('Nederlands'))).toBe(true)
})
