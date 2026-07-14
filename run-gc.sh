#!/usr/bin/env bash
export PATH="$HOME/node20/bin:$PATH"
D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== $(node --version) gc-probe (single bang) ==="
node --expose-gc "$D/gc-probe.mjs"
echo "=== $(node --version) gc-probe2 (hammer) ==="
node --expose-gc "$D/gc-probe2.mjs"
