/**
 * Boot-time poller — mirrors nocmon's license check-in loop: setInterval from
 * instrumentation, each tick a POST with AbortSignal.timeout.
 */
import { postWithTimeoutSignal } from '@/lib/upstream';

let started = false;

export function startPoller(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    void pollTick();
  }, 2000);
  console.log('[poller] started');
}

export async function pollTick(): Promise<void> {
  try {
    await postWithTimeoutSignal('P1', 1500);
  } catch (err) {
    console.log('[poller] tick failed:', String(err));
  }
}
