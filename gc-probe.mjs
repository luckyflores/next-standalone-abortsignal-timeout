// Plain node, NO Next.js. Tests whether AbortSignal.timeout fetches fail to
// dispatch under GC pressure — the undici#4068 / node#57736 weakref hypothesis.
// Run with:  node --expose-gc gc-probe.mjs
import http from 'node:http';

const arrivals = { timeout: 0, controller: 0 };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/t')) arrivals.timeout++;
  else if (req.url.startsWith('/c')) arrivals.controller++;
  setTimeout(() => res.end('ok'), 20);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const gc = globalThis.gc;
const bang = () => { if (gc) { gc(); gc(); gc(); } };

async function batchTimeout(n) {
  // Inline AbortSignal.timeout, nothing holds a strong ref (mirrors the app code).
  const ps = [];
  for (let i = 0; i < n; i++) {
    ps.push(
      fetch(`${base}/t${i}`, { signal: AbortSignal.timeout(3000) })
        .then((r) => r.text()).then(() => 'ok').catch((e) => e.name),
    );
  }
  bang(); // GC while the requests are queued but (maybe) not yet written
  await new Promise((r) => setTimeout(r, 0));
  bang();
  return Promise.all(ps);
}

async function batchController(n) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    ps.push(
      fetch(`${base}/c${i}`, { signal: c.signal })
        .then((r) => r.text()).then(() => 'ok').catch((e) => e.name).finally(() => clearTimeout(t)),
    );
  }
  bang();
  await new Promise((r) => setTimeout(r, 0));
  bang();
  return Promise.all(ps);
}

const N = 10;
const t = await batchTimeout(N);
const c = await batchController(N);
console.log(JSON.stringify({
  node: process.version,
  gcExposed: Boolean(gc),
  timeout: { results: t, arrived: arrivals.timeout, sent: t.filter((x) => x === 'ok').length },
  controller: { results: c, arrived: arrivals.controller, sent: c.filter((x) => x === 'ok').length },
}, null, 1));
server.close();
