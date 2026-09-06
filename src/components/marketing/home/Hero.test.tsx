// @vitest-environment jsdom

import axe from "axe-core";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import deMessages from "../../../../messages/de.json";
import enMessages from "../../../../messages/en.json";
import esMessages from "../../../../messages/es.json";
import frMessages from "../../../../messages/fr.json";
import nlMessages from "../../../../messages/nl.json";
import ptMessages from "../../../../messages/pt.json";
import { setPendingScanUrl } from "@/lib/pending-scan";
import { trackEvent } from "@/lib/analytics-events";
import { Hero } from "./Hero";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/pending-scan", () => ({ setPendingScanUrl: vi.fn() }));
vi.mock("@/lib/analytics-events", () => ({ trackEvent: vi.fn() }));

const localeMessages = { en: enMessages, nl: nlMessages, de: deMessages, fr: frMessages, es: esMessages, pt: ptMessages };
const roots: Root[] = [];
const fetchMock = vi.fn();

function renderHero(locale: keyof typeof localeMessages = "en") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const onIntlError = vi.fn();

  act(() => {
    root.render(
      <NextIntlClientProvider locale={locale} messages={localeMessages[locale]} timeZone="UTC" onError={onIntlError}>
        <Hero />
      </NextIntlClientProvider>
    );
  });

  return { container, onIntlError };
}

function enterUrl(container: HTMLElement, value: string) {
  act(() => {
    const input = container.querySelector("input")!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submitScan(container: HTMLElement) {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function response(body: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("Hero", () => {
  beforeAll(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        clearRect: () => undefined,
        fillRect: () => undefined,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        measureText: () => ({ width: 0 }),
      }),
    });
  });

  beforeEach(() => {
    fetchMock.mockReset().mockRejectedValue(new Error("Unexpected request in a unit test"));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    act(() => roots.splice(0).forEach((root) => root.unmount()));
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("renders one h1, navigational CTAs, and an explicitly labelled sample without fetching", () => {
    const { container } = renderHero();

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain("Scan your site");
    expect(container.querySelector('a[href="/sample-report"]')?.textContent).toContain(
      "View sample report"
    );
    expect(container.querySelector("figcaption")?.textContent).toContain(enMessages.brandHome.demoLabel);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("has no axe-core violations", async () => {
    const { container } = renderHero();

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });

  it.each(["", "not-a-domain", "https://"])('rejects invalid URL "%s" with an associated error and no request', async (url) => {
    const { container } = renderHero();
    enterUrl(container, url);
    await submitScan(container);

    const input = container.querySelector("input")!;
    const error = container.querySelector("#hero-scan-error")!;
    expect(error.textContent).toBe(enMessages.hero.urlInvalid);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(error.id);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setPendingScanUrl).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();

    enterUrl(container, "example.com");
    expect(container.querySelector("#hero-scan-error")).toBeNull();
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("replaces every sample metric with the real response and limits findings to three", async () => {
    fetchMock.mockResolvedValue(response({
      ok: true,
      result: {
        score: 91,
        totalIssues: 4,
        impactCritical: 1,
        impactSerious: 2,
        impactModerate: 1,
        impactMinor: 0,
        examples: [
          { id: "real-one", impact: "critical", help: "Real button finding" },
          { id: "real-two", impact: "serious", description: "Real description fallback" },
          { id: "real-id-fallback", impact: "unknown" },
          { id: "not-shown", impact: "minor", help: "Fourth finding should not render" },
        ],
      },
    }));
    const { container } = renderHero();
    enterUrl(container, "customer.example.com/review");
    await submitScan(container);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/free-scan", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://customer.example.com/review" }),
      signal: expect.any(AbortSignal),
    }));
    expect(setPendingScanUrl).toHaveBeenCalledWith("https://customer.example.com/review");
    expect(trackEvent).toHaveBeenCalledWith("hero_scan_submit", { location: "hero" });
    expect(container.querySelector("figure h2")?.textContent).toBe("customer.example.com/review");
    expect(container.querySelector("figcaption")?.textContent).toContain(enMessages.brandHome.resultReady);
    expect(container.querySelector("figcaption")?.textContent).not.toContain(enMessages.brandHome.demoLabel);
    expect(container.textContent).not.toContain(enMessages.brandHome.demoHint);
    expect(container.textContent).toContain(enMessages.brandHome.scopeNote);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("4 issues found");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("91/ 100");
    expect(Array.from(container.querySelectorAll("dl dd"), (el) => el.textContent)).toEqual(["1", "2", "1", "0"]);
    const findings = container.querySelectorAll("figure li");
    expect(findings).toHaveLength(3);
    expect(findings[0].textContent).toContain("Real button finding");
    expect(findings[1].textContent).toContain("Real description fallback");
    expect(findings[2].textContent).toContain("real-id-fallback");
    expect(findings[2].textContent).toContain(enMessages.hero.severityModerate);
    expect(container.textContent).not.toContain("Fourth finding should not render");
    expect(container.textContent).not.toContain(enMessages.hero.console.demoFind1);
    expect(container.querySelector('figure a[href="/auth/register"]')?.textContent).toContain(enMessages.hero.console.fullReport);
    expect(container.querySelector('button[type="submit"]')?.hasAttribute("disabled")).toBe(false);
  });

  it("reports zero automated findings accurately without retaining demo issues", async () => {
    fetchMock.mockResolvedValue(response({ ok: true, result: {
      score: 100, totalIssues: 0, impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0, examples: [],
    } }));
    const { container } = renderHero();
    enterUrl(container, "example.com");
    await submitScan(container);

    expect(container.querySelector('[role="status"]')?.textContent).toContain(enMessages.brandHome.noIssues);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("100/ 100");
    expect(Array.from(container.querySelectorAll("dl dd"), (el) => el.textContent)).toEqual(["0", "0", "0", "0"]);
    expect(container.querySelectorAll("figure li")).toHaveLength(0);
    expect(container.textContent).toContain(enMessages.brandHome.scopeNote);
    expect(container.textContent).not.toContain("31 issues found");
    expect(container.textContent).not.toContain(enMessages.hero.console.demoFind1);
  });

  it("offers account creation when the free scan rate limit is reached", async () => {
    fetchMock.mockResolvedValue(response({ ok: false, code: "RATE_LIMITED" }, false));
    const { container } = renderHero();
    enterUrl(container, "example.com");
    await submitScan(container);

    const alert = container.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain(enMessages.hero.console.errorRateLimit);
    expect(alert.querySelector("a")?.getAttribute("href")).toBe("/auth/register");
    expect(alert.querySelector("a")?.textContent).toContain(enMessages.hero.console.createAccount);
    expect(container.querySelector('form[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('button[type="submit"]')?.hasAttribute("disabled")).toBe(false);
  });

  it("offers the full scanner with the normalized URL after a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network connection lost"));
    const { container } = renderHero();
    enterUrl(container, "example.com/services");
    await submitScan(container);

    const alert = container.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain(enMessages.hero.console.errorGeneric);
    expect(alert.querySelector("a")?.getAttribute("href")).toBe("/free-scan?url=https%3A%2F%2Fexample.com%2Fservices");
    expect(alert.querySelector("a")?.textContent).toContain(enMessages.hero.console.retry);
    expect(container.querySelector('button[type="submit"]')?.hasAttribute("disabled")).toBe(false);
  });

  it("disables scanning controls and blocks duplicate submissions while a request is pending", async () => {
    let resolveRequest!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    fetchMock.mockReturnValue(pending);
    const { container } = renderHero();
    enterUrl(container, "example.com");
    await submitScan(container);

    const button = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain(enMessages.brandHome.scanBusy);
    expect(container.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("figure")?.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector('[role="status"]')?.textContent).toContain(enMessages.hero.console.progress1);
    await submitScan(container);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest(response({ ok: true, result: { score: 100, totalIssues: 0, examples: [] } }));
      await pending;
    });
    expect(button.disabled).toBe(false);
    expect(container.querySelector("form")?.getAttribute("aria-busy")).toBe("false");
    expect(container.querySelector("figure")?.getAttribute("aria-busy")).toBe("false");
  });

  it("lets a visitor expand the sample finding using a native disclosure", () => {
    const { container } = renderHero();
    const details = container.querySelector<HTMLDetailsElement>("figure details")!;
    expect(details.open).toBe(false);
    act(() => details.querySelector("summary")!.click());
    expect(details.open).toBe(true);
    expect(details.textContent).toContain(enMessages.brandHome.findingBody);
    expect(details.querySelector("code")?.textContent).toBe('<button aria-label="Search">');
    expect(details.textContent).toContain(enMessages.brandHome.recommendation);
    act(() => details.querySelector("summary")!.click());
    expect(details.open).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(Object.keys(localeMessages) as Array<keyof typeof localeMessages>)("renders the %s locale without missing message errors", (locale) => {
    const { container, onIntlError } = renderHero(locale);
    expect(container.querySelector("h1")?.textContent).toContain(localeMessages[locale].brandHome.headline);
    expect(container.querySelector("figcaption")?.textContent).toContain(localeMessages[locale].brandHome.demoLabel);
    const sampleHref = locale === "en" ? "/sample-report" : `/${locale}/sample-report`;
    expect(container.querySelector(`a[href="${sampleHref}"]`)).not.toBeNull();
    expect(onIntlError).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
