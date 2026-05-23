/**
 * SSRF-safe fetch.
 *
 * Wraps fetch() with hostname validation that rejects:
 *   - non-http(s) protocols
 *   - cloud-metadata endpoints (AWS 169.254.169.254, GCP metadata.google.internal,
 *     Azure 169.254.169.254 / metadata, AliCloud 100.100.100.200)
 *   - IPv4 loopback (127.0.0.0/8), link-local (169.254.0.0/16),
 *     RFC1918 (10/8, 172.16/12, 192.168/16), CGNAT (100.64/10),
 *     broadcast (255.255.255.255), unspecified (0.0.0.0)
 *   - IPv6 loopback (::1), link-local (fe80::/10), unique-local (fc00::/7),
 *     unspecified (::), IPv4-mapped private ranges
 *   - hostnames whose first DNS resolution lands in any of the above ranges
 *
 * Use safeFetch() anywhere the URL is user-supplied. Throws SSRFError if the
 * target is blocked.
 */

export class SSRFError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

const BLOCKED_HOSTNAMES = new Set<string>([
  'metadata.google.internal',
  'metadata',
  'metadata.azure.com',
]);

function ipv4ToInt(parts: number[]): number {
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function parseIPv4(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (parts.some((p) => p < 0 || p > 255)) return null;
  return parts;
}

function isBlockedIPv4(parts: number[]): boolean {
  const ip = ipv4ToInt(parts);
  const ranges: Array<[number, number]> = [
    [ipv4ToInt([0, 0, 0, 0]),         ipv4ToInt([0, 255, 255, 255])],   // unspecified / current network
    [ipv4ToInt([10, 0, 0, 0]),        ipv4ToInt([10, 255, 255, 255])],  // RFC1918
    [ipv4ToInt([100, 64, 0, 0]),      ipv4ToInt([100, 127, 255, 255])], // CGNAT
    [ipv4ToInt([127, 0, 0, 0]),       ipv4ToInt([127, 255, 255, 255])], // loopback
    [ipv4ToInt([169, 254, 0, 0]),     ipv4ToInt([169, 254, 255, 255])], // link-local (includes cloud metadata)
    [ipv4ToInt([172, 16, 0, 0]),      ipv4ToInt([172, 31, 255, 255])],  // RFC1918
    [ipv4ToInt([192, 0, 0, 0]),       ipv4ToInt([192, 0, 0, 255])],     // protocol assignments
    [ipv4ToInt([192, 168, 0, 0]),     ipv4ToInt([192, 168, 255, 255])], // RFC1918
    [ipv4ToInt([198, 18, 0, 0]),      ipv4ToInt([198, 19, 255, 255])],  // benchmarking
    [ipv4ToInt([224, 0, 0, 0]),       ipv4ToInt([255, 255, 255, 255])], // multicast + reserved + broadcast
  ];
  return ranges.some(([lo, hi]) => ip >= lo && ip <= hi);
}

function isBlockedIPv6(host: string): boolean {
  // Loopback ::1, unspecified ::
  if (host === '::1' || host === '::' || host === '[::1]' || host === '[::]') return true;
  // Lowercase + strip brackets for comparison
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h.startsWith('fe80:') || h.startsWith('fe80::') ||
      h.startsWith('fc') || h.startsWith('fd')) return true;
  // IPv4-mapped (::ffff:a.b.c.d) — pull out the IPv4 portion and re-validate
  const v4Mapped = h.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Mapped) {
    const parts = parseIPv4(v4Mapped[1]);
    if (parts && isBlockedIPv4(parts)) return true;
  }
  return false;
}

export function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SSRFError('Invalid URL', rawUrl);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SSRFError(`Blocked protocol: ${url.protocol}`, rawUrl);
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) throw new SSRFError('Missing hostname', rawUrl);
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new SSRFError(`Blocked hostname: ${hostname}`, rawUrl);
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new SSRFError('Blocked: localhost', rawUrl);
  }

  // Literal IPv4 or IPv6 — short-circuit
  const ipv4 = parseIPv4(hostname);
  if (ipv4) {
    if (isBlockedIPv4(ipv4)) {
      throw new SSRFError(`Blocked private/reserved IPv4: ${hostname}`, rawUrl);
    }
    return url;
  }
  if (hostname.includes(':')) {
    if (isBlockedIPv6(hostname)) {
      throw new SSRFError(`Blocked private/reserved IPv6: ${hostname}`, rawUrl);
    }
    return url;
  }

  // DNS-resolved hostname: check the resolved address(es). We bail open on
  // resolver failure (DNS is best-effort here; the network may also block).
  return url;
}

/**
 * Resolve the hostname via Deno DNS and reject if ANY resolved address is in
 * a blocked range. Call this BEFORE fetch() when the URL came from user input.
 */
export async function assertSafeUrlResolved(rawUrl: string): Promise<URL> {
  const url = assertSafeUrl(rawUrl);
  const hostname = url.hostname.toLowerCase();
  // Skip resolution for literal IPs (already validated)
  if (parseIPv4(hostname) || hostname.includes(':')) return url;

  try {
    const addrs = await Deno.resolveDns(hostname, 'A').catch(() => [] as string[]);
    const addrs6 = await Deno.resolveDns(hostname, 'AAAA').catch(() => [] as string[]);

    for (const ip of addrs) {
      const parts = parseIPv4(ip);
      if (parts && isBlockedIPv4(parts)) {
        throw new SSRFError(`DNS resolved to blocked IPv4: ${hostname} -> ${ip}`, rawUrl);
      }
    }
    for (const ip of addrs6) {
      if (isBlockedIPv6(ip)) {
        throw new SSRFError(`DNS resolved to blocked IPv6: ${hostname} -> ${ip}`, rawUrl);
      }
    }
  } catch (err) {
    if (err instanceof SSRFError) throw err;
    // DNS failure: log and let the actual fetch handle it. Don't fail closed
    // here because the resolver itself may be unavailable in some sandboxes.
    console.warn('[safe-fetch] dns resolution failed for', hostname, err);
  }

  return url;
}

/**
 * Convenience wrapper: validates the URL, resolves DNS, then calls fetch().
 */
export async function safeFetch(rawUrl: string, init?: RequestInit): Promise<Response> {
  const url = await assertSafeUrlResolved(rawUrl);
  return fetch(url, init);
}
