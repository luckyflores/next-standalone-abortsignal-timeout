# Next.js standalone + Turbopack: `fetch(..., { signal: AbortSignal.timeout(ms) })` never dispatches the request

Minimal reproduction for a bug where, in a **`output: 'standalone'`** Next.js
build produced by **Turbopack**, running on **`node:20-alpine` (musl)**, any
`fetch()` that passes `signal: AbortSignal.timeout(ms)` **opens a TCP
connection but never writes the HTTP request**. The fetch always rejects at its
own timeout (`TimeoutError: The operation was aborted due to timeout`) even
against a healthy, local upstream.

The exact same call using a manual `AbortController` + `setTimeout` works fine
**in the same process**. Plain `node -e "fetch(...)"` in the same image is also
fine. So it is not undici, not the network, not `AbortSignal.timeout` itself —
it is something about how the Turbopack standalone server sets up the runtime.

## TL;DR

| runtime | app | `AbortSignal.timeout` fetch | `AbortController` fetch |
| --- | --- | --- | --- |
| ubuntu (glibc) | minimal & full | ✅ dispatched | ✅ dispatched |
| **node:20-alpine (musl)** | see CI | **❌ never dispatched** | ✅ dispatched |

See the [`repro` workflow runs](../../actions) for the live matrix.

## How the harness works

Two apps, identical probe:

* **`base/`** — the smallest possible app: one route doing 5 parallel
  `AbortSignal.timeout` fetches then 5 `AbortController` fetches.
* **`sink/`** — the same fetch helpers, but wired through the shape of a real
  app (Auth.js v5 edge middleware, an `instrumentation.ts` boot poller, 8 route
  handlers all importing one shared `fetch` module so Turbopack duplicates it
  into many server chunks, `serverExternalPackages`, a `pg`/`undici` import).

`stub.js` is a local HTTP server that **counts how many requests actually
arrive**, tagged by query param. That arrival count — not the fetch's own
resolution — is the ground truth for "was the request dispatched."

`run-variant.sh <dir> <npm|pnpm> <label> <expectKeys>` installs, runs
`next build` (Turbopack standalone), boots the emitted `server.js`, then runs
`probe.mjs`, which drives every route and reads the stub's counters.

* **exit 0** — PASS: every expected fetch arrived at the stub.
* **exit 42** — BUG REPRODUCED: the `AbortSignal.timeout` fetches never arrived,
  while the `AbortController` fetches from the same process did.

## Reproduce locally (needs Docker for the musl case)

```bash
# glibc host (passes):
bash run-variant.sh "$PWD/base" npm  base 'T,C'
bash run-variant.sh "$PWD/sink" pnpm sink 'T,C,P,r,a,R'

# musl (the failing runtime):
docker run --rm -v "$PWD:/w" -w /w node:20-alpine sh -c \
  'apk add --no-cache bash && bash run-variant.sh /w/sink pnpm sink-musl T,C,P,r,a,R'
```

## Environment

* next `16.2.10` (Turbopack build), `output: 'standalone'`
* node `20.20.2` (the `node:20-alpine` image)
* react `19.2.7`

Discovered in production on a `node:20-alpine` appliance image; every
Prometheus/licensing/HTTP call that used `AbortSignal.timeout` silently failed
from process start. Swapping to `AbortController` + `setTimeout` fixed it.
