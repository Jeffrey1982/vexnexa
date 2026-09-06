// @vitest-environment jsdom

import axe from "axe-core";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import enMessages from "../../../messages/en.json";
import { FAQ } from "./FAQ";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const roots: Root[] = [];

function renderFAQ(items = [
  { question: "What does the report include?", answer: "Findings and remediation guidance." },
  { question: "Can I use my own brand?", answer: "Yes, with a white-label report." },
], className?: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <FAQ items={items} title="Questions, answered." description="Before your first scan." className={className} />
    </NextIntlClientProvider>,
  ));
  return container;
}

describe("FAQ", () => {
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

  afterEach(() => {
    act(() => roots.splice(0).forEach((root) => root.unmount()));
    document.body.innerHTML = "";
  });

  it("uses native disclosures that can open independently without a height limit", () => {
    const container = renderFAQ();
    const disclosures = container.querySelectorAll("details");
    expect(disclosures).toHaveLength(2);
    expect(disclosures[0].open).toBe(false);
    act(() => disclosures[0].querySelector("summary")!.click());
    act(() => disclosures[1].querySelector("summary")!.click());
    expect(disclosures[0].open).toBe(true);
    expect(disclosures[1].open).toBe(true);
    expect(container.querySelector('[class*="max-h-"]')).toBeNull();
    act(() => disclosures[0].querySelector("summary")!.click());
    expect(disclosures[0].open).toBe(false);
  });

  it("renders safe local and HTTPS markdown links without interpreting HTML", () => {
    const container = renderFAQ([{
      question: "Where can I see an example?",
      answer: 'Read the [sample report](/sample-report) or [documentation](https://example.com/docs). <strong>Plain text</strong>',
    }]);
    const answer = container.querySelector("details > div")!;
    expect(answer.querySelector('a[href="/sample-report"]')?.textContent).toBe("sample report");
    expect(answer.querySelector('a[href="https://example.com/docs"]')?.textContent).toBe("documentation");
    expect(answer.querySelector("strong")).toBeNull();
    expect(answer.textContent).toContain("<strong>Plain text</strong>");
  });

  it.each([
    "javascript:alert%281%29",
    "data:text/html,test",
    "http://example.com",
    "//example.com",
    "/\\example.com",
    "https://example.com/has a space",
  ])("does not create a link for unsafe or unsupported href %s", (href) => {
    const container = renderFAQ([{ question: "Is this safe?", answer: `[Example](${href})` }]);
    const answer = container.querySelector("details > div")!;
    expect(answer.querySelector("a")).toBeNull();
    expect(answer.textContent).toBe(`[Example](${href})`);
  });

  it("escapes script-closing text in structured data", () => {
    const container = renderFAQ([{
      question: "Safe structured data?",
      answer: "</script><script>alert(1)</script>",
    }]);
    const script = container.querySelector('script[type="application/ld+json"]')!;
    expect(script.textContent).not.toContain("<");
    expect(container.querySelectorAll("script")).toHaveLength(1);
    expect(JSON.parse(script.textContent!).mainEntity[0].acceptedAnswer.text).toBe("</script><script>alert(1)</script>");
  });

  it("has unique section labels, optional styling, and no accessibility violations", async () => {
    const first = renderFAQ(undefined, "home-faq");
    const second = renderFAQ();
    const firstSection = first.querySelector("section")!;
    const secondSection = second.querySelector("section")!;
    expect(firstSection.classList.contains("home-faq")).toBe(true);
    expect(firstSection.getAttribute("aria-labelledby")).not.toBe(secondSection.getAttribute("aria-labelledby"));
    expect(first.querySelector("h2")!.id).toBe(firstSection.getAttribute("aria-labelledby"));
    first.querySelectorAll("details").forEach((details) => { details.open = true; });
    expect((await axe.run(first)).violations).toEqual([]);
  });
});
