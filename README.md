# M3 Expressive for Spicetify

A Material 3 Expressive theme for the Spotify desktop client, built for [Spicetify](https://spicetify.app).

## Requirements

- Desktop Spotify client (standard installer / Scoop on Windows, or native package on Linux; Microsoft Store builds are not supported)
- **[Spicetify](https://spicetify.app)** installed

> This repo only installs the theme itself. The install scripts check whether `spicetify` is present and will not install Spicetify for you.

## Features

- Floating rounded panels, wavy playback progress bar, and shape-morphing controls (Play/Pause, filter chips, active player buttons)
- Dynamic dark palette extracted from the current track cover (`Balanced`, `Contrast`, `Vibrant`, `Cover match`)
- `Expressive+` adaptive artwork accents on Home tiles and cards
- Optional system wallpaper sync for static mode (Windows and Linux)
- Built-in `M3 Expressive` section inside Spotify Settings (auto RU/EN) with a toggle to disable the theme and reload back to vanilla Spotify

## Installation

No `git` required — the installer downloads the theme files, configures Spicetify, syncs your wallpaper palette, and applies the theme.

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Filiann-n/Expressify/main/install.ps1 | iex
```

### Linux (Bash)

```bash
curl -fsSL https://raw.githubusercontent.com/Filiann-n/Expressify/main/install.sh | bash
```

To skip wallpaper sync on Linux: `curl -fsSL https://raw.githubusercontent.com/Filiann-n/Expressify/main/install.sh | bash -s -- --no-wallpaper-sync`

## Wallpaper Sync

When **Dynamic track colors** is off in Spotify Settings, the theme uses `color.ini`. Refresh it from your wallpaper at any time:

- **Windows:** `& "$env:APPDATA\spicetify\Themes\M3Expressive\scripts\sync-wallpaper.ps1" -Apply`
  Checks `ii-windows` (`colors.json`) -> `matugen` -> active Windows wallpaper -> Windows accent color.
- **Linux:** `"${XDG_CONFIG_HOME:-$HOME/.config}/spicetify/Themes/M3Expressive/scripts/sync-wallpaper.sh" --apply`
  Checks `quickshell` / `illogical-impulse` (`colors.json`) -> `matugen` -> active wallpaper (`swww`, `hyprpaper`, GNOME, XFCE, `feh`, `nitrogen`) -> `pywal`.

Optional style flag: `-Style` / `--style` (`tonal`, `expressive`, `vibrant`, `content`).

## Uninstall

Restores the Spicetify theme you had before installing `M3Expressive`:

- **Windows:** `irm https://raw.githubusercontent.com/Filiann-n/Expressify/main/uninstall.ps1 | iex`
- **Linux:** `curl -fsSL https://raw.githubusercontent.com/Filiann-n/Expressify/main/uninstall.sh | bash`

## License

MIT
