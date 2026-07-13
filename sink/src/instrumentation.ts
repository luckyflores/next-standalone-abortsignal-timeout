/**
 * Next.js instrumentation hook — mirrors nocmon: Node-only side effects live
 * in instrumentation-node.ts behind a dynamic import.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
