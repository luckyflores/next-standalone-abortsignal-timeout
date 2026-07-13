import { poolCtorName } from '@/lib/db';
import { getWithTimeoutSignal } from '@/lib/upstream';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const body = await getWithTimeoutSignal('r8');
    return Response.json({ ok: true, pool: poolCtorName(), body: body.slice(0, 60) });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
