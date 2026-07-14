// Stub upstream: counts arrivals by the ?v= tag (digits stripped), replies after 50ms.
// GET /counts returns the tally — the ground truth for "was the request dispatched".
const http = require('http');
const counts = {};
http
  .createServer((req, res) => {
    req.resume(); // drain any POST body
    const url = new URL(req.url, 'http://stub');
    if (url.pathname === '/counts') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(counts));
      return;
    }
    const v = url.searchParams.get('v') || 'unknown';
    const key = v.replace(/[0-9]+$/, '');
    counts[key] = (counts[key] || 0) + 1;
    console.log(`[stub] ${req.method} ${req.url}`);
    setTimeout(() => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, v }));
    }, 50);
  })
  // STUB_LISTEN='::' binds dual-stack so 127.0.0.1, ::1, localhost, and a
  // hosts-file name all reach it; default 127.0.0.1 for the IP-only cells.
  .listen(
    process.env.STUB_PORT || 9099,
    process.env.STUB_LISTEN || '127.0.0.1',
    () => console.log(`[stub] ready on ${process.env.STUB_LISTEN || '127.0.0.1'}`),
  );
