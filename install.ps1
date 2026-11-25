param(
    [switch]$NoWallpaperSync,
    [switch]$NoApply
)

$ErrorActionPreference = "Stop"
$repo = "Filiann-n/Expressify"
$baseUrl = "https://raw.githubusercontent.com/$repo/main"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
    Write-Host "Spicetify is required to use this theme." -ForegroundColor Yellow
    Write-Host "Install Spicetify first from https://spicetify.app and run this command again."
    if ($PSScriptRoot) { exit 1 } else { return }
}

$cfgPath = (spicetify -c 2>$null | Select-Object -First 1)
if (-not [string]::IsNullOrWhiteSpace($cfgPath)) {
    $spicetifyUser = Split-Path -Parent $cfgPath
} else {
    $spicetifyUser = (spicetify path userdata 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($spicetifyUser)) { $spicetifyUser = Join-Path $env:APPDATA "spicetify" }
}

$targetDir = Join-Path $spicetifyUser "Themes\M3Expressive"
New-Item -ItemType Directory -Path (Join-Path $targetDir "scripts") -Force | Out-Null

$localMode = $PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "user.css"))
if ($localMode) {
    $src = (Resolve-Path $PSScriptRoot).Path.TrimEnd('\')
    $dst = (Resolve-Path $targetDir).Path.TrimEnd('\')
    if ($src -ne $dst) {
        foreach ($f in @("color.ini", "user.css", "theme.js", "uninstall.ps1")) {
            if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) $targetDir -Force }
        }
        if (Test-Path (Join-Path $src "scripts\sync-wallpaper.ps1")) {
            Copy-Item (Join-Path $src "scripts\sync-wallpaper.ps1") (Join-Path $targetDir "scripts") -Force
        }
    }
} else {
    Write-Host "Downloading M3 Expressive..." -ForegroundColor Cyan
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    foreach ($rel in @("color.ini", "user.css", "theme.js", "uninstall.ps1", "scripts/sync-wallpaper.ps1")) {
        $dest = Join-Path $targetDir ($rel -replace '/', '\')
        Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/$rel" -OutFile $dest
    }
}

$prevFile = Join-Path $targetDir ".m3e-prev-theme"
$curTheme = ((spicetify config current_theme 2>$null) | Out-String).Trim()
$curScheme = ((spicetify config color_scheme 2>$null) | Out-String).Trim()
if ($curTheme -and $curTheme -ne "M3Expressive" -and -not (Test-Path $prevFile)) {
    [System.IO.File]::WriteAllText($prevFile, "$curTheme`n$curScheme", [System.Text.UTF8Encoding]::new($false))
}

spicetify config current_theme M3Expressive color_scheme Impulse inject_css 1 inject_theme_js 1 replace_colors 1

if (-not $NoWallpaperSync) {
    $syncScript = Join-Path $targetDir "scripts\sync-wallpaper.ps1"
    if (Test-Path $syncScript) {
        try { & $syncScript } catch { Write-Host "Wallpaper sync skipped: $($_.Exception.Message)" -ForegroundColor Yellow }
    }
}

if (-not $NoApply) { spicetify apply }
Write-Host "M3 Expressive installed." -ForegroundColor Green