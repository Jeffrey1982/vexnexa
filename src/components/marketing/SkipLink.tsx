"use client";

/**
 * Skip to Main Content Link - Marketing Pages
 * WCAG 2.1/2.2 AAA Compliant
 * Allows keyboard users to bypass navigation and go directly to main content
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}
