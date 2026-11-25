param(
    [ValidateSet("tonal", "expressive", "vibrant", "content")]
    [string]$Style = "tonal",
    [switch]$Apply,
    [switch]$NoRestart
)

$themeDir = if (Test-Path (Join-Path $PSScriptRoot "color.ini")) {
    $PSScriptRoot
} else {
    Split-Path -Parent $PSScriptRoot
}

function Format-HexClean([string]$val, [string]$fallback) {
    if ($val -and ($val -match '^#?[0-9a-fA-F]{6}$')) { return $val.TrimStart('#').ToLower() }
    return $fallback
}

function Convert-RgbToHsl([int]$r, [int]$g, [int]$b) {
    $rd = $r / 255.0; $gd = $g / 255.0; $bd = $b / 255.0
    $max = [Math]::Max($rd, [Math]::Max($gd, $bd))
    $min = [Math]::Min($rd, [Math]::Min($gd, $bd))
    $l = ($max + $min) / 2.0
    $h = 0.0; $s = 0.0

    if ($max -ne $min) {
        $d = $max - $min
        $s = if ($l -gt 0.5) { $d / (2.0 - $max - $min) } else { $d / ($max + $min) }
        if ($max -eq $rd) {
            $h = ($gd - $bd) / $d + $(if ($gd -lt $bd) { 6.0 } else { 0.0 })
        } elseif ($max -eq $gd) {
            $h = ($bd - $rd) / $d + 2.0
        } else {
            $h = ($rd - $gd) / $d + 4.0
        }
        $h /= 6.0
    }

    $hInt = ([int][Math]::Round($h * 360.0)) % 360
    if ($hInt -lt 0) { $hInt += 360 }
    $sInt = [int][Math]::Round($s * 100.0)
    $lInt = [int][Math]::Round($l * 100.0)
    return @($hInt, $sInt, $lInt)
}

function Hue2Rgb([double]$p, [double]$q, [double]$t) {
    if ($t -lt 0.0) { $t += 1.0 }
    if ($t -gt 1.0) { $t -= 1.0 }
    if ($t -lt (1.0 / 6.0)) { return $p + ($q - $p) * 6.0 * $t }
    if ($t -lt 0.5) { return $q }
    if ($t -lt (2.0 / 3.0)) { return $p + ($q - $p) * (2.0 / 3.0 - $t) * 6.0 }
    return $p
}

function Convert-HslToHex([int]$h, [int]$s, [int]$l) {
    $hd = ((($h % 360) + 360) % 360) / 360.0
    $sd = [Math]::Max(0, [Math]::Min(100, $s)) / 100.0
    $ld = [Math]::Max(0, [Math]::Min(100, $l)) / 100.0

    if ($sd -eq 0.0) {
        $r = $ld; $g = $ld; $b = $ld
    } else {
        $q = if ($ld -lt 0.5) { $ld * (1.0 + $sd) } else { $ld + $sd - $ld * $sd }
        $p = 2.0 * $ld - $q
        $r = Hue2Rgb $p $q ($hd + 1.0 / 3.0)
        $g = Hue2Rgb $p $q $hd
        $b = Hue2Rgb $p $q ($hd - 1.0 / 3.0)
    }

    $ri = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round($r * 255.0)))
    $gi = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round($g * 255.0)))
    $bi = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round($b * 255.0)))
    return ("{0:x2}{1:x2}{2:x2}" -f $ri, $gi, $bi)
}

function Build-PaletteFromRgb([int[]]$rgb, [string]$styleName) {
    $hsl = Convert-RgbToHsl $rgb[0] $rgb[1] $rgb[2]
    $h = $hsl[0]; $rawS = $hsl[1]

    $bgH = $h; $secH = $h; $tertH = ($h + 45) % 360
    if ($styleName -eq "vibrant") {
        $sat = [Math]::Max(64, [Math]::Min(92, $(if ($rawS -lt 18) { 28 } else { $rawS + 18 })))
        $bgSat = [Math]::Min(28, [Math]::Max(12, [int][Math]::Round($sat * 0.30)))
    } elseif ($styleName -eq "expressive") {
        $sat = [Math]::Max(56, [Math]::Min(88, $(if ($rawS -lt 18) { 30 } else { $rawS + 12 })))
        $bgSat = [Math]::Min(24, [Math]::Max(10, [int][Math]::Round($sat * 0.25)))
        $bgH = ($h + 325) % 360
        $secH = ($h + 35) % 360
        $tertH = ($h + 120) % 360
    } elseif ($styleName -eq "content") {
        $sat = [Math]::Max(12, [Math]::Min(94, $rawS))
        $bgSat = [Math]::Min(32, [Math]::Max(4, [int][Math]::Round($rawS * 0.34)))
    } else {
        $sat = [Math]::Max(38, [Math]::Min(78, $(if ($rawS -lt 18) { 22 } else { $rawS })))
        $bgSat = [Math]::Min(18, [Math]::Max(6, [int][Math]::Round($sat * 0.22)))
    }

    return [pscustomobject]@{
        surface                   = Convert-HslToHex $bgH $bgSat 8
        surface_container_lowest  = Convert-HslToHex $bgH $bgSat 5
        surface_container_low     = Convert-HslToHex $bgH $bgSat 10
        surface_container         = Convert-HslToHex $bgH $bgSat 13
        surface_container_high    = Convert-HslToHex $bgH ($bgSat + 2) 17
        surface_container_highest = Convert-HslToHex $bgH ($bgSat + 3) 22
        primary                   = Convert-HslToHex $h $sat 78
        on_primary                = Convert-HslToHex $h ([Math]::Min(68, $sat)) 16
        primary_container         = Convert-HslToHex $h ([Math]::Min(60, $sat)) 28
        on_primary_container      = Convert-HslToHex $h ([Math]::Min(85, $sat + 5)) 90
        secondary_container       = Convert-HslToHex $secH ([Math]::Min(34, $bgSat + 14)) 27
        on_secondary_container    = Convert-HslToHex $secH 32 88
        tertiary                  = Convert-HslToHex $tertH ([Math]::Max(35, $sat - 8)) 80
        outline                   = Convert-HslToHex $bgH 8 57
        outline_variant           = Convert-HslToHex $bgH $bgSat 28
        on_surface                = Convert-HslToHex $bgH 12 91
        on_surface_variant        = Convert-HslToHex $bgH 10 76
        error_container           = "93000a"
    }
}

function Get-ActiveWallpaperPath {
    $wpReg = (Get-ItemProperty "HKCU:\Control Panel\Desktop" -Name WallPaper -ErrorAction SilentlyContinue).WallPaper
    if ([string]::IsNullOrWhiteSpace($wpReg)) { return $null }
    $wpTrans = "$env:APPDATA\Microsoft\Windows\Themes\TranscodedWallpaper"
    if (Test-Path $wpTrans) { return $wpTrans }
    if (Test-Path $wpReg) { return $wpReg }
    return $null
}

function Get-WallpaperSeedRgb([string]$imgPath) {
    Add-Type -AssemblyName System.Drawing
    $fs = $null; $img = $null; $bmp = $null; $gfx = $null
    try {
        $fs = [System.IO.File]::OpenRead($imgPath)
        $img = [System.Drawing.Image]::FromStream($fs)
        $bmp = New-Object System.Drawing.Bitmap(64, 64)
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
        $gfx.DrawImage($img, 0, 0, 64, 64)

        $hueWeight = New-Object double[] 360
        $hueBestScore = New-Object double[] 360
        $hueBestSat = New-Object int[] 360
        $hueBestRgb = New-Object object[] 360
        $totalWeight = 0.0

        for ($y = 0; $y -lt 64; $y++) {
            for ($x = 0; $x -lt 64; $x++) {
                $px = $bmp.GetPixel($x, $y)
                if ($px.A -lt 200) { continue }
                $hsl = Convert-RgbToHsl $px.R $px.G $px.B
                $ph = $hsl[0]; $ps = $hsl[1]; $pl = $hsl[2]
                if ($pl -lt 12 -or $pl -gt 92 -or $ps -lt 14) { continue }

                $w = 0.4 + ($ps / 100.0) * 0.6
                $hueWeight[$ph] += $w
                $totalWeight += $w

                $repScore = $ps * (1.0 - [Math]::Abs($pl - 52.0) / 65.0)
                if ($repScore -gt $hueBestScore[$ph]) {
                    $hueBestScore[$ph] = $repScore
                    $hueBestSat[$ph] = $ps
                    $rPx = [int]$px.R; $gPx = [int]$px.G; $bPx = [int]$px.B
                    $hueBestRgb[$ph] = @($rPx, $gPx, $bPx)
                }
            }
        }

        if ($totalWeight -le 0.0) { return $null }

        $bestHue = -1; $bestWinScore = -1.0
        for ($h = 0; $h -lt 360; $h++) {
            if ($hueWeight[$h] -le 0.0) { continue }
            $excited = 0.0
            for ($d = -15; $d -le 15; $d++) {
                $excited += $hueWeight[(($h + $d + 360) % 360)]
            }
            $score = ($excited / $totalWeight) * 70.0 + ($hueBestSat[$h] / 100.0) * 30.0
            if ($score -gt $bestWinScore) {
                $bestWinScore = $score
                $bestHue = $h
            }
        }
        if ($bestHue -ge 0) { return $hueBestRgb[$bestHue] }
        return $null
    } finally {
        if ($gfx) { $gfx.Dispose() }
        if ($bmp) { $bmp.Dispose() }
        if ($img) { $img.Dispose() }
        if ($fs)  { $fs.Dispose() }
    }
}

$c = $null
$sourceLabel = ""

# 1. ii-windows / Quickshell colors.json
$iiPath = "$env:LOCALAPPDATA\quickshell\State\user\generated\colors.json"
if (Test-Path $iiPath) {
    try {
        $parsed = Get-Content $iiPath -Raw | ConvertFrom-Json
        if ($parsed.primary -and $parsed.surface) {
            $c = $parsed
            $sourceLabel = "ii-windows (colors.json)"
        }
    } catch {}
}

# 2. matugen (if available)
$wpPath = Get-ActiveWallpaperPath
if (-not $c -and $wpPath) {
    $matExe = (Get-Command matugen -ErrorAction SilentlyContinue).Source
    if (-not $matExe) {
        $foundMat = Get-ChildItem "$env:LOCALAPPDATA\quickshell", "$env:USERPROFILE\scoop" -Filter "matugen.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($foundMat) { $matExe = $foundMat.FullName }
    }
    if ($matExe) {
        $schemeArg = switch ($Style) {
            "expressive" { "scheme-expressive" }
            "vibrant"    { "scheme-vibrant" }
            "content"    { "scheme-fidelity" }
            default      { "scheme-tonal-spot" }
        }
        try {
            $matRaw = & $matExe image $wpPath -m dark -t $schemeArg -j hex 2>$null | Out-String
            $matJson = $matRaw | ConvertFrom-Json
            if ($matJson.colors.dark.primary) {
                $c = $matJson.colors.dark
                $sourceLabel = "matugen ($schemeArg)"
            } elseif ($matJson.colors.primary.dark) {
                $flat = @{}
                foreach ($prop in $matJson.colors.PSObject.Properties) {
                    $flat[$prop.Name] = $prop.Value.dark
                }
                $c = [pscustomobject]$flat
                $sourceLabel = "matugen ($schemeArg)"
            }
        } catch {}
    }
}

# 3. Native Windows wallpaper via .NET
if (-not $c -and $wpPath) {
    try {
        $seedRgb = Get-WallpaperSeedRgb $wpPath
        if ($seedRgb) {
            $c = Build-PaletteFromRgb $seedRgb $Style
            $seedHex = "#{0:x2}{1:x2}{2:x2}" -f $seedRgb[0], $seedRgb[1], $seedRgb[2]
            $sourceLabel = "Windows wallpaper ($seedHex, $Style)"
        }
    } catch {}
}

# 4. Windows DWM AccentColor fallback
if (-not $c) {
    $dwm = (Get-ItemProperty "HKCU:\Software\Microsoft\Windows\DWM" -Name AccentColor -ErrorAction SilentlyContinue).AccentColor
    if ($null -ne $dwm) {
        $r = [int]($dwm -band 0xFF)
        $g = [int](($dwm -shr 8) -band 0xFF)
        $b = [int](($dwm -shr 16) -band 0xFF)
        $seedArr = @($r, $g, $b)
        $c = Build-PaletteFromRgb $seedArr $Style
        $seedHex = "#{0:x2}{1:x2}{2:x2}" -f $r, $g, $b
        $sourceLabel = "Windows AccentColor ($seedHex, $Style)"
    } else {
        $sourceLabel = "Default fallback"
    }
}

$ini = @"
[Impulse]
text                  = $(Format-HexClean $c.on_surface 'e3e2e1')
subtext               = $(Format-HexClean $c.on_surface_variant 'c7c6c5')
main                  = $(Format-HexClean $c.surface_container '1f201f')
main-elevated         = $(Format-HexClean $c.surface_container_high '292a2a')
highlight             = $(Format-HexClean $c.surface_container_high '292a2a')
highlight-elevated    = $(Format-HexClean $c.surface_container_highest '343534')
sidebar               = $(Format-HexClean $c.surface_container_low '1b1c1b')
player                = $(Format-HexClean $c.surface_container_high '292a2a')
card                  = $(Format-HexClean $c.surface_container_high '292a2a')
shadow                = 000000
selected-row          = $(Format-HexClean $c.on_surface 'e3e2e1')
button                = $(Format-HexClean $c.primary 'b8cac5')
button-active         = $(Format-HexClean $c.on_primary_container 'd4e7e1')
button-disabled       = $(Format-HexClean $c.outline_variant '464746')
tab-active            = $(Format-HexClean $c.secondary_container '3f4946')
notification          = $(Format-HexClean $c.primary_container '394a46')
notification-error    = $(Format-HexClean $c.error_container '93000a')
misc                  = $(Format-HexClean $c.outline '919190')

m3-surface            = $(Format-HexClean $c.surface '121413')
m3-surface-lowest     = $(Format-HexClean $c.surface_container_lowest '0d0e0e')
m3-surface-low        = $(Format-HexClean $c.surface_container_low '1b1c1b')
m3-surface-container  = $(Format-HexClean $c.surface_container '1f201f')
m3-surface-high       = $(Format-HexClean $c.surface_container_high '292a2a')
m3-surface-highest    = $(Format-HexClean $c.surface_container_highest '343534')
m3-primary            = $(Format-HexClean $c.primary 'b8cac5')
m3-on-primary         = $(Format-HexClean $c.on_primary '233430')
m3-primary-container  = $(Format-HexClean $c.primary_container '394a46')
m3-on-primary-cont    = $(Format-HexClean $c.on_primary_container 'd4e7e1')
m3-secondary-cont     = $(Format-HexClean $c.secondary_container '3f4946')
m3-on-secondary-cont  = $(Format-HexClean $c.on_secondary_container 'dae5e1')
m3-tertiary           = $(Format-HexClean $c.tertiary 'b1ccc5')
m3-outline            = $(Format-HexClean $c.outline '919190')
m3-outline-variant    = $(Format-HexClean $c.outline_variant '464746')
m3-on-surface         = $(Format-HexClean $c.on_surface 'e3e2e1')
m3-on-surface-var     = $(Format-HexClean $c.on_surface_variant 'c7c6c5')
"@

[System.IO.File]::WriteAllText((Join-Path $themeDir "color.ini"), $ini, [System.Text.UTF8Encoding]::new($false))
Write-Host "Updated color.ini from $sourceLabel" -ForegroundColor Green

if ($Apply) {
    if ($NoRestart) {
        spicetify refresh -n
    } else {
        spicetify refresh
    }
}