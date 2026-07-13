/**
 * Mirrors nocmon's MikroTik RouterOS client: node fetch with a per-request
 * undici (npm package, v7) Agent dispatcher + AbortSignal.timeout.
 */
import { Agent, type Dispatcher } from 'undici';

let cached: Dispatcher | undefined;

function insecureDispatcher(): Dispatcher {
  cached ??= new Agent({ connections: 4 });
  return cached;
}

export async function rosFetch(tag: string): Promise<string> {
  const base = process.env.STUB_URL || 'http://127.0.0.1:9099';
  const init: RequestInit & { dispatcher?: Dispatcher } = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
    dispatcher: insecureDispatcher(),
  };
  const res = await fetch(`${base}/q?v=${tag}`, init);
  return res.text();
}
