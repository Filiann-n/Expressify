#!/usr/bin/env bash
set -euo pipefail

STYLE="tonal"
DO_APPLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --style|-s)
      STYLE="${2:-tonal}"
      shift 2
      ;;
    --apply|-a)
      DO_APPLY=1
      shift
      ;;
    *)
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/color.ini" ]]; then
  THEME_DIR="$SCRIPT_DIR"
else
  THEME_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required for wallpaper sync." >&2
  exit 1
fi

detect_wallpaper() {
  local wp=""
  if command -v swww >/dev/null 2>&1; then
    wp="$(swww query 2>/dev/null | sed -n 's/.*image: //p' | head -n1 || true)"
  fi
  if [[ -z "$wp" ]] && command -v hyprctl >/dev/null 2>&1; then
    wp="$(hyprctl hyprpaper listactive 2>/dev/null | sed -n 's/.*= //p' | head -n1 || true)"
  fi
  if [[ -z "$wp" ]] && command -v gsettings >/dev/null 2>&1; then
    wp="$(gsettings get org.gnome.desktop.background picture-uri-dark 2>/dev/null || gsettings get org.gnome.desktop.background picture-uri 2>/dev/null || true)"
    wp="${wp//\'/}"
    wp="${wp#file://}"
  fi
  if [[ -z "$wp" ]] && command -v xfconf-query >/dev/null 2>&1; then
    wp="$(xfconf-query -c xfce4-desktop -l 2>/dev/null | grep 'last-image$' | head -n1 | xargs -r xfconf-query -c xfce4-desktop -p 2>/dev/null || true)"
  fi
  if [[ -z "$wp" && -f "$HOME/.fehbg" ]]; then
    wp="$(grep -oE "'[^']+'" "$HOME/.fehbg" | tr -d "'" | head -n1 || true)"
  fi
  if [[ -z "$wp" && -f "$HOME/.config/nitrogen/bg-saved.cfg" ]]; then
    wp="$(sed -n 's/^file=//p' "$HOME/.config/nitrogen/bg-saved.cfg" | head -n1 || true)"
  fi
  if [[ -n "$wp" && -f "$wp" ]]; then
    printf '%s' "$wp"
  fi
}

WP_PATH="$(detect_wallpaper)"

THEME_DIR="$THEME_DIR" STYLE="$STYLE" WP_PATH="$WP_PATH" python3 - <<'PY'
import json, math, os, re, shutil, subprocess, sys

theme_dir = os.environ["THEME_DIR"]
style = os.environ.get("STYLE", "tonal")
wp_path = os.environ.get("WP_PATH", "")

def clean_hex(val, fallback):
    if isinstance(val, str) and re.fullmatch(r"#?[0-9a-fA-F]{6}", val.strip()):
        return val.strip().lstrip("#").lower()
    return fallback

def rgb_to_hsl(r, g, b):
    rd, gd, bd = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(rd, gd, bd), min(rd, gd, bd)
    l = (mx + mn) / 2.0
    h = s = 0.0
    if mx != mn:
        d = mx - mn
        s = d / (2.0 - mx - mn) if l > 0.5 else d / (mx + mn)
        if mx == rd:
            h = (gd - bd) / d + (6.0 if gd < bd else 0.0)
        elif mx == gd:
            h = (bd - rd) / d + 2.0
        else:
            h = (rd - gd) / d + 4.0
        h /= 6.0
    return int(round(h * 360)) % 360, int(round(s * 100)), int(round(l * 100))

def hsl_to_hex(h, s, l):
    hd = (h % 360) / 360.0
    sd = max(0, min(100, s)) / 100.0
    ld = max(0, min(100, l)) / 100.0
    if sd == 0:
        r = g = b = ld
    else:
        q = ld * (1.0 + sd) if ld < 0.5 else ld + sd - ld * sd
        p = 2.0 * ld - q
        def hue2rgb(t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p
        r, g, b = hue2rgb(hd + 1/3), hue2rgb(hd), hue2rgb(hd - 1/3)
    return "{:02x}{:02x}{:02x}".format(
        max(0, min(255, round(r * 255))),
        max(0, min(255, round(g * 255))),
        max(0, min(255, round(b * 255))),
    )

def build_palette(rgb, st):
    h, raw_s, _ = rgb_to_hsl(*rgb)
    bg_h, sec_h, tert_h = h, h, (h + 45) % 360
    if st == "vibrant":
        sat = max(64, min(92, 28 if raw_s < 18 else raw_s + 18))
        bg_sat = min(28, max(12, round(sat * 0.30)))
    elif st == "expressive":
        sat = max(56, min(88, 30 if raw_s < 18 else raw_s + 12))
        bg_sat = min(24, max(10, round(sat * 0.25)))
        bg_h, sec_h, tert_h = (h + 325) % 360, (h + 35) % 360, (h + 120) % 360
    elif st == "content":
        sat = max(12, min(94, raw_s))
        bg_sat = min(32, max(4, round(raw_s * 0.34)))
    else:
        sat = max(38, min(78, 22 if raw_s < 18 else raw_s))
        bg_sat = min(18, max(6, round(sat * 0.22)))
    return {
        "surface": hsl_to_hex(bg_h, bg_sat, 8),
        "surface_container_lowest": hsl_to_hex(bg_h, bg_sat, 5),
        "surface_container_low": hsl_to_hex(bg_h, bg_sat, 10),
        "surface_container": hsl_to_hex(bg_h, bg_sat, 13),
        "surface_container_high": hsl_to_hex(bg_h, bg_sat + 2, 17),
        "surface_container_highest": hsl_to_hex(bg_h, bg_sat + 3, 22),
        "primary": hsl_to_hex(h, sat, 78),
        "on_primary": hsl_to_hex(h, min(68, sat), 16),
        "primary_container": hsl_to_hex(h, min(60, sat), 28),
        "on_primary_container": hsl_to_hex(h, min(85, sat + 5), 90),
        "secondary_container": hsl_to_hex(sec_h, min(34, bg_sat + 14), 27),
        "on_secondary_container": hsl_to_hex(sec_h, 32, 88),
        "tertiary": hsl_to_hex(tert_h, max(35, sat - 8), 80),
        "outline": hsl_to_hex(bg_h, 8, 57),
        "outline_variant": hsl_to_hex(bg_h, bg_sat, 28),
        "on_surface": hsl_to_hex(bg_h, 12, 91),
        "on_surface_variant": hsl_to_hex(bg_h, 10, 76),
        "error_container": "93000a",
    }

c = None
source = "default fallback"

# 1. Quickshell / illogical-impulse colors.json
for p in [
    os.path.expanduser("~/.local/state/quickshell/user/generated/colors.json"),
    os.path.expanduser("~/.cache/quickshell/user/generated/colors.json"),
]:
    if os.path.isfile(p):
        try:
            data = json.load(open(p, "r", encoding="utf-8"))
            if data.get("primary") and data.get("surface"):
                c = data
                source = f"quickshell ({p})"
                break
        except Exception:
            pass

# 2. matugen on detected wallpaper
if c is None and wp_path and shutil.which("matugen"):
    scheme_map = {
        "expressive": "scheme-expressive",
        "vibrant": "scheme-vibrant",
        "content": "scheme-fidelity",
    }
    scheme = scheme_map.get(style, "scheme-tonal-spot")
    try:
        raw = subprocess.check_output(
            ["matugen", "image", wp_path, "-m", "dark", "-t", scheme, "-j", "hex"],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        mj = json.loads(raw)
        colors = mj.get("colors", {})
        if isinstance(colors.get("dark"), dict) and colors["dark"].get("primary"):
            c = colors["dark"]
            source = f"matugen ({scheme})"
        elif isinstance(colors.get("primary"), dict) and colors["primary"].get("dark"):
            c = {k: v.get("dark") for k, v in colors.items() if isinstance(v, dict)}
            source = f"matugen ({scheme})"
    except Exception:
        pass

# 3. Pillow image extraction on detected wallpaper
if c is None and wp_path:
    try:
        from PIL import Image
        img = Image.open(wp_path).convert("RGBA").resize((64, 64), Image.BILINEAR)
        hw = [0.0] * 360
        hbs = [0.0] * 360
        hsat = [0] * 360
        hrgb = [None] * 360
        total = 0.0
        for r, g, b, a in img.getdata():
            if a < 200:
                continue
            ph, ps, pl = rgb_to_hsl(r, g, b)
            if pl < 12 or pl > 92 or ps < 14:
                continue
            w = 0.4 + (ps / 100.0) * 0.6
            hw[ph] += w
            total += w
            rep = ps * (1.0 - abs(pl - 52.0) / 65.0)
            if rep > hbs[ph]:
                hbs[ph], hsat[ph], hrgb[ph] = rep, ps, (r, g, b)
        if total > 0:
            best_h, best_s = -1, -1.0
            for h in range(360):
                if hw[h] <= 0:
                    continue
                exc = sum(hw[(h + d) % 360] for d in range(-15, 16))
                sc = (exc / total) * 70.0 + (hsat[h] / 100.0) * 30.0
                if sc > best_s:
                    best_s, best_h = sc, h
            if best_h >= 0 and hrgb[best_h]:
                seed = hrgb[best_h]
                c = build_palette(seed, style)
                source = f"wallpaper (#{seed[0]:02x}{seed[1]:02x}{seed[2]:02x}, {style})"
    except Exception:
        pass

# 4. pywal colors.json fallback
if c is None:
    wal = os.path.expanduser("~/.cache/wal/colors.json")
    if os.path.isfile(wal):
        try:
            wj = json.load(open(wal, "r", encoding="utf-8"))
            hx = clean_hex(wj.get("colors", {}).get("color4") or wj.get("colors", {}).get("color1"), "")
            if hx:
                seed = (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))
                c = build_palette(seed, style)
                source = f"pywal (#{hx}, {style})"
        except Exception:
            pass

c = c or {}
ini = f"""[Impulse]
text                  = {clean_hex(c.get('on_surface'), 'e3e2e1')}
subtext               = {clean_hex(c.get('on_surface_variant'), 'c7c6c5')}
main                  = {clean_hex(c.get('surface_container'), '1f201f')}
main-elevated         = {clean_hex(c.get('surface_container_high'), '292a2a')}
highlight             = {clean_hex(c.get('surface_container_high'), '292a2a')}
highlight-elevated    = {clean_hex(c.get('surface_container_highest'), '343534')}
sidebar               = {clean_hex(c.get('surface_container_low'), '1b1c1b')}
player                = {clean_hex(c.get('surface_container_high'), '292a2a')}
card                  = {clean_hex(c.get('surface_container_high'), '292a2a')}
shadow                = 000000
selected-row          = {clean_hex(c.get('on_surface'), 'e3e2e1')}
button                = {clean_hex(c.get('primary'), 'b8cac5')}
button-active         = {clean_hex(c.get('on_primary_container'), 'd4e7e1')}
button-disabled       = {clean_hex(c.get('outline_variant'), '464746')}
tab-active            = {clean_hex(c.get('secondary_container'), '3f4946')}
notification          = {clean_hex(c.get('primary_container'), '394a46')}
notification-error    = {clean_hex(c.get('error_container'), '93000a')}
misc                  = {clean_hex(c.get('outline'), '919190')}

m3-surface            = {clean_hex(c.get('surface'), '121413')}
m3-surface-lowest     = {clean_hex(c.get('surface_container_lowest'), '0d0e0e')}
m3-surface-low        = {clean_hex(c.get('surface_container_low'), '1b1c1b')}
m3-surface-container  = {clean_hex(c.get('surface_container'), '1f201f')}
m3-surface-high       = {clean_hex(c.get('surface_container_high'), '292a2a')}
m3-surface-highest    = {clean_hex(c.get('surface_container_highest'), '343534')}
m3-primary            = {clean_hex(c.get('primary'), 'b8cac5')}
m3-on-primary         = {clean_hex(c.get('on_primary'), '233430')}
m3-primary-container  = {clean_hex(c.get('primary_container'), '394a46')}
m3-on-primary-cont    = {clean_hex(c.get('on_primary_container'), 'd4e7e1')}
m3-secondary-cont     = {clean_hex(c.get('secondary_container'), '3f4946')}
m3-on-secondary-cont  = {clean_hex(c.get('on_secondary_container'), 'dae5e1')}
m3-tertiary           = {clean_hex(c.get('tertiary'), 'b1ccc5')}
m3-outline            = {clean_hex(c.get('outline'), '919190')}
m3-outline-variant    = {clean_hex(c.get('outline_variant'), '464746')}
m3-on-surface         = {clean_hex(c.get('on_surface'), 'e3e2e1')}
m3-on-surface-var     = {clean_hex(c.get('on_surface_variant'), 'c7c6c5')}
"""

with open(os.path.join(theme_dir, "color.ini"), "w", encoding="utf-8", newline="\n") as f:
    f.write(ini)

print(f"Updated color.ini from {source}")
PY

if [[ "$DO_APPLY" -eq 1 ]] && command -v spicetify >/dev/null 2>&1; then
  spicetify refresh
fi