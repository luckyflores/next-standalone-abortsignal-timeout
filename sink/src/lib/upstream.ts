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
