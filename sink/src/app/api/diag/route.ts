export const dynamic = 'force-dynamic';

// Introspects the realm's AbortSignal/fetch so a failing environment can be
// compared against a healthy one (is AbortSignal.timeout still the native one?).
export async function GET() {
  const s = AbortSignal.timeout(60000);
  let fetchPatched: unknown;
  try {
    fetchPatched = (globalThis.fetch as unknown as Record<string, unknown>).__nextPatched;
  } catch {
    fetchPatched = 'threw';
  }
  return Response.json({
    node: process.version,
    abortSignal: {
      classSource: String(AbortSignal).slice(0, 120),
      timeoutSource: String(AbortSignal.timeout).slice(0, 160),
      instanceCtor: s.constructor.name,
      isNativeInstance: s instanceof AbortSignal,
      protoIsGlobal: Object.getPrototypeOf(s) === AbortSignal.prototype,
    },
    fetchSource: String(globalThis.fetch).slice(0, 160),
    fetchPatched: fetchPatched === undefined ? null : String(fetchPatched),
  });
}
