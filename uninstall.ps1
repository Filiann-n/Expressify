$ErrorActionPreference = "Stop"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
    Write-Host "Spicetify was not found in PATH." -ForegroundColor Yellow
    if ($PSScriptRoot) { exit 1 } else { return }
}

$spicetifyUser = (spicetify path userdata 2>$null | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($spicetifyUser)) { $spicetifyUser = Join-Path $env:APPDATA "spicetify" }
$targetDir = Join-Path $spicetifyUser "Themes\M3Expressive"
$prevFile = Join-Path $targetDir ".m3e-prev-theme"

$prevTheme = ""; $prevScheme = ""
if (Test-Path $prevFile) {
    $lines = Get-Content $prevFile
    if ($lines.Count -ge 1) { $prevTheme = $lines[0].Trim() }
    if ($lines.Count -ge 2) { $prevScheme = $lines[1].Trim() }
    Remove-Item $prevFile -Force -ErrorAction SilentlyContinue
}

spicetify config current_theme $prevTheme color_scheme $prevScheme
spicetify apply
Write-Host "M3 Expressive disabled and previous theme restored." -ForegroundColor Green