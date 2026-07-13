import { rosFetch } from '@/lib/rosclient';

export const dynamic = 'force-dynamic';

// Mirrors nocmon's MikroTik route handlers: fetch through an undici (npm v7)
// Agent dispatcher + AbortSignal.timeout.
export async function GET() {
  try {
    const body = await rosFetch('R1');
    return Response.json({ ok: true, body: body.slice(0, 60) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
