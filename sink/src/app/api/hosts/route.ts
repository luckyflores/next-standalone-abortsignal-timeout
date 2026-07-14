import { timeoutGetTo, timeoutGetToHeld } from '@/lib/upstream';

export const dynamic = 'force-dynamic';

// Probes the SAME AbortSignal.timeout fetch against three upstream host forms:
//   hx = raw IPv4 (127.0.0.1)      — skips dns.lookup entirely
//   hl = localhost                  — dns.lookup, /etc/hosts, dual-stack
//   hn = a DNS-resolved name        — dns.lookup, single A record (like a
//                                     Docker service name — the production case)
// plus a controller control (hc) against the name. If hx arrives but hl/hn do
// not, the failure is in undici's name-resolution + AbortSignal.timeout path.
export async function GET() {
  const port = process.env.STUB_PORT || '9099';
  const name = process.env.STUB_NAME || 'nocbox-upstream';
  const forms: Array<[string, string, string]> = [
    ['hx', `http://127.0.0.1:${port}`, 'ip4'],
    ['hl', `http://localhost:${port}`, 'localhost'],
    ['hn', `http://${name}:${port}`, 'dns-name'],
  ];
  const out: Record<string, unknown> = {};
  for (const [tag, base, label] of forms) {
    const r = await Promise.allSettled([1, 2, 3, 4, 5].map((i) => timeoutGetTo(base, `${tag}${i}`)));
    const rejected = r.find((x): x is PromiseRejectedResult => x.status === 'rejected');
    out[label] = {
      base,
      fulfilled: r.filter((x) => x.status === 'fulfilled').length,
      firstError: rejected ? String(rejected.reason) : null,
    };
  }

  // Held-signal control against the DNS name (tag 'hh'): identical fetch but a
  // strong ref to the AbortSignal.timeout is retained. If hh arrives while hn
  // does not, the inline signal is being GC'd mid-flight.
  {
    const nameBase = `http://${name}:${port}`;
    const r = await Promise.allSettled([1, 2, 3, 4, 5].map((i) => timeoutGetToHeld(nameBase, `hh${i}`)));
    const rejected = r.find((x): x is PromiseRejectedResult => x.status === 'rejected');
    out.heldToName = {
      base: nameBase,
      fulfilled: r.filter((x) => x.status === 'fulfilled').length,
      firstError: rejected ? String(rejected.reason) : null,
    };
  }
  // Controller control against the DNS name — proves the name itself resolves
  // and connects fine; only the AbortSignal.timeout variant is affected.
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 5000);
  try {
    const res = await fetch(`http://${name}:${port}/q?v=hc1`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: c.signal,
    });
    await res.text();
    out.controllerToName = 'ok';
  } catch (err) {
    out.controllerToName = String(err);
  } finally {
    clearTimeout(t);
  }
  return Response.json(out);
}
