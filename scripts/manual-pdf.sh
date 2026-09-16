#!/usr/bin/env bash
# Regenera o PDF do manual a partir da fonte única de edição.
#
# Fonte de edição:
#   - docs/MANUAL_DO_USUARIO.md   → texto de referência do manual
#   - docs/MANUAL_DO_USUARIO.html → versão diagramada, origem do PDF
#
# O PDF NUNCA é editado à mão. Este script imprime o HTML com o Chrome headless
# e replica o arquivo nas três cópias distribuídas, que precisam ficar idênticas:
#   MANUAL_DO_USUARIO.pdf (raiz) · docs/MANUAL_DO_USUARIO.pdf · public/MANUAL_DO_USUARIO.pdf
# `/api/manual` entrega a cópia de `public/`.
#
# Uso: scripts/manual-pdf.sh [caminho-do-chrome]
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
chrome="${1:-${CHROME_BIN:-}}"
if [ -z "$chrome" ]; then
  for candidate in /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser; do
    [ -x "$candidate" ] && chrome="$candidate" && break
  done
fi
[ -n "$chrome" ] || { echo "Chrome/Chromium não encontrado. Informe o caminho." >&2; exit 1; }

source_html="$root/docs/MANUAL_DO_USUARIO.html"
target="$root/docs/MANUAL_DO_USUARIO.pdf"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

"$chrome" --headless --disable-gpu --no-sandbox \
  --user-data-dir="$profile" \
  --no-pdf-header-footer \
  --print-to-pdf="$target" \
  "file://$source_html" >/dev/null 2>&1

cp "$target" "$root/MANUAL_DO_USUARIO.pdf"
cp "$target" "$root/public/MANUAL_DO_USUARIO.pdf"

echo "PDF regenerado a partir de docs/MANUAL_DO_USUARIO.html:"
sha256sum "$target" "$root/MANUAL_DO_USUARIO.pdf" "$root/public/MANUAL_DO_USUARIO.pdf"
