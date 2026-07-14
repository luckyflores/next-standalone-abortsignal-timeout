// probe.mjs <appBase> <stubBase> <expectKeys>
// Drives the repro app and classifies the outcome from the stub's arrival counts.
// Runs in a plain node process (vanilla node is proven unaffected by the bug).
//
// expectKeys: comma list of stub count keys that MUST be > 0 for a pass.
//   T = /api/test AbortSignal.timeout batch    C = /api/test AbortController batch
//   P = instrumentation poller ticks           r = r1..r8 route fetches
//   a = rauth route fetch                      R = ros route fetch (undici Agent dispatcher)
const [, , appBase, stubBase, expectArg] = process.argv;
const expect = (expectArg || 'T,C').split(',').map((s) => s.trim()).filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hit(path, ms = 30_000) {
  try {
    const res = await fetch(appBase + path, { signal: AbortSignal.timeout(ms), redirect: 'manual' });
    const body = (await res.text()).slice(0, 600);
    return { status: res.status, body };
  } catch (err) {
    return { error: String(err) };
  }
}

// 1. Wait for the server to come up (diag is the cheapest route).
let up = false;
for (let i = 0; i < 80; i++) {
  const r = await hit('/api/diag', 2_000);
  if (r.status === 200) { up = true; break; }
  await sleep(500);
}
if (!up) {
  console.log(JSON.stringify({ verdict: 'SERVER-NOT-READY' }));
  process.exit(3);
}

const report = { routes: {} };
report.routes.diag = await hit('/api/diag');

// 2. Warm every duplicated route chunk, then the special routes.
for (const p of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'rauth', 'ros', 'hosts']) {
  const r = await hit('/api/' + p, 20_000);
  if (!(r.status === 404 || r.status === 307)) report.routes[p] = r;
}

// 3. The instrumented batch route, twice (post-warm behavior can differ).
report.routes.test1 = await hit('/api/test', 30_000);
await sleep(6_000); // let the instrumentation poller tick a few more times
report.routes.test2 = await hit('/api/test', 30_000);

// 4. Stub arrival counts are ground truth: they say which fetches were actually dispatched.
let counts = {};
try {
  counts = await (await fetch(stubBase + '/counts', { signal: AbortSignal.timeout(3_000) })).json();
} catch (err) {
  console.log(JSON.stringify({ verdict: 'STUB-UNREACHABLE', error: String(err) }));
  process.exit(3);
}
report.counts = counts;

// 5. Verdict. The production signature: every AbortSignal.timeout fetch has ZERO
//    arrivals while AbortController fetches arrive fine from the same process.
const missing = expect.filter((k) => !(counts[k] > 0));
const controllerOk = (counts.C || 0) > 0;
let verdict = 'PASS';
if (missing.length > 0) verdict = controllerOk ? 'BUG-REPRODUCED' : 'BROKEN-ENV';
report.expected = expect;
report.missing = missing;
report.verdict = verdict;
console.log(JSON.stringify(report, null, 1));
process.exit(verdict === 'PASS' ? 0 : verdict === 'BUG-REPRODUCED' ? 42 : 3);
