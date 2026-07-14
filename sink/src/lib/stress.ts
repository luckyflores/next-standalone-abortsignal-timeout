/**
 * Optional, env-gated stressors that mimic what a real appliance does to the
 * process while fetches are in flight — none of this runs unless the matching
 * env var is set, so the default build behaves exactly as before.
 *
 *   STRESS_THREADPOOL=1  saturate the libuv threadpool (getaddrinfo / dns.lookup
 *                        for a NAMED host runs there) with a scrypt loop, the
 *                        way argon2 password hashing + Prisma do on nocmon.
 *   STRESS_GC=1          allocate + drop large buffers on a fast interval to
 *                        drive frequent GC (the undici#4068 weakref angle), the
 *                        way a heavy heap on a small VM does.
 */
import crypto from 'node:crypto';

let started = false;

export function startStressors(): void {
  if (started) return;
  started = true;

  if (process.env.STRESS_THREADPOOL === '1') {
    // Keep N scrypt jobs (each occupies one libuv threadpool slot) perpetually
    // in flight. With UV_THREADPOOL_SIZE small, dns.lookup has to queue behind
    // them — exactly the contention a busy Node appliance creates.
    const inflight = Number(process.env.STRESS_THREADPOOL_JOBS || '8');
    const spin = () => {
      crypto.scrypt('pw', 'salt', 64, { N: 16384, r: 8, p: 1 }, () => setImmediate(spin));
    };
    for (let i = 0; i < inflight; i++) spin();
    console.log(`[stress] threadpool: ${inflight} scrypt jobs, UV_THREADPOOL_SIZE=${process.env.UV_THREADPOOL_SIZE || 'default'}`);
  }

  if (process.env.STRESS_GC === '1') {
    // Churn V8 HEAP objects (not external Buffers) so scavenge/mark-sweep runs
    // where the inline AbortSignal.timeout object lives. Retain a bounded
    // rolling set so objects survive one cycle then die — maximises collections.
    let ring: unknown[] = [];
    setInterval(() => {
      for (let i = 0; i < 2000; i++) {
        ring.push({ a: i, b: 'x'.repeat(64), c: [i, i + 1, i + 2], d: { n: i } });
      }
      if (ring.length > 200_000) ring = ring.slice(-50_000);
    }, 2);
    console.log('[stress] gc: churning heap objects to drive frequent collections');
  }
}
