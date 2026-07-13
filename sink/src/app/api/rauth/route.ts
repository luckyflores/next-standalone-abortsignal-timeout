import { auth } from '@/lib/auth';
import { getWithTimeoutSignal } from '@/lib/upstream';

export const dynamic = 'force-dynamic';

// Mirrors nocmon's authed API routes: session check via auth(), then an
// upstream fetch with AbortSignal.timeout.
export async function GET() {
  const session = await auth();
  try {
    const body = await getWithTimeoutSignal('a1');
    return Response.json({ ok: true, hasSession: Boolean(session), body: body.slice(0, 60) });
  } catch (err) {
    return Response.json(
      { ok: false, hasSession: Boolean(session), error: String(err) },
      { status: 502 },
    );
  }
}
