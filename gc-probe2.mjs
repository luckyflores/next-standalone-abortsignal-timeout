// More aggressive: keep GCing on a short interval for the whole fetch lifetime,
// and never let the loop hold the promises' signals. node --expose-gc gc-probe2.mjs
import http from 'node:http';

const arrivals = { t: 0, c: 0 };
const server = http.createServer((req, res) => {
  arrivals[req.url[1]]++;
  setTimeout(() => res.end('ok'), 30);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const gc = globalThis.gc;

let hammer = true;
(function loop() { if (gc) gc(); if (hammer) setImmediate(loop); })();

async function run(kind, n) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    if (kind === 't') {
      ps.push(fetch(`${base}/t${i}`, { signal: AbortSignal.timeout(2000) })
        .then((r) => r.text()).then(() => 'ok').catch((e) => e.name));
    } else {
      const c = new AbortController();
      const to = setTimeout(() => c.abort(), 2000);
      ps.push(fetch(`${base}/c${i}`, { signal: c.signal })
        .then((r) => r.text()).then(() => 'ok').catch((e) => e.name).finally(() => clearTimeout(to)));
    }
  }
  return Promise.all(ps);
}

const t = await run('t', 10);
const c = await run('c', 10);
hammer = false;
console.log(JSON.stringify({
  node: process.version, gcExposed: Boolean(gc),
  timeout: { arrived: arrivals.t, sent: t.filter((x) => x === 'ok').length, sample: t.slice(0, 4) },
  controller: { arrived: arrivals.c, sent: c.filter((x) => x === 'ok').length },
}));
server.close();
