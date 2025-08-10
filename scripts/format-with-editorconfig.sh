#!/usr/bin/env bash
set -euo pipefail

# Find candidate files (tracked by git if repo, else fallback to find)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  mapfile -t files < <(git ls-files)
else
  mapfile -t files < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.css" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.svg" -o -name "*.txt" -o -name "*.html" \))
fi

for f in "${files[@]}"; do
  [ -f "$f" ] || continue
  # Convert CRLF to LF
  sed -i 's/\r$//' "$f" 2>/dev/null || true
  # Trim trailing whitespace except for markdown files
  case "$f" in
    *.md) ;;
    *) sed -i 's/[ \t]\+$//' "$f" 2>/dev/null || true ;;
  esac
  # Ensure file ends with a newline (0x0A)
  if [ -s "$f" ]; then
    last=$(tail -c1 "$f" 2>/dev/null | od -An -t u1 | tr -d " \n")
    if [ "${last:-10}" != "10" ]; then printf '\n' >> "$f"; fi
  fi
done

echo "Formatting applied according to .editorconfig"
