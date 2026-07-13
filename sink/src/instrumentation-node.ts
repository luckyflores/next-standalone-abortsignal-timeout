/**
 * Node-only instrumentation side effects — mirrors nocmon's boot-time pollers
 * (license check-in / isp-map style: setInterval + fetch with AbortSignal.timeout).
 */
import { startPoller } from '@/lib/poller';

startPoller();
