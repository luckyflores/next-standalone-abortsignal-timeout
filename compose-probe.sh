#!/usr/bin/env bash
# Drives the docker-compose repro and decides the verdict from the stub's
# arrival counts. The test route + poller fetch the Docker service NAME `stub`
# with AbortSignal.timeout; the /api/test route also runs an AbortController
# batch as the control.
set -uo pipefail
NOCMON=http://localhost:3000
STUB=http://localhost:9099

echo "=== waiting for nocmon ==="
up=0
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$NOCMON/api/diag" || true)
  if [ "$code" = 200 ]; then up=1; echo "ready after ${i}x2s"; break; fi
  sleep 2
done
[ "$up" = 1 ] || { echo "nocmon never came up"; exit 3; }

echo "diag: $(curl -s "$NOCMON/api/diag")"
for i in 1 2 3; do
  echo "test#$i: $(curl -s --max-time 60 "$NOCMON/api/test")"
done
echo "hosts: $(curl -s --max-time 60 "$NOCMON/api/hosts")"
sleep 3

COUNTS=$(curl -s "$STUB/counts")
echo "COUNTS: $COUNTS"

node -e '
const c = JSON.parse(process.argv[1] || "{}");
const g = (k) => c[k] || 0;
const T=g("T"), C=g("C"), P=g("P"), hn=g("hn"), hh=g("hh"), hc=g("hc");
console.log("summary:", JSON.stringify({T,C,P,hn,hh,hc}));
if (C > 0 && T === 0) {
  console.log("VERDICT: BUG-REPRODUCED — AbortSignal.timeout fetches to the service name never arrived; AbortController fetches did.");
  if (hh > 0) console.log("  held-signal control ARRIVED (hh>0) => the inline signal is being GC'\''d mid-flight.");
  process.exit(42);
}
if (T > 0) { console.log("VERDICT: PASS — timeout fetches arrived (T="+T+")."); process.exit(0); }
console.log("VERDICT: INCONCLUSIVE — controller also absent; env/network issue, not the signal bug.");
process.exit(3);
' "$COUNTS"
