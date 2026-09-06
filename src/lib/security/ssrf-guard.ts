import { promises as dns } from 'dns'
import net from 'net'

/**
 * Centralised SSRF guard for any user-supplied URL that the server is going
 * to fetch, scan, or hand to a headless browser.
 *
 * The guard performs *both* a string-level check AND a DNS resolution check
 * because a hostname like `attacker.example.com` that publicly resolves to
 * `127.0.0.1` (or to a metadata IP like `169.254.169.254`) would otherwise
 * bypass naive substring filters.
 *
 * Usage:
 *
 *   const result = await assertPublicHttpUrl(input)
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
 *   const { url } = result   // the validated URL object
 */

export interface SsrfOk {
  ok: true
  url: URL
}
export interface SsrfErr {
  ok: false
  error: string
}
export type SsrfResult = SsrfOk | SsrfErr

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:'])
// Allow standard web ports + nothing else. Block anything weird (SMB:445, Redis:6379, etc.)
const ALLOWED_PORTS: ReadonlySet<string> = new Set(['', '80', '443'])

const BLOCKED_HOSTNAME_EXACT: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'ip6-localhost',
  'ip6-loopback',
])

const BLOCKED_HOSTNAME_SUFFIXES: readonly string[] = [
  '.local',
  '.internal',
  '.localhost',
  '.lan',
  '.intranet',
  '.private',
  '.corp',
  '.home',
  '.test',
  '.example',
  '.invalid',
]

/** Does an IPv4 address fall inside a private / reserved range? */
function isPrivateIPv4(ip: string): boolean {
  if (net.isIPv4(ip) === false) return false
  const [a, b] = ip.split('.').map(Number)
  if (a === 0) return true                              // 0.0.0.0/8 — current network
  if (a === 10) return true                             // 10.0.0.0/8 — RFC1918
  if (a === 127) return true                            // 127.0.0.0/8 — loopback
  if (a === 169 && b === 254) return true               // 169.254.0.0/16 — link-local + AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true      // 172.16.0.0/12 — RFC1918
  if (a === 192 && b === 0) return true                 // 192.0.0.0/24 — IETF protocol assignments
  if (a === 192 && b === 168) return true               // 192.168.0.0/16 — RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true     // 100.64.0.0/10 — CGNAT
  if (a >= 224) return true                             // 224.0.0.0/4 + 240.0.0.0/4 — multicast/reserved
  return false
}

/** Does an IPv6 address fall inside a loopback / link-local / unique-local range? */
function isPrivateIPv6(ip: string): boolean {
  if (net.isIPv6(ip) === false) return false
  // Expand before checking ranges. URL normalizes dotted mapped addresses to
  // hexadecimal (e.g. ::ffff:127.0.0.1 becomes ::ffff:7f00:1).
  let normalized = ip.toLowerCase().split('%')[0]
  normalized = normalized.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/, (_match, a, b, c, d) =>
    `${((Number(a) << 8) | Number(b)).toString(16)}:${((Number(c) << 8) | Number(d)).toString(16)}`)
  const [left, right] = normalized.split('::')
  const head = left ? left.split(':') : []
  const tail = right ? right.split(':') : []
  const groups = (right === undefined ? head : [
    ...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail,
  ]).map((group) => Number.parseInt(group, 16))

  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] <= 1) return true
  if ((groups[0] & 0xffc0) === 0xfe80) return true // Full link-local fe80::/10
  if ((groups[0] & 0xfe00) === 0xfc00) return true // Unique-local fc00::/7
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    const embeddedIPv4 = [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.')
    return isPrivateIPv4(embeddedIPv4)
  }
  return false
}

export function isPrivateIP(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip)
}

/**
 * Validate a user-supplied URL for safe outbound fetching.
 *
 * In test/development environments the DNS check is skipped so unit tests
 * against `http://localhost:xxxx` mock servers still work. Set
 * `SSRF_GUARD_FORCE=1` to force the full check everywhere (recommended in CI).
 */
export async function assertPublicHttpUrl(input: unknown): Promise<SsrfResult> {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { ok: false, error: 'URL is required' }
  }

  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }

  // 1. Protocol whitelist
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, error: 'Only http and https URLs are allowed' }
  }

  // 2. Port whitelist
  if (!ALLOWED_PORTS.has(url.port)) {
    return { ok: false, error: 'Only standard web ports (80, 443) are allowed' }
  }

  // 3. Userinfo (user:pass@host) is a classic SSRF bypass — reject outright
  if (url.username || url.password) {
    return { ok: false, error: 'URLs with credentials are not allowed' }
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '')

  if (hostname.length === 0) {
    return { ok: false, error: 'Invalid hostname' }
  }

  // 4. String-level blocklist (hostnames + suffixes)
  if (BLOCKED_HOSTNAME_EXACT.has(hostname)) {
    return { ok: false, error: 'Internal or private network addresses are not allowed' }
  }
  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { ok: false, error: 'Internal or reserved TLDs are not allowed' }
    }
  }

  // 5. If the hostname is itself a literal IP, check directly
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      return { ok: false, error: 'Internal or private network addresses are not allowed' }
    }
    return { ok: true, url }
  }

  // 6. DNS resolution check — protects against rebinding & wildcard records
  //    that resolve a public name to a private IP (e.g. spoofed.example.com → 127.0.0.1).
  const skipDns =
    process.env.SSRF_GUARD_FORCE !== '1' &&
    (process.env.NODE_ENV === 'test' || process.env.SSRF_GUARD_SKIP_DNS === '1')
  if (skipDns) {
    return { ok: true, url }
  }

  let addresses: string[]
  try {
    const lookups = await dns.lookup(hostname, { all: true, verbatim: true })
    addresses = lookups.map((l) => l.address)
  } catch {
    return { ok: false, error: 'Hostname could not be resolved' }
  }

  if (addresses.length === 0) {
    return { ok: false, error: 'Hostname could not be resolved' }
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      return { ok: false, error: 'Hostname resolves to a private network address' }
    }
  }

  return { ok: true, url }
}
