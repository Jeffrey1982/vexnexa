const APPLICATION_PREFIXES = [
  '/dashboard',
  '/sites',
  '/scans',
  '/settings',
  '/teams',
  '/report',
  '/admin',
  '/analytics',
  '/advanced-analytics',
  '/onboarding',
] as const;

/** App-only services should not make requests on public or authentication pages. */
export function isApplicationPath(pathname: string | null): boolean {
  if (!pathname) return false;

  const path = pathname.replace(/^\/(?:en|nl|de|fr|es|pt)(?=\/|$)/, '') || '/';
  return APPLICATION_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
