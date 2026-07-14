#!/usr/bin/env bash
# run-variant.sh <variant-dir> <pm: npm|pnpm> <label> <expectKeys>
# Installs, builds (Next standalone), runs stub + standalone server, probes, prints verdict.
set -uo pipefail
VDIR="$1"; PM="${2:-npm}"; LABEL="${3:-variant}"; EXPECT="${4:-T,C}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -d "$HOME/node20/bin" ] && export PATH="$HOME/node20/bin:$PATH"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export NEXT_TELEMETRY_DISABLED=1
cd "$VDIR"

echo "=== [$LABEL] node=$(node --version) pm=$PM expect=$EXPECT ==="

if [ "$PM" = pnpm ]; then
  corepack pnpm install --reporter=silent >install.log 2>&1 || { echo "INSTALL FAILED"; tail -40 install.log; exit 2; }
else
  npm install --no-audit --no-fund --loglevel=error >install.log 2>&1 || { echo "INSTALL FAILED"; tail -40 install.log; exit 2; }
fi

rm -rf .next
npx next build >build.log 2>&1 || { echo "BUILD FAILED"; tail -40 build.log; exit 2; }
grep -im1 turbopack build.log || echo "(no turbopack banner in build.log)"

SJS=.next/standalone/server.js
if [ ! -f "$SJS" ]; then SJS=$(find .next/standalone -maxdepth 3 -name server.js | head -1); fi
echo "server.js: $SJS"

# Optional layer: overlay the FULL build node_modules onto the standalone
# bundle's traced node_modules — mirrors nocmon's Dockerfile, which COPYs
# /app/node_modules over the standalone dir in the runtime image.
if [ "${RUNTIME_OVERLAY:-0}" = "1" ]; then
  echo "(overlaying full node_modules onto standalone bundle)"
  cp -a node_modules/. "$(dirname "$SJS")/node_modules/" 2>/dev/null
fi

APP_PORT="${APP_PORT:-3199}"
STUB_PORT="${STUB_PORT:-9099}"
STUB_HOST="${STUB_HOST:-127.0.0.1}"       # host the app fetches (IP/localhost/name)
STUB_LISTEN="${STUB_LISTEN:-127.0.0.1}"   # address the stub binds ('::' = dual-stack)
STUB_NAME="${STUB_NAME:-nocbox-upstream}" # DNS name form used by /api/hosts

STUB_PORT=$STUB_PORT STUB_LISTEN=$STUB_LISTEN node stub.js >stub.log 2>&1 &
SPID=$!
sleep 0.5

PORT=$APP_PORT HOSTNAME=127.0.0.1 NODE_ENV=production \
  AUTH_SECRET=devsecret-devsecret-devsecret \
  STUB_URL="http://$STUB_HOST:$STUB_PORT" \
  STUB_PORT="$STUB_PORT" STUB_NAME="$STUB_NAME" \
  node "$SJS" >server.log 2>&1 &
NPID=$!

node "$SCRIPT_DIR/probe.mjs" "http://127.0.0.1:$APP_PORT" "http://127.0.0.1:$STUB_PORT" "$EXPECT"
RC=$?

kill "$NPID" "$SPID" 2>/dev/null
wait 2>/dev/null

echo "--- server.log (tail) ---"; tail -25 server.log
echo "--- stub.log (tail) ---"; tail -8 stub.log
echo "=== [$LABEL] exit=$RC (0=pass 42=bug) ==="
exit $RC
