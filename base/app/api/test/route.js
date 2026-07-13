export const dynamic = 'force-dynamic';

// Mirrors nocmon's two fetch styles against the same stub origin:
//  - prometheusFetch style: GET + accept header + AbortSignal.timeout(5000)
//  - alertmanagerFetch style: GET + accept header + AbortController signal
export async function GET() {
  const base = 'http://127.0.0.1:9099/q';

  const t0 = Date.now();
  const timeoutSignal = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((i) =>
      fetch(`${base}?v=T${i}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }).then((r) => r.text()),
    ),
  );
  const t1 = Date.now();

  const controller = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((i) => {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 5000);
      return fetch(`${base}?v=C${i}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: c.signal,
      })
        .then((r) => r.text())
        .finally(() => clearTimeout(t));
    }),
  );
  const t2 = Date.now();

  return Response.json({
    timeoutSignal: { ms: t1 - t0, statuses: timeoutSignal.map((r) => r.status) },
    controller: { ms: t2 - t1, statuses: controller.map((r) => r.status) },
  });
}
