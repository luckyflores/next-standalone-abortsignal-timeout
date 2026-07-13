#!/usr/bin/env bash
# wsl-exec.sh <variant-src-dir-under-/mnt/c> <name> <pm> <expectKeys>
# Copies a variant into the WSL-native filesystem (9P is too slow for node_modules)
# and runs it there. Strips CRLF from scripts written on the Windows side.
set -euo pipefail
SRC="$1"; NAME="$2"; PM="${3:-npm}"; EXPECT="${4:-T,C}"
export RUNTIME_OVERLAY="${5:-0}"
mkdir -p "$HOME/repro"
rm -rf "$HOME/repro/$NAME"
cp -r "$SRC" "$HOME/repro/$NAME"
BASE="$(dirname "$SRC")"
for f in probe.mjs run-variant.sh; do
  tr -d '\r' < "$BASE/$f" > "$HOME/repro/$f"
done
find "$HOME/repro/$NAME" -type f \( -name '*.sh' -o -name '*.mjs' -o -name '*.js' -o -name '*.ts' -o -name '*.tsx' -o -name '*.json' \) -exec sed -i 's/\r$//' {} +
exec bash "$HOME/repro/run-variant.sh" "$HOME/repro/$NAME" "$PM" "$NAME" "$EXPECT"
