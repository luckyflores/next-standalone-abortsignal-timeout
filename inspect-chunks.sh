#!/usr/bin/env bash
S="$HOME/repro/sink/.next"
echo "=== copies of AbortSignal.timeout across compiled server chunks ==="
grep -rl "AbortSignal.timeout" "$S/server" 2>/dev/null | wc -l
echo "=== files containing the upstream getWithTimeoutSignal marker ==="
grep -rl "accept.*application/json" "$S/server/chunks" 2>/dev/null | sed "s#$S/#  #" | head -30
echo "=== standalone bundle: which undici does the server resolve? ==="
find "$HOME/repro/sink/.next/standalone" -name "*.js" -path "*undici*" 2>/dev/null | head -5
echo "=== next compiled undici present? ==="
find "$HOME/repro/sink/.next/standalone" -path "*compiled/undici*" -name "index.js" 2>/dev/null | head -3
