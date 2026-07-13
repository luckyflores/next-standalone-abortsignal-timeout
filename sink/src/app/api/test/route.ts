import { getWithControllerSignal, getWithTimeoutSignal } from '@/lib/upstream';

export const dynamic = 'force-dynamic';

// Mirrors nocmon's two fetch styles against the same stub origin. In the
// production failure, every AbortSignal.timeout fetch aborts at its own timer
// without the request ever reaching the upstream, while the AbortController
// batch works from the same process.
export async function GET() {
  const t0 = Date.now();
  const timeoutSignal = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((i) => getWithTimeoutSignal(`T${i}`)),
  );
  const t1 = Date.now();
  const controller = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((i) => getWithControllerSignal(`C${i}`)),
  );
  const t2 = Date.now();
  return Response.json({
    timeoutSignal: {
      ms: t1 - t0,
      statuses: timeoutSignal.map((r) => r.status),
      firstError:
        timeoutSignal.find((r): r is PromiseRejectedResult => r.status === 'rejected')?.reason !==
        undefined
          ? String(
              timeoutSignal.find((r): r is PromiseRejectedResult => r.status === 'rejected')
                ?.reason,
            )
          : null,
    },
    controller: { ms: t2 - t1, statuses: controller.map((r) => r.status) },
  });
}
