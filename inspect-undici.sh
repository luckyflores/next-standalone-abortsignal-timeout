#!/usr/bin/env bash
# Which undici does Next 16.2.10 bundle, and does the standalone server use it?
NM="$HOME/repro/sinks/node_modules"
echo "=== next compiled undici version ==="
grep -rom1 '"version":"[0-9.]*"' "$NM/next/dist/compiled/undici/package.json" 2>/dev/null || \
  find "$NM/next/dist/compiled/undici" -maxdepth 1 -type f 2>/dev/null | head
echo "=== node built-in undici (for reference) ==="
"$HOME/node20/bin/node" -e "console.log(process.versions.undici || 'n/a')"
echo "=== does Next patch global fetch to its compiled undici? (grep server chunk) ==="
grep -rl "compiled/undici\|dist/compiled/undici" "$HOME/repro/sinks/.next/standalone" 2>/dev/null | head -3
echo "=== undici packages present in the standalone bundle ==="
find "$HOME/repro/sinks/.next/standalone" -path "*undici*" -name "*.js" 2>/dev/null | head
