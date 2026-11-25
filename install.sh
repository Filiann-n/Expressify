#!/usr/bin/env bash
set -euo pipefail

REPO="Filiann-n/Expressify"
BASE_URL="https://raw.githubusercontent.com/$REPO/main"
NO_WALLPAPER_SYNC=0
NO_APPLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-wallpaper-sync) NO_WALLPAPER_SYNC=1; shift ;;
    --no-apply) NO_APPLY=1; shift ;;
    *) shift ;;
  esac
done

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
  echo "Spicetify is required to use this theme."
  echo "Install Spicetify first from https://spicetify.app and run this command again."
  exit 1
fi

download_file() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
  else
    echo "curl or wget is required." >&2
    exit 1
  fi
}

SPICETIFY_CFG="$(spicetify -c 2>/dev/null | head -n1 || true)"
if [[ -n "$SPICETIFY_CFG" ]]; then
  SPICETIFY_USER="$(dirname "$SPICETIFY_CFG")"
else
  SPICETIFY_USER="$(spicetify path userdata 2>/dev/null | head -n1 || true)"
  [[ -z "$SPICETIFY_USER" ]] && SPICETIFY_USER="${XDG_CONFIG_HOME:-$HOME/.config}/spicetify"
fi

TARGET_DIR="$SPICETIFY_USER/Themes/M3Expressive"
mkdir -p "$TARGET_DIR/scripts"
TARGET_REAL="$(cd "$TARGET_DIR" && pwd)"

SRC_PATH="${BASH_SOURCE[0]:-}"
SRC_DIR=""
if [[ -n "$SRC_PATH" && -f "$SRC_PATH" ]]; then
  SRC_DIR="$(cd "$(dirname "$SRC_PATH")" && pwd)"
fi

if [[ -n "$SRC_DIR" && -f "$SRC_DIR/user.css" ]]; then
  if [[ "$SRC_DIR" != "$TARGET_REAL" ]]; then
    cp -f "$SRC_DIR/color.ini" "$SRC_DIR/user.css" "$SRC_DIR/theme.js" "$TARGET_DIR/"
    [[ -f "$SRC_DIR/uninstall.sh" ]] && cp -f "$SRC_DIR/uninstall.sh" "$TARGET_DIR/"
    [[ -f "$SRC_DIR/scripts/sync-wallpaper.sh" ]] && cp -f "$SRC_DIR/scripts/sync-wallpaper.sh" "$TARGET_DIR/scripts/"
  fi
else
  echo "Downloading M3 Expressive..."
  for rel in color.ini user.css theme.js uninstall.sh scripts/sync-wallpaper.sh; do
    download_file "$BASE_URL/$rel" "$TARGET_DIR/$rel"
  done
fi

chmod +x "$TARGET_DIR/uninstall.sh" "$TARGET_DIR/scripts/sync-wallpaper.sh" 2>/dev/null || true

PREV_FILE="$TARGET_DIR/.m3e-prev-theme"
CUR_THEME="$(spicetify config current_theme 2>/dev/null | tr -d '\r\n' || true)"
CUR_SCHEME="$(spicetify config color_scheme 2>/dev/null | tr -d '\r\n' || true)"
if [[ -n "$CUR_THEME" && "$CUR_THEME" != "M3Expressive" && ! -f "$PREV_FILE" ]]; then
  printf '%s\n%s\n' "$CUR_THEME" "$CUR_SCHEME" > "$PREV_FILE"
fi

spicetify config current_theme M3Expressive color_scheme Impulse inject_css 1 inject_theme_js 1 replace_colors 1

if [[ "$NO_WALLPAPER_SYNC" -eq 0 && -x "$TARGET_DIR/scripts/sync-wallpaper.sh" ]]; then
  "$TARGET_DIR/scripts/sync-wallpaper.sh" || echo "Wallpaper sync skipped."
fi

if [[ "$NO_APPLY" -eq 0 ]]; then
  if ! spicetify apply; then
    echo "spicetify apply failed. On Linux you may need write permissions on Spotify's folder (e.g. chmod a+wr)." >&2
    exit 1
  fi
fi

echo "M3 Expressive installed."