#!/usr/bin/env bash
set -euo pipefail

if ! command -v spicetify >/dev/null 2>&1; then
  for candidate in \
    "$HOME/.spicetify" \
    "$HOME/.local/bin" \
    "/usr/local/bin" \
    "/opt/homebrew/bin" \
    "/home/linuxbrew/.linuxbrew/bin"; do
    if [[ -x "$candidate/spicetify" ]]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done
fi

if ! command -v spicetify >/dev/null 2>&1; then
  echo "Spicetify was not found in PATH."
  exit 1
fi

SPICETIFY_CFG="$(spicetify -c 2>/dev/null | head -n1 || true)"
if [[ -n "$SPICETIFY_CFG" ]]; then
  SPICETIFY_USER="$(dirname "$SPICETIFY_CFG")"
else
  SPICETIFY_USER="$(spicetify path userdata 2>/dev/null | head -n1 || true)"
  [[ -z "$SPICETIFY_USER" ]] && SPICETIFY_USER="${XDG_CONFIG_HOME:-$HOME/.config}/spicetify"
fi

TARGET_DIR="$SPICETIFY_USER/Themes/M3Expressive"
PREV_FILE="$TARGET_DIR/.m3e-prev-theme"

PREV_THEME=""
PREV_SCHEME=""
if [[ -f "$PREV_FILE" ]]; then
  PREV_THEME="$(sed -n '1p' "$PREV_FILE" | tr -d '\r\n')"
  PREV_SCHEME="$(sed -n '2p' "$PREV_FILE" | tr -d '\r\n')"
  rm -f "$PREV_FILE"
fi

spicetify config current_theme "$PREV_THEME" color_scheme "$PREV_SCHEME"
spicetify apply

echo "M3 Expressive disabled and previous theme restored."
echo "Theme files remain in: $TARGET_DIR"