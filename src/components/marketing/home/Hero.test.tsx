// @vitest-environment jsdom

import axe from "axe-core";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import enMessages from "../../../../messages/en.json";
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

function renderHero() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <Hero />
      </NextIntlClientProvider>
    );
  });

  return { container, root };
}

describe("Hero", () => {
  beforeAll(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => ({
        clearRect: () => undefined,
        fillRect: () => undefined,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        measureText: () => ({ width: 0 }),
      }),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders one h1 and navigational CTAs", () => {
    const { container, root } = renderHero();

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('a[href="/auth/register"]')?.textContent).toContain("Scan your site");
    expect(container.querySelector('a[href="/sample-report"]')?.textContent).toContain(
      "View sample report"
    );

    act(() => root.unmount());
  });

  it("has no axe-core violations", async () => {
    const { container, root } = renderHero();

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
    act(() => root.unmount());
  });
});
