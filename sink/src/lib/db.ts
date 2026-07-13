/**
 * pg is in serverExternalPackages (mirrors nocmon's Prisma driver-adapter
 * stack) — imported but never connected, so the standalone output carries an
 * external require() at runtime.
 */
import { Pool } from 'pg';

export function poolCtorName(): string {
  return Pool.name;
}
