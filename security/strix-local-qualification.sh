#!/usr/bin/env bash
set -euo pipefail

# Phoenix Awaken OS security qualification profile.
# This script intentionally refuses URLs and paths outside the project.
# Run only against a local Phoenix build that you own.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-$ROOT}"

case "$TARGET" in
  "$ROOT"|"$ROOT"/*) ;;
  *) echo "Refusing target outside Phoenix Awaken OS: $TARGET" >&2; exit 2 ;;
esac

if [[ "$TARGET" =~ ^https?:// ]]; then
  echo "Refusing network target. Use an explicitly approved local lab only." >&2
  exit 2
fi

command -v strix >/dev/null 2>&1 || { echo "Strix is not installed. Install it only in an isolated security-validation environment." >&2; exit 3; }
: "${STRIX_LLM:?Set STRIX_LLM to an approved provider/model for the isolated test}"
: "${LLM_API_KEY:?Set LLM_API_KEY only in the isolated test environment}"

RUN_NAME="phoenix-awaken-$(date -u +%Y%m%dT%H%M%SZ)"
exec strix -n --target "$TARGET" --scan-mode quick --instruction-file "$ROOT/security/strix-rules-of-engagement.md" --output-dir "$ROOT/security/runs/$RUN_NAME"
