#!/usr/bin/env bash
# Local stress test on WSL glibc. Crosses host-forms with GC / threadpool
# pressure. Pass stress vars as args: run-stress-wsl.sh <label> <STRESS_GC> <STRESS_THREADPOOL> <UV_THREADPOOL_SIZE>
set -uo pipefail
export PATH="$HOME/node20/bin:$PATH"
LABEL="${1:-stress}"; SGC="${2:-0}"; STP="${3:-0}"; UVS="${4:-}"
BASE=/mnt/c/Users/lucky/AppData/Local/Temp/claude/H--Claude-dev--claude-worktrees-proxmox-access-issue-804d83/11b8768e-28ea-419d-b7ca-af95b9948743/scratchpad/repro
mkdir -p "$HOME/repro"
rm -rf "$HOME/repro/sinks"
cp -r "$BASE/sink" "$HOME/repro/sinks"
for f in probe.mjs run-variant.sh; do tr -d '\r' < "$BASE/$f" > "$HOME/repro/$f"; done
find "$HOME/repro/sinks" -type f -exec sed -i 's/\r$//' {} +
grep -q 'nocbox-upstream' /etc/hosts 2>/dev/null || echo "127.0.0.1 nocbox-upstream" | sudo tee -a /etc/hosts >/dev/null 2>&1 || true
export STUB_LISTEN='::' STUB_HOST='127.0.0.1'
export STRESS_GC="$SGC" STRESS_THREADPOOL="$STP"
[ -n "$UVS" ] && export UV_THREADPOOL_SIZE="$UVS"
echo ">>> $LABEL  STRESS_GC=$SGC STRESS_THREADPOOL=$STP UV_THREADPOOL_SIZE=${UVS:-default}"
bash "$HOME/repro/run-variant.sh" "$HOME/repro/sinks" pnpm "$LABEL" 'C,hx,hl,hn'
