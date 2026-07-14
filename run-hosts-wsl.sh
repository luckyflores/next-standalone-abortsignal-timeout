#!/usr/bin/env bash
# Local host-form test on WSL glibc. Adds the named-host entry if we have sudo,
# then builds+probes the sink fetching localhost/name (stub dual-stack).
set -uo pipefail
export PATH="$HOME/node20/bin:$PATH"
BASE=/mnt/c/Users/lucky/AppData/Local/Temp/claude/H--Claude-dev--claude-worktrees-proxmox-access-issue-804d83/11b8768e-28ea-419d-b7ca-af95b9948743/scratchpad/repro
mkdir -p "$HOME/repro"
rm -rf "$HOME/repro/sinkh"
cp -r "$BASE/sink" "$HOME/repro/sinkh"
for f in probe.mjs run-variant.sh; do tr -d '\r' < "$BASE/$f" > "$HOME/repro/$f"; done
find "$HOME/repro/sinkh" -type f -exec sed -i 's/\r$//' {} +
grep -q 'nocbox-upstream' /etc/hosts 2>/dev/null || echo "127.0.0.1 nocbox-upstream" | sudo tee -a /etc/hosts >/dev/null 2>&1 || echo "(no sudo: named-host form will error locally, that's fine)"
export STUB_LISTEN='::' STUB_HOST='127.0.0.1'
bash "$HOME/repro/run-variant.sh" "$HOME/repro/sinkh" pnpm hosts-glibc-local 'C,hx,hl,hn'
