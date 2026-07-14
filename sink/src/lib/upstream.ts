/**
 * Shared upstream fetch helpers. Imported by many route handlers on purpose:
 * Turbopack duplicates this module's code into each route's server chunk,
 * mirroring nocmon's prometheus-client.ts (9 duplicated compiled copies).
 */
const stubBase = () => process.env.STUB_URL || 'http://127.0.0.1:9099';

/** nocmon prometheus-client.ts shape: GET + accept header + AbortSignal.timeout. */
export async function getWithTimeoutSignal(tag: string, timeoutMs = 5000): Promise<string> {
  const res = await fetch(`${stubBase()}/q?v=${tag}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res.text();
}

/** Same shape, but the caller supplies the base — lets one route probe several
 *  upstream host forms (raw IP vs localhost vs a DNS-resolved name). Production
 *  fetches a Docker service NAME, not an IP, so this exercises undici's
 *  dns.lookup + connect path that a literal 127.0.0.1 skips. */
export async function timeoutGetTo(base: string, tag: string, timeoutMs = 5000): Promise<string> {
  const res = await fetch(`${base}/q?v=${tag}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res.text();
}

/** nocmon license-checkin.ts shape: POST + JSON body + AbortSignal.timeout. */
export async function postWithTimeoutSignal(tag: string, timeoutMs = 5000): Promise<string> {
  const res = await fetch(`${stubBase()}/q?v=${tag}`, {
    method: 'POST',
    headers: { authorization: 'Bearer x', 'content-type': 'application/json' },
    body: JSON.stringify({ tag, t: Date.now() }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res.text();
}

/** Confirmation control: identical to timeoutGetTo, but keeps a STRONG reference
 *  to the AbortSignal.timeout for the fetch's lifetime. If this survives where
 *  the inline version fails under GC pressure, the cause is the signal being
 *  garbage-collected mid-flight (undici#4068 weakref family). */
const heldSignals = new Set<AbortSignal>();
export async function timeoutGetToHeld(base: string, tag: string, timeoutMs = 5000): Promise<string> {
  const signal = AbortSignal.timeout(timeoutMs);
  heldSignals.add(signal);
  try {
    const res = await fetch(`${base}/q?v=${tag}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal,
    });
    return await res.text();
  } finally {
    heldSignals.delete(signal);
  }
}

/** nocmon health.ts shape (the control that always worked in production). */
export async function getWithControllerSignal(tag: string, timeoutMs = 5000): Promise<string> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const res = await fetch(`${stubBase()}/q?v=${tag}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: c.signal,
    });
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}
