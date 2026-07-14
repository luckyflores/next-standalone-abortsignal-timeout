#!/usr/bin/env bash
NODE="$HOME/node20/bin/node"
D=/mnt/c/Users/lucky/AppData/Local/Temp/claude/H--Claude-dev--claude-worktrees-proxmox-access-issue-804d83/11b8768e-28ea-419d-b7ca-af95b9948743/scratchpad/repro
echo "=== $($NODE --version) gc-probe (single bang) ==="
"$NODE" --expose-gc "$D/gc-probe.mjs"
echo "=== gc-probe2 (hammer) ==="
"$NODE" --expose-gc "$D/gc-probe2.mjs"
