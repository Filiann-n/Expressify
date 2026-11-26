(async function M3ExpressiveTheme() {
    const DISABLED_KEY = "m3e_theme_disabled";
    const getThemeDisabled = () => {
        try { return localStorage.getItem(DISABLED_KEY) === "1"; } catch { return false; }
    };
    const isThemeDisabled = getThemeDisabled();

    function applyVanillaSpiceColors() {
        const vanilla = {
            "text": ["ffffff", "255, 255, 255"],
            "subtext": ["b3b3b3", "179, 179, 179"],
            "main": ["121212", "18, 18, 18"],
            "main-elevated": ["282828", "40, 40, 40"],
            "highlight": ["2a2a2a", "42, 42, 42"],
            "highlight-elevated": ["3e3e3e", "62, 62, 62"],
            "sidebar": ["000000", "0, 0, 0"],
            "player": ["181818", "24, 24, 24"],
            "card": ["282828", "40, 40, 40"],
            "shadow": ["000000", "0, 0, 0"],
            "selected-row": ["ffffff", "255, 255, 255"],
            "button": ["1ed760", "30, 215, 96"],
            "button-active": ["1fdf64", "31, 223, 100"],
            "button-disabled": ["535353", "83, 83, 83"],
            "tab-active": ["333333", "51, 51, 51"],
            "notification": ["2e77d0", "46, 119, 208"],
            "notification-error": ["e22134", "226, 33, 52"],
            "misc": ["7f7f7f", "127, 127, 127"]
        };
        const root = document.documentElement.style;
        for (const [k, [hex, rgb]] of Object.entries(vanilla)) {
            root.setProperty(`--spice-${k}`, `#${hex}`, "important");
            root.setProperty(`--spice-rgb-${k}`, rgb, "important");
        }
        root.setProperty("--spice-m3-primary", "#1ed760", "important");
        root.setProperty("--spice-m3-on-primary", "#000000", "important");
        root.setProperty("--spice-m3-surface-high", "#282828", "important");
        root.setProperty("--spice-m3-surface-highest", "#3e3e3e", "important");
        root.setProperty("--spice-m3-on-surface", "#ffffff", "important");
        root.setProperty("--spice-m3-on-surface-var", "#b3b3b3", "important");
        root.setProperty("--spice-rgb-m3-primary", "30, 215, 96", "important");
        root.setProperty("--spice-rgb-m3-outline-variant", "83, 83, 83", "important");
    }

    function setThemeStylesDisabled(disabled) {
        document.querySelectorAll('link[href*="user.css"], style.marketplaceUserCSS, style.marketplaceScheme').forEach((el) => {
            el.disabled = disabled;
        });
        if (disabled) applyVanillaSpiceColors();
    }

    if (isThemeDisabled) {
        setThemeStylesDisabled(true);
        document.documentElement.dataset.m3eDisabled = "1";
    } else {
        try {
            document.documentElement.dataset.m3eBorders =
                localStorage.getItem("m3e_card_borders") === "0" ? "0" : "1";
        } catch {}
    }

    while (!window.Spicetify?.Player) {
        await new Promise((r) => setTimeout(r, 250));
    }

    if (isThemeDisabled) {
        setThemeStylesDisabled(true);
        setTimeout(() => setThemeStylesDisabled(true), 800);
        setTimeout(() => setThemeStylesDisabled(true), 2200);
    }

    const STORAGE_KEY = "m3e_color_mode";
    const STYLE_KEY = "m3e_palette_style";
    const VARS = [
        "--spice-m3-surface", "--spice-m3-surface-lowest", "--spice-m3-surface-low",
        "--spice-m3-surface-container", "--spice-m3-surface-high", "--spice-m3-surface-highest",
        "--spice-m3-primary", "--spice-m3-on-primary", "--spice-m3-primary-container",
        "--spice-m3-on-primary-cont", "--spice-m3-secondary-cont", "--spice-m3-on-secondary-cont",
        "--spice-m3-tertiary", "--spice-m3-outline", "--spice-m3-outline-variant",
        "--spice-m3-on-surface", "--spice-m3-on-surface-var",
        "--spice-rgb-m3-primary", "--spice-rgb-m3-secondary-cont",
        "--spice-rgb-m3-outline", "--spice-rgb-m3-outline-variant", "--spice-rgb-m3-on-surface",
        "--spice-button", "--spice-button-active", "--spice-text", "--spice-subtext",
        "--spice-main", "--spice-sidebar", "--spice-player", "--spice-card"
    ];

    function getMode() {
        try {
            const spVal = Spicetify.LocalStorage?.get?.(STORAGE_KEY);
            if (spVal === "track" || spVal === "impulse") return spVal;
        } catch {}
        return localStorage.getItem(STORAGE_KEY) === "track" ? "track" : "impulse";
    }

    function saveMode(mode) {
        localStorage.setItem(STORAGE_KEY, mode);
        try { Spicetify.LocalStorage?.set?.(STORAGE_KEY, mode); } catch {}
    }

    function getPaletteStyle() {
        const v = localStorage.getItem(STYLE_KEY);
        return ["tonal", "expressive", "vibrant", "content"].includes(v) ? v : "tonal";
    }

    function savePaletteStyle(style) {
        localStorage.setItem(STYLE_KEY, style);
    }

    function clearTrackOverrides() {
        const root = document.documentElement.style;
        for (const v of VARS) root.removeProperty(v);
    }

    function hexToRgb(hex) {
        const clean = (hex || "").replace("#", "").trim();
        if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
        return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16)
        ];
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function hslHex(h, s, l) {
        const [r, g, b] = hslToRgb(h, s, l);
        return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
    }

    function hslRgbStr(h, s, l) {
        return hslToRgb(h, s, l).join(", ");
    }

    async function extractCoverRgb(item) {
        const uri = item?.uri;
        if (uri && typeof Spicetify.colorExtractor === "function") {
            try {
                const res = await Promise.race([
                    Spicetify.colorExtractor(uri),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1500))
                ]);
                const pick = res?.VIBRANT || res?.PROMINENT || res?.LIGHT_VIBRANT || res?.DARK_VIBRANT || Object.values(res || {})[0];
                const rgb = hexToRgb(pick);
                if (rgb) return rgb;
            } catch {}
        }

        const rawUrl = item?.metadata?.image_url || "";
        if (!rawUrl) return null;
        const imgUrl = rawUrl.startsWith("spotify:image:")
            ? `https://i.scdn.co/image/${rawUrl.replace("spotify:image:", "")}`
            : rawUrl;

        return await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = 24;
                    canvas.height = 24;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, 24, 24);
                    const data = ctx.getImageData(0, 0, 24, 24).data;
                    let best = [184, 202, 197];
                    let bestScore = -1;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        const [, s, l] = rgbToHsl(r, g, b);
                        if (l < 15 || l > 88) continue;
                        const score = s * (1 - Math.abs(l - 52) / 60);
                        if (score > bestScore) { bestScore = score; best = [r, g, b]; }
                    }
                    resolve(best);
                } catch {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = imgUrl;
        });
    }

    let trackReqId = 0;
    async function applyTrackPalette() {
        if (getMode() !== "track") {
            clearTrackOverrides();
            return;
        }
        const item = Spicetify.Player.data?.item;
        if (!item) return;

        const reqId = ++trackReqId;
        const rgb = await extractCoverRgb(item);
        if (reqId !== trackReqId || !rgb || getMode() !== "track") return;

        const [h, rawS] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const style = getPaletteStyle();

        let sat, bgSat, bgH = h, tertH = (h + 45) % 360, secH = h;
        if (style === "vibrant") {
            sat = Math.max(64, Math.min(92, rawS < 18 ? 28 : rawS + 18));
            bgSat = Math.min(28, Math.max(12, Math.round(sat * 0.30)));
        } else if (style === "expressive") {
            sat = Math.max(56, Math.min(88, rawS < 18 ? 30 : rawS + 12));
            bgSat = Math.min(24, Math.max(10, Math.round(sat * 0.25)));
            bgH = (h + 325) % 360;
            secH = (h + 35) % 360;
            tertH = (h + 120) % 360;
        } else if (style === "content") {
            sat = Math.max(12, Math.min(94, rawS));
            bgSat = Math.min(32, Math.max(4, Math.round(rawS * 0.34)));
        } else {
            sat = Math.max(38, Math.min(78, rawS < 18 ? 22 : rawS));
            bgSat = Math.min(18, Math.max(6, Math.round(sat * 0.22)));
        }

        const root = document.documentElement.style;
        const pHex = hslHex(h, sat, 78);
        const onPHex = hslHex(h, Math.min(68, sat), 16);
        const pContHex = hslHex(h, Math.min(60, sat), 28);
        const onPContHex = hslHex(h, Math.min(85, sat + 5), 90);
        const sContHex = hslHex(secH, Math.min(34, bgSat + 14), 27);
        const onSContHex = hslHex(secH, 32, 88);
        const tertHex = hslHex(tertH, Math.max(35, sat - 8), 80);

        const map = {
            "--spice-m3-surface": hslHex(bgH, bgSat, 8),
            "--spice-m3-surface-lowest": hslHex(bgH, bgSat, 5),
            "--spice-m3-surface-low": hslHex(bgH, bgSat, 10),
            "--spice-m3-surface-container": hslHex(bgH, bgSat, 13),
            "--spice-m3-surface-high": hslHex(bgH, bgSat + 2, 17),
            "--spice-m3-surface-highest": hslHex(bgH, bgSat + 3, 22),
            "--spice-m3-primary": pHex,
            "--spice-m3-on-primary": onPHex,
            "--spice-m3-primary-container": pContHex,
            "--spice-m3-on-primary-cont": onPContHex,
            "--spice-m3-secondary-cont": sContHex,
            "--spice-m3-on-secondary-cont": onSContHex,
            "--spice-m3-tertiary": tertHex,
            "--spice-m3-outline": hslHex(bgH, 8, 57),
            "--spice-m3-outline-variant": hslHex(bgH, bgSat, 28),
            "--spice-m3-on-surface": hslHex(bgH, 12, 91),
            "--spice-m3-on-surface-var": hslHex(bgH, 10, 76),

            "--spice-rgb-m3-primary": hslRgbStr(h, sat, 78),
            "--spice-rgb-m3-secondary-cont": hslRgbStr(secH, Math.min(34, bgSat + 14), 27),
            "--spice-rgb-m3-outline": hslRgbStr(bgH, 8, 57),
            "--spice-rgb-m3-outline-variant": hslRgbStr(bgH, bgSat, 28),
            "--spice-rgb-m3-on-surface": hslRgbStr(bgH, 12, 91),

            "--spice-button": pHex,
            "--spice-button-active": onPContHex,
            "--spice-text": hslHex(bgH, 12, 91),
            "--spice-subtext": hslHex(bgH, 10, 76),
            "--spice-main": hslHex(bgH, bgSat, 13),
            "--spice-sidebar": hslHex(bgH, bgSat, 10),
            "--spice-player": hslHex(bgH, bgSat + 2, 17),
            "--spice-card": hslHex(bgH, bgSat + 2, 17)
        };

        for (const [k, v] of Object.entries(map)) {
            root.setProperty(k, v);
        }
    }

    const PLUS_KEY = "m3e_expressive_plus";
    function getExpressivePlus() {
        try {
            const v = Spicetify.LocalStorage?.get?.(PLUS_KEY);
            if (v === "0" || v === "1") return v === "1";
        } catch {}
        const lv = localStorage.getItem(PLUS_KEY);
        return lv === null ? true : lv === "1";
    }
    function saveExpressivePlus(on) {
        const val = on ? "1" : "0";
        localStorage.setItem(PLUS_KEY, val);
        try { Spicetify.LocalStorage?.set?.(PLUS_KEY, val); } catch {}
    }
    function syncPlusState() {
        const active = getMode() === "track" && getExpressivePlus();
        document.documentElement.dataset.m3ePlus = active ? "1" : "0";
        if (active) setTimeout(tintPlayingShortcuts, 80);
    }

    const BORDERS_KEY = "m3e_card_borders";
    function getBordersEnabled() {
        try {
            const v = Spicetify.LocalStorage?.get?.(BORDERS_KEY);
            if (v === "0" || v === "1") return v === "1";
        } catch {}
        const lv = localStorage.getItem(BORDERS_KEY);
        return lv === null ? true : lv === "1";
    }
    function saveBordersEnabled(on) {
        const val = on ? "1" : "0";
        localStorage.setItem(BORDERS_KEY, val);
        try { Spicetify.LocalStorage?.set?.(BORDERS_KEY, val); } catch {}
    }
    function syncBordersState() {
        document.documentElement.dataset.m3eBorders = getBordersEnabled() ? "1" : "0";
    }

    const tileColorCache = new Map();
    const tilePending = new Set();

    async function getImagePalette(imgUrl) {
        if (!imgUrl) return null;
        if (tileColorCache.has(imgUrl)) return tileColorCache.get(imgUrl);
        if (tilePending.has(imgUrl)) return null;
        tilePending.add(imgUrl);

        const url = imgUrl.startsWith("spotify:image:")
            ? `https://i.scdn.co/image/${imgUrl.replace("spotify:image:", "")}`
            : imgUrl;

        const rgb = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = 16;
                    canvas.height = 16;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, 16, 16);
                    const data = ctx.getImageData(0, 0, 16, 16).data;
                    let best = null, bestScore = -1;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        const [, s, l] = rgbToHsl(r, g, b);
                        if (l < 14 || l > 88) continue;
                        const score = s * (1 - Math.abs(l - 52) / 60);
                        if (score > bestScore) { bestScore = score; best = [r, g, b]; }
                    }
                    resolve(best);
                } catch { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });

        tilePending.delete(imgUrl);
        if (!rgb) return null;

        const [h, rawS] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const sat = Math.max(46, Math.min(86, rawS < 18 ? 28 : rawS));
        const res = {
            p: hslHex(h, sat, 78),
            onP: hslHex(h, Math.min(68, sat), 16),
            rgb: hslRgbStr(h, sat, 62)
        };
        tileColorCache.set(imgUrl, res);
        return res;
    }

    async function applyCardColor(card) {
        if (!card || document.documentElement.dataset.m3ePlus !== "1") return;
        const img = card.querySelector("img");
        const src = img?.currentSrc || img?.src;
        if (!src || card.dataset.m3eImg === src) return;
        const pal = await getImagePalette(src);
        if (!pal) return;
        card.dataset.m3eImg = src;
        card.style.setProperty("--m3e-card-p", pal.p);
        card.style.setProperty("--m3e-card-on-p", pal.onP);
        card.style.setProperty("--m3e-card-rgb", pal.rgb);
    }

    function tintPlayingShortcuts() {
        document.querySelectorAll(".m3e-is-playing").forEach((el) => el.classList.remove("m3e-is-playing"));
        const activeCards = document.querySelectorAll(
            '.view-homeShortcutsGrid-shortcut:has([aria-label*="Pause" i], [aria-label*="Пауз" i], [aria-pressed="true"]), ' +
            '.main-card-card:has([aria-label*="Pause" i], [aria-label*="Пауз" i], [aria-pressed="true"]), ' +
            '[data-encore-id="card"]:has([aria-label*="Pause" i], [aria-label*="Пауз" i], [aria-pressed="true"])'
        );
        activeCards.forEach((c) => {
            c.classList.add("m3e-is-playing");
            if (document.documentElement.dataset.m3ePlus === "1") applyCardColor(c);
        });
    }

    let prewarmTimer = null;
    function prewarmExpressiveCards() {
        if (document.documentElement.dataset.m3ePlus !== "1") return;
        const cards = document.querySelectorAll(".view-homeShortcutsGrid-shortcut, .main-card-card, [data-encore-id='card']");
        let i = 0;
        for (const c of cards) {
            if (!c.dataset.m3eImg && i++ < 32) applyCardColor(c);
        }
    }
    const schedulePrewarm = (delay = 350) => {
        if (document.documentElement.dataset.m3ePlus !== "1") return;
        clearTimeout(prewarmTimer);
        prewarmTimer = setTimeout(prewarmExpressiveCards, delay);
    };
    if (Spicetify.Platform?.History?.listen) {
        Spicetify.Platform.History.listen(() => schedulePrewarm(450));
    }
    setTimeout(prewarmExpressiveCards, 900);
    setTimeout(prewarmExpressiveCards, 2000);
    setTimeout(prewarmExpressiveCards, 3800);
    const warmWait = setInterval(() => {
        if (document.querySelector(".view-homeShortcutsGrid-shortcut img")) {
            prewarmExpressiveCards();
            clearInterval(warmWait);
        }
    }, 600);
    setTimeout(() => clearInterval(warmWait), 12000);

    document.addEventListener("pointerover", (e) => {
        if (document.documentElement.dataset.m3ePlus !== "1") return;
        const card = e.target?.closest?.(".view-homeShortcutsGrid-shortcut, .main-card-card, [data-encore-id='card']");
        if (card) applyCardColor(card);
    }, { passive: true });

    function ensureCoreUiStyle() {
        if (document.getElementById("m3e-core-ui-style")) return;
        const st = document.createElement("style");
        st.id = "m3e-core-ui-style";
        st.textContent = `
            #m3e-settings-section,
            #m3e-style-row,
            #m3e-style-row .x-settings-secondColumn {
                overflow: visible !important;
            }
            .m3e-row-disabled {
                opacity: 0.44 !important;
                pointer-events: none !important;
                transition: opacity 0.2s ease !important;
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-wrapper {
                position: relative;
                display: inline-flex;
                align-items: center;
                width: 42px;
                height: 24px;
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-indicatorWrapper {
                position: relative;
                display: block;
                width: 42px;
                height: 24px;
                border-radius: 9999px;
                background-color: #535353;
                transition: background-color 0.2s ease;
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-indicator {
                position: absolute;
                top: 3px;
                left: 3px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: #ffffff;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-input:checked ~ .x-toggle-indicatorWrapper {
                background-color: #1ed760;
            }
            html[data-m3e-disabled="1"] #m3e-settings-section .x-toggle-input:checked ~ .x-toggle-indicatorWrapper .x-toggle-indicator {
                transform: translateX(18px);
            }
            .m3e-dd {
                position: relative;
                display: inline-block;
            }
            .m3e-dd-trigger {
                height: 36px;
                min-width: 190px;
                padding: 0 12px 0 14px;
                border-radius: 12px;
                border: 1px solid rgba(var(--spice-rgb-m3-outline-variant, 120, 120, 120), 0.55);
                background-color: var(--spice-m3-surface-high, #282828);
                color: var(--spice-m3-on-surface, #ffffff);
                font: inherit;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                cursor: pointer;
                transition: background-color 0.16s ease, border-color 0.16s ease;
            }
            .m3e-dd-trigger:hover:not(:disabled) {
                background-color: var(--spice-m3-surface-highest, #333333);
                border-color: rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.65);
            }
            .m3e-dd-trigger[aria-expanded="true"] {
                border-color: var(--spice-m3-primary, #b8cac5);
                background-color: var(--spice-m3-surface-highest, #333333);
            }
            .m3e-dd-chevron {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .m3e-dd-trigger[aria-expanded="true"] .m3e-dd-chevron {
                transform: rotate(180deg);
            }
            .m3e-dd-menu {
                position: absolute;
                top: calc(100% + 6px);
                right: 0;
                min-width: 215px;
                padding: 6px;
                border-radius: 16px;
                background-color: var(--spice-m3-surface-highest, #2e2e2e);
                border: 1px solid rgba(var(--spice-rgb-m3-outline-variant, 120, 120, 120), 0.45);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
                z-index: 9999;
                display: none;
                flex-direction: column;
                gap: 2px;
                transform-origin: top right;
            }
            .m3e-dd.is-open .m3e-dd-menu {
                display: flex;
                animation: m3eDdIn 0.16s cubic-bezier(0.2, 0, 0, 1);
            }
            @keyframes m3eDdIn {
                from { opacity: 0; transform: translateY(-4px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .m3e-dd-opt {
                width: 100%;
                border: none;
                border-radius: 10px;
                padding: 9px 12px;
                background: transparent;
                color: var(--spice-m3-on-surface, #ffffff);
                font: inherit;
                font-size: 13.5px;
                text-align: left;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                cursor: pointer;
                transition: background-color 0.14s ease, color 0.14s ease;
            }
            .m3e-dd-opt:hover {
                background-color: rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.12);
            }
            .m3e-dd-opt[aria-selected="true"] {
                background-color: rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.22);
                color: var(--spice-m3-primary, #b8cac5);
                font-weight: 600;
            }
            .m3e-dd-check {
                width: 16px;
                height: 16px;
                opacity: 0;
                flex-shrink: 0;
            }
            .m3e-dd-opt[aria-selected="true"] .m3e-dd-check {
                opacity: 1;
            }
            .m3e-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: rgba(0, 0, 0, 0.65);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: m3eFadeIn 0.16s ease;
            }
            @keyframes m3eFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            .m3e-modal-card {
                width: 100%;
                max-width: 400px;
                padding: 24px;
                border-radius: 24px;
                background-color: var(--spice-m3-surface-high, #242424);
                color: var(--spice-m3-on-surface, #ffffff);
                border: 1px solid rgba(var(--spice-rgb-m3-outline-variant, 120, 120, 120), 0.45);
                box-shadow: 0 20px 56px rgba(0, 0, 0, 0.65);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .m3e-modal-title {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                line-height: 1.25;
                color: var(--spice-m3-on-surface, #ffffff);
            }
            .m3e-modal-desc {
                margin: 0;
                font-size: 14px;
                line-height: 1.45;
                color: var(--spice-m3-on-surface-var, #b3b3b3);
            }
            .m3e-modal-actions {
                margin-top: 8px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .m3e-modal-btn {
                border: none;
                border-radius: 9999px;
                padding: 9px 18px;
                font: inherit;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease, background-color 0.15s ease;
            }
            .m3e-modal-btn:active {
                transform: scale(0.95);
            }
            .m3e-modal-btn-later {
                background-color: rgba(var(--spice-rgb-m3-outline-variant, 120, 120, 120), 0.25);
                color: var(--spice-m3-on-surface, #ffffff);
            }
            .m3e-modal-btn-later:hover {
                background-color: rgba(var(--spice-rgb-m3-outline-variant, 120, 120, 120), 0.4);
            }
            .m3e-modal-btn-now {
                background-color: var(--spice-m3-primary, #1db954);
                color: var(--spice-m3-on-primary, #000000);
            }
            .m3e-modal-btn-now:hover {
                opacity: 0.92;
                transform: scale(1.03);
            }
            html[data-m3e-borders="0"] .m3e-dd-trigger,
            html[data-m3e-borders="0"] .m3e-dd-trigger:hover:not(:disabled),
            html[data-m3e-borders="0"] .m3e-dd-trigger[aria-expanded="true"],
            html[data-m3e-borders="0"] .m3e-dd-menu,
            html[data-m3e-borders="0"] .m3e-modal-card {
                border-color: transparent !important;
            }
        `;
        document.head.appendChild(st);
    }

    const IS_RU = /^ru/i.test(Spicetify.Locale?.getLocale?.() || navigator.language || "");
    const STR = IS_RU ? {
        reloadTitle: "Перезагрузить Spotify?",
        reloadDesc: "Включение или отключение M3 Expressive вступит в силу после перезапуска интерфейса.",
        reloadLater: "Позже",
        reloadNow: "Перезагрузить",
        enableLabel: "Включить M3 Expressive",
        enableDesc: "Отключение вернёт стандартный вид Spotify после перезагрузки",
        trackLabel: "Цвета от обложки трека",
        trackOnDesc: "Интерфейс подстраивается под текущий трек",
        trackOffDesc: "Используется палитра системных обоев",
        plusDesc: "Подсветка плиток и карточек в цвет их обложки",
        bordersLabel: "Обводка интерфейса",
        bordersDesc: "Показывать тонкие рамки у карточек, панелей и кнопок",
        styleLabel: "Стиль палитры",
        styleDesc: "Задаёт яркость и контраст оттенков",
        styles: {
            tonal: "Сбалансированный",
            expressive: "Контрастный",
            vibrant: "Яркий",
            content: "Цвет обложки"
        },
        toastTrack: "Цвета: обложка трека",
        toastWallpaper: "Цвета: системные обои",
        toastPlusOn: "Expressive+ включён",
        toastPlusOff: "Expressive+ выключен",
        toastBordersOn: "Обводка интерфейса включена",
        toastBordersOff: "Обводка интерфейса выключена",
        toastStyle: "Стиль палитры: "
    } : {
        reloadTitle: "Reload Spotify?",
        reloadDesc: "Enabling or disabling M3 Expressive takes effect after reloading the interface.",
        reloadLater: "Reload later",
        reloadNow: "Reload now",
        enableLabel: "Enable M3 Expressive",
        enableDesc: "Disabling restores the default Spotify look after reload",
        trackLabel: "Dynamic track colors",
        trackOnDesc: "Match interface palette to the current track artwork",
        trackOffDesc: "Using system wallpaper palette",
        plusDesc: "Tint Home tiles and cards with their artwork",
        bordersLabel: "UI outlines",
        bordersDesc: "Show borders around cards, panels, and controls",
        styleLabel: "Palette style",
        styleDesc: "Controls accent saturation and contrast",
        styles: {
            tonal: "Balanced",
            expressive: "Contrast",
            vibrant: "Vibrant",
            content: "Cover match"
        },
        toastTrack: "Colors: track artwork",
        toastWallpaper: "Colors: system wallpaper",
        toastPlusOn: "Expressive+ enabled",
        toastPlusOff: "Expressive+ disabled",
        toastBordersOn: "UI outlines enabled",
        toastBordersOff: "UI outlines disabled",
        toastStyle: "Palette style: "
    };

    function showReloadModal() {
        ensureCoreUiStyle();
        document.getElementById("m3e-reload-modal")?.remove();

        const backdrop = document.createElement("div");
        backdrop.id = "m3e-reload-modal";
        backdrop.className = "m3e-modal-backdrop";
        backdrop.innerHTML = `
            <div class="m3e-modal-card" role="dialog" aria-modal="true" aria-labelledby="m3e-reload-title">
                <h3 id="m3e-reload-title" class="m3e-modal-title">${STR.reloadTitle}</h3>
                <p class="m3e-modal-desc">${STR.reloadDesc}</p>
                <div class="m3e-modal-actions">
                    <button type="button" class="m3e-modal-btn m3e-modal-btn-later">${STR.reloadLater}</button>
                    <button type="button" class="m3e-modal-btn m3e-modal-btn-now">${STR.reloadNow}</button>
                </div>
            </div>
        `;

        const close = () => {
            document.removeEventListener("keydown", onEsc);
            backdrop.remove();
        };
        const onEsc = (e) => { if (e.key === "Escape") close(); };

        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) close();
        });
        backdrop.querySelector(".m3e-modal-btn-later").addEventListener("click", close);
        backdrop.querySelector(".m3e-modal-btn-now").addEventListener("click", () => {
            window.location.reload();
        });
        document.addEventListener("keydown", onEsc);
        document.body.appendChild(backdrop);
    }

    if (!window.__m3eGlobalDdBound) {
        window.__m3eGlobalDdBound = true;
        document.addEventListener("click", (e) => {
            const dd = document.getElementById("m3e-style-dropdown");
            if (!dd || !dd.classList.contains("is-open")) return;
            if (!e.target?.closest?.("#m3e-style-dropdown")) {
                dd.classList.remove("is-open");
                dd.querySelector("#m3e-style-trigger")?.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            const dd = document.getElementById("m3e-style-dropdown");
            if (dd && dd.classList.contains("is-open")) {
                dd.classList.remove("is-open");
                dd.querySelector("#m3e-style-trigger")?.setAttribute("aria-expanded", "false");
            }
        });
    }

    function modeDescText(mode) {
        return mode === "track" ? STR.trackOnDesc : STR.trackOffDesc;
    }

    function tryInjectSettings() {
        if (document.getElementById("m3e-settings-section")) return true;
        let firstSec = null;
        const firstH2 = document.querySelector('[data-testid="settings-page"] h2');
        if (firstH2) {
            let cur = firstH2.parentElement;
            while (cur && cur.parentElement && cur.parentElement.tagName !== "MAIN" && cur.parentElement.children.length < 4) {
                cur = cur.parentElement;
            }
            if (cur && cur.parentElement && cur.parentElement.children.length >= 2) {
                firstSec = cur;
            }
        }
        if (!firstSec) {
            firstSec =
                document.querySelector(".x-settings-section:has([data-settings-row])") ||
                document.querySelector('[data-testid="settings-page"] h2, .x-settings-row')?.closest(".x-settings-section");
        }
        if (!firstSec || !firstSec.parentElement) return false;

        ensureCoreUiStyle();

        const themeEnabled = !getThemeDisabled();
        const mode = getMode();
        const isTrack = mode === "track";
        const subEnabled = themeEnabled && isTrack;
        const plusOn = getExpressivePlus();
        const bordersOn = getBordersEnabled();
        const curStyle = getPaletteStyle();

        const sec = document.createElement("div");
        sec.id = "m3e-settings-section";
        sec.className = "x-settings-section";

        const optionsHtml = Object.entries(STR.styles).map(([val, label]) => `
            <button type="button" class="m3e-dd-opt" role="option" data-value="${val}" aria-selected="${curStyle === val ? "true" : "false"}">
                <span>${label}</span>
                <svg class="m3e-dd-check" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>
            </button>
        `).join("");

        sec.innerHTML = `
            <div class="x-settings-headerContainer">
                <h2 class="encore-text encore-text-title-small" style="${themeEnabled ? "color: var(--spice-m3-primary, #b8cac5);" : ""}">M3 Expressive</h2>
            </div>
            <div class="x-settings-row" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-master-toggle" style="cursor: pointer;">
                        ${STR.enableLabel}
                    </label>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #b3b3b3);">
                        ${STR.enableDesc}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-master-toggle" type="checkbox" class="x-toggle-input" ${themeEnabled ? "checked" : ""}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-track-row" class="x-settings-row ${themeEnabled ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-track-mode-toggle" style="cursor: pointer;">
                        ${STR.trackLabel}
                    </label>
                    <span id="m3e-mode-desc" class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #b3b3b3);">
                        ${modeDescText(mode)}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-track-mode-toggle" type="checkbox" class="x-toggle-input" ${isTrack ? "checked" : ""} ${themeEnabled ? "" : "disabled"}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-plus-row" class="x-settings-row ${subEnabled ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-expressive-plus-toggle" style="cursor: pointer;">
                        Expressive+
                    </label>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #b3b3b3);">
                        ${STR.plusDesc}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-expressive-plus-toggle" type="checkbox" class="x-toggle-input" ${plusOn ? "checked" : ""} ${subEnabled ? "" : "disabled"}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-borders-row" class="x-settings-row ${themeEnabled ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-borders-toggle" style="cursor: pointer;">
                        ${STR.bordersLabel}
                    </label>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #b3b3b3);">
                        ${STR.bordersDesc}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-borders-toggle" type="checkbox" class="x-toggle-input" ${bordersOn ? "checked" : ""} ${themeEnabled ? "" : "disabled"}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-style-row" class="x-settings-row ${subEnabled ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <span class="encore-text encore-text-body-medium">
                        ${STR.styleLabel}
                    </span>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #b3b3b3);">
                        ${STR.styleDesc}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <div id="m3e-style-dropdown" class="m3e-dd">
                        <button type="button" id="m3e-style-trigger" class="m3e-dd-trigger" aria-haspopup="listbox" aria-expanded="false" ${subEnabled ? "" : "disabled"}>
                            <span id="m3e-style-trigger-text">${STR.styles[curStyle] || STR.styles.tonal}</span>
                            <svg class="m3e-dd-chevron" viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 5.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 1.06-1.06L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0z"/></svg>
                        </button>
                        <div class="m3e-dd-menu" role="listbox">${optionsHtml}</div>
                    </div>
                </div>
            </div>
        `;

        firstSec.parentElement.insertBefore(sec, firstSec);

        const masterToggle = sec.querySelector("#m3e-master-toggle");
        const trackRow = sec.querySelector("#m3e-track-row");
        const toggle = sec.querySelector("#m3e-track-mode-toggle");
        const desc = sec.querySelector("#m3e-mode-desc");
        const plusRow = sec.querySelector("#m3e-plus-row");
        const plusToggle = sec.querySelector("#m3e-expressive-plus-toggle");
        const bordersRow = sec.querySelector("#m3e-borders-row");
        const bordersToggle = sec.querySelector("#m3e-borders-toggle");
        const styleRow = sec.querySelector("#m3e-style-row");
        const dd = sec.querySelector("#m3e-style-dropdown");
        const ddTrigger = sec.querySelector("#m3e-style-trigger");
        const ddText = sec.querySelector("#m3e-style-trigger-text");

        const updateDependentState = () => {
            const on = masterToggle.checked;
            const trk = toggle.checked;
            const sub = on && trk;

            toggle.disabled = !on;
            trackRow.classList.toggle("m3e-row-disabled", !on);
            bordersToggle.disabled = !on;
            bordersRow.classList.toggle("m3e-row-disabled", !on);

            plusToggle.disabled = !sub;
            ddTrigger.disabled = !sub;
            plusRow.classList.toggle("m3e-row-disabled", !sub);
            styleRow.classList.toggle("m3e-row-disabled", !sub);
            if (!sub) {
                dd.classList.remove("is-open");
                ddTrigger.setAttribute("aria-expanded", "false");
            }
        };

        masterToggle.addEventListener("change", () => {
            const val = masterToggle.checked ? "0" : "1";
            try { localStorage.setItem(DISABLED_KEY, val); } catch {}
            updateDependentState();
            showReloadModal();
        });

        toggle.addEventListener("change", async () => {
            if (isThemeDisabled) return;
            const next = toggle.checked ? "track" : "impulse";
            saveMode(next);
            desc.textContent = modeDescText(next);
            updateDependentState();
            syncPlusState();
            if (next === "track") {
                await applyTrackPalette();
                Spicetify.showNotification(STR.toastTrack, false, 1200);
            } else {
                clearTrackOverrides();
                Spicetify.showNotification(STR.toastWallpaper, false, 1200);
            }
        });

        plusToggle.addEventListener("change", () => {
            if (isThemeDisabled) return;
            saveExpressivePlus(plusToggle.checked);
            syncPlusState();
            Spicetify.showNotification(
                plusToggle.checked ? STR.toastPlusOn : STR.toastPlusOff,
                false,
                1200
            );
        });

        bordersToggle.addEventListener("change", () => {
            if (isThemeDisabled) return;
            saveBordersEnabled(bordersToggle.checked);
            syncBordersState();
            Spicetify.showNotification(
                bordersToggle.checked ? STR.toastBordersOn : STR.toastBordersOff,
                false,
                1200
            );
        });

        ddTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            if (ddTrigger.disabled) return;
            const open = dd.classList.toggle("is-open");
            ddTrigger.setAttribute("aria-expanded", open ? "true" : "false");
        });

        dd.querySelectorAll(".m3e-dd-opt").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const val = btn.dataset.value;
                const label = STR.styles[val] || val;
                savePaletteStyle(val);
                ddText.textContent = label;
                dd.querySelectorAll(".m3e-dd-opt").forEach((o) => {
                    o.setAttribute("aria-selected", o === btn ? "true" : "false");
                });
                dd.classList.remove("is-open");
                ddTrigger.setAttribute("aria-expanded", "false");
                if (!isThemeDisabled && getMode() === "track") {
                    await applyTrackPalette();
                }
                Spicetify.showNotification(STR.toastStyle + label, false, 1200);
            });
        });

        return true;
    }

    let settingsTimer = null;
    window.__m3eTryInjectSettings = tryInjectSettings;
    function scheduleSettingsInject() {
        if (settingsTimer) return;
        settingsTimer = setTimeout(() => {
            settingsTimer = null;
            tryInjectSettings();
        }, 120);
    }

    const mainView = document.querySelector(".Root__main-view") || document.body;
    const obs = new MutationObserver(() => {
        const path = Spicetify.Platform?.History?.location?.pathname || "";
        if (path && path !== "/preferences") return;
        if (!document.getElementById("m3e-settings-section") && document.querySelector('[data-testid="settings-page"] h2, .x-settings-row')) {
            scheduleSettingsInject();
        }
    });
    obs.observe(mainView, { childList: true, subtree: true });

    if (Spicetify.Platform?.History?.listen) {
        Spicetify.Platform.History.listen(() => scheduleSettingsInject());
    }
    scheduleSettingsInject();

    Spicetify.Player.addEventListener("songchange", () => {
        if (isThemeDisabled) return;
        const pb = document.querySelector(".main-nowPlayingBar-center .playback-bar");
        if (pb) {
            pb.classList.add("m3-instant");
            setTimeout(() => pb.classList.remove("m3-instant"), 150);
        }
        if (getMode() === "track") applyTrackPalette();
        if (document.documentElement.dataset.m3ePlus === "1") setTimeout(tintPlayingShortcuts, 250);
    });

    async function applyInitialTrackPalette() {
        for (let i = 0; i < 30; i++) {
            if (getMode() !== "track") return;
            if (Spicetify.Player.data?.item) {
                await applyTrackPalette();
                return;
            }
            await new Promise((r) => setTimeout(r, 400));
        }
    }

    if (!isThemeDisabled) {
        syncPlusState();
        syncBordersState();
        if (getMode() === "track") applyInitialTrackPalette();
    }
})();

// Trigger initial layout repaint
if (localStorage.getItem("m3e_theme_disabled") !== "1") {
    setTimeout(() => window.dispatchEvent(new Event("resize")), 400);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 1200);
}

// Snap progress bar on window focus and seek
(() => {
    if (localStorage.getItem("m3e_theme_disabled") === "1") return;
    const snapProgress = () => {
        const pb = document.querySelector(".main-nowPlayingBar-center .playback-bar");
        if (!pb) return;
        pb.classList.add("m3-instant");
        clearTimeout(pb._m3SnapTimer);
        pb._m3SnapTimer = setTimeout(() => pb.classList.remove("m3-instant"), 220);
    };
    window.addEventListener("focus", snapProgress);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") snapProgress();
    });
    document.addEventListener("pointerdown", (e) => {
        if (e.target?.closest?.(".playback-bar")) snapProgress();
    }, true);
})();

// Hide upsell, Support, Report and disabled Download items in menus
(() => {
    if (localStorage.getItem("m3e_theme_disabled") === "1") return;
    const HIDE_MENU_RE = /^(Upgrade to Premium|Перейти на Premium|Улучшить до Premium|Support|Справка|Поддержка|Report|Пожаловаться)$/i;
    const DL_RE = /^(Download|Скачать)$/i;

    const cleanMenus = (root) => {
        if (!root || root.nodeType !== 1) return;
        const menus = root.matches?.('[role="menu"]')
            ? [root]
            : Array.from(root.querySelectorAll?.('[role="menu"]') || []);
        for (const menu of menus) {
            for (const item of menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="link"], [class*="-menu-row"], a, button')) {
                const txt = (item.textContent || "").replace(/\s+/g, " ").trim();
                const aria = (item.getAttribute?.("aria-label") || "").trim();
                const href = item.getAttribute?.("href") || "";
                const isDisabled =
                    item.matches('[aria-disabled="true"], [data-disabled], [data-disabled="true"], :disabled, .QJhiFHy4PAK8GKZ6QM4g') ||
                    !!item.closest('[aria-disabled="true"], [data-disabled], [data-disabled="true"], .QJhiFHy4PAK8GKZ6QM4g') ||
                    item.hasAttribute("disabled") ||
                    parseFloat(getComputedStyle(item).opacity) < 0.75 ||
                    (item.firstElementChild ? parseFloat(getComputedStyle(item.firstElementChild).opacity) < 0.75 : false);
                const isDisabledDownload = isDisabled && (DL_RE.test(txt) || DL_RE.test(aria));
                if (HIDE_MENU_RE.test(txt) || isDisabledDownload || /support\.spotify\.com|campaign=upgrade/i.test(href)) {
                    const row = item.closest('li, .main-contextMenu-menuItem, [role="menuitem"], [role="menuitemcheckbox"], [role="link"], [class*="-menu-row"]') || item;
                    row.style.setProperty("display", "none", "important");
                }
            }
        }
    };

    const menuObs = new MutationObserver((muts) => {
        const menus = new Set();
        for (const m of muts) {
            const t = m.target;
            if (!t || t.nodeType !== 1) continue;
            const insideMenu = t.closest?.('[role="menu"]');
            if (insideMenu) {
                menus.add(insideMenu);
                continue;
            }
            if (t.closest?.('#main') && !t.closest?.('[data-encore-id="popover"], #context-menu, [data-tippy-root]')) continue;
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (n.matches?.('[role="menu"]')) menus.add(n);
                else n.querySelectorAll?.('[role="menu"]').forEach((menu) => menus.add(menu));
            }
        }
        for (const menu of menus) {
            cleanMenus(menu);
            setTimeout(() => cleanMenus(menu), 80);
        }
    });
    menuObs.observe(document.body, { childList: true, subtree: true });
})();

// Recolor Spotify green DJ accents to theme primary
(() => {
    if (localStorage.getItem("m3e_theme_disabled") === "1") return;
    const GREEN_RE = /rgba?\(\s*(?:29,\s*185,\s*84|30,\s*215,\s*96|31,\s*223,\s*100|25,\s*230,\s*140|26,\s*188,\s*84|59,\s*228,\s*119)(?:\s*,\s*[\d.]+)?\s*\)|#(?:1db954|1ed760|1fdf64|19e68c|1abc54|3be477)(?:[0-9a-f]{2})?/i;
    const isTranslucent = (val, opacityAttr) => {
        if (opacityAttr && parseFloat(opacityAttr) < 0.9) return true;
        if (/rgba\(/i.test(val)) {
            const m = val.match(/,\s*([\d.]+)\s*\)/);
            if (m && parseFloat(m[1]) < 0.9) return true;
        }
        return /^#[0-9a-f]{8}$/i.test(val.trim());
    };

    const recolorDj = () => {
        const bar = document.querySelector(".main-nowPlayingBar-right");
        if (!bar) return;
        for (const el of bar.querySelectorAll("button, button div, button span, button svg, button path, button circle, button ellipse, button rect")) {
            const btn = el.tagName === "BUTTON" ? el : el.closest("button");
            const isDjBtn = btn && (/dj/i.test(btn.getAttribute("aria-label") || "") || /dj/i.test(btn.getAttribute("data-testid") || ""));
            if (isDjBtn) btn.classList.add("m3e-dj-btn");

            const aStroke = el.getAttribute?.("stroke") || "";
            const aFill   = el.getAttribute?.("fill") || "";
            const aFillOp = el.getAttribute?.("fill-opacity") || "";
            let hit = false;

            if (GREEN_RE.test(aStroke)) {
                el.style.setProperty("stroke", "var(--spice-m3-primary, #b8cac5)", "important");
                hit = true;
            }
            if (GREEN_RE.test(aFill)) {
                const fillVal = isTranslucent(aFill, aFillOp)
                    ? "rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.18)"
                    : "var(--spice-m3-primary, #b8cac5)";
                el.style.setProperty("fill", fillVal, "important");
                hit = true;
            }

            const cs = getComputedStyle(el);
            if (GREEN_RE.test(cs.color)) {
                el.style.setProperty("color", "var(--spice-m3-primary, #b8cac5)", "important");
                hit = true;
            }
            if (GREEN_RE.test(cs.fill)) {
                const fillVal = isTranslucent(cs.fill, cs.fillOpacity)
                    ? "rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.18)"
                    : "var(--spice-m3-primary, #b8cac5)";
                el.style.setProperty("fill", fillVal, "important");
                hit = true;
            }
            if (GREEN_RE.test(cs.stroke)) {
                el.style.setProperty("stroke", "var(--spice-m3-primary, #b8cac5)", "important");
                hit = true;
            }
            if (GREEN_RE.test(cs.backgroundColor) || GREEN_RE.test(cs.backgroundImage)) {
                if (el.tagName === "BUTTON") {
                    el.style.setProperty("background-color", "rgba(var(--spice-rgb-m3-primary, 184, 202, 197), 0.20)", "important");
                    el.style.setProperty("background-image", "none", "important");
                } else {
                    el.style.setProperty("background-color", "transparent", "important");
                    el.style.setProperty("background-image", "none", "important");
                }
                hit = true;
            }
            if (hit && btn) btn.classList.add("m3e-dj-btn");
        }
    };

    let djTimer = null;
    const scheduleDj = () => {
        if (djTimer) return;
        djTimer = setTimeout(() => { djTimer = null; recolorDj(); }, 120);
    };

    const waitBar = setInterval(() => {
        const bar = document.querySelector(".main-nowPlayingBar-right");
        if (!bar) return;
        clearInterval(waitBar);
        recolorDj();
        bar.addEventListener("pointerenter", scheduleDj, true);
        new MutationObserver(scheduleDj).observe(bar, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "aria-pressed", "aria-checked"] });
    }, 400);

    if (window.Spicetify?.Player) {
        Spicetify.Player.addEventListener("songchange", () => setTimeout(recolorDj, 180));
    }
})();

// DOM class bridge for unmapped Spotify builds (Linux & future updates)
(() => {
    if (localStorage.getItem("m3e_theme_disabled") === "1") return;

    const addCls = (el, cls) => {
        if (el && !el.classList.contains(cls)) el.classList.add(cls);
    };

    const ensureBridgeStyle = () => {
        if (document.getElementById("m3e-bridge-fallback")) return;
        const st = document.createElement("style");
        st.id = "m3e-bridge-fallback";
        st.textContent = `
            :where(#m3e-settings-section.x-settings-section) { display: grid; gap: 8px; }
            :where(#m3e-settings-section .x-settings-headerContainer) { display: flex; align-items: center; }
            :where(#m3e-settings-section .x-settings-row) { display: grid; grid-template-columns: 2fr 1fr; gap: 8px 24px; padding-block: 8px; align-items: center; }
            :where(#m3e-settings-section .x-settings-firstColumn) { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
            :where(#m3e-settings-section .x-settings-secondColumn) { display: flex; justify-content: flex-end; align-items: center; position: relative; }
            :where(#m3e-settings-section .x-toggle-wrapper) { display: inline-flex; align-items: center; position: relative; }
            :where(#m3e-settings-section .x-toggle-input) { opacity: 0; pointer-events: none; position: absolute; }
            :where(#m3e-settings-section .x-toggle-indicatorWrapper) { width: 42px; height: 24px; border-radius: 24px; position: relative; display: block; }
            :where(#m3e-settings-section .x-toggle-indicator) { width: 20px; height: 20px; border-radius: 50%; position: absolute; top: 2px; left: 2px; display: block; }
            :where(#m3e-settings-section input:checked ~ .x-toggle-indicatorWrapper .x-toggle-indicator) { left: auto; right: 2px; }
        `;
        document.head.appendChild(st);
    };

    const syncProgress = (scope) => {
        if (!scope) return;
        addCls(scope.querySelector('[data-testid="progress-bar"]'), "progress-bar");
        const bg = scope.querySelector('[data-testid="progress-bar-background"]');
        if (bg) {
            addCls(bg, "x-progressBar-progressBarBg");
            const areas = bg.querySelectorAll(".x-progressBar-sliderArea");
            if (areas.length === 0) {
                const divs = Array.from(bg.children).filter((c) => c.tagName === "DIV" && c.children.length > 0);
                if (divs.length >= 2) {
                    addCls(divs[0].firstElementChild, "x-progressBar-progressFillColor");
                    addCls(divs[divs.length - 1].firstElementChild, "x-progressBar-fillColor");
                } else if (divs.length === 1) {
                    const ch = divs[0].children;
                    if (ch.length >= 2) {
                        addCls(ch[0], "x-progressBar-progressFillColor");
                        addCls(ch[ch.length - 1], "x-progressBar-fillColor");
                    } else if (ch.length === 1) {
                        addCls(ch[0], "x-progressBar-fillColor");
                    }
                }
            }
        }
        addCls(scope.querySelector('[data-testid="progress-bar-handle"]'), "progress-bar__slider");
    };

    const syncAll = () => {
        ensureBridgeStyle();

        const aside = document.querySelector('[data-testid="now-playing-bar"]');
        if (aside) {
            addCls(aside, "main-nowPlayingBar-container");
            const npbSlot = aside.parentElement;
            addCls(npbSlot, "Root__now-playing-bar");
            const top = npbSlot?.parentElement;
            if (top) {
                addCls(top, "Root__top-container");
                for (const ch of top.children) {
                    if (ch === npbSlot) continue;
                    if (ch.querySelector('main, [role="main"], [data-testid="home-page"], [data-testid="settings-page"]')) {
                        addCls(ch, "Root__main-view");
                        ch.classList.remove("Root__globalNav");
                    } else if (ch.querySelector('[data-testid="left-sidebar-footer"], #Desktop_LeftSidebar_Id')) {
                        addCls(ch, "Root__nav-bar");
                    } else if (ch.querySelector('#Desktop_PanelContainer_Id, [data-testid="NPV_Panel_OpenDiv"], aside:not([data-testid="now-playing-bar"])')) {
                        addCls(ch, "Root__right-sidebar");
                    } else if (ch.querySelector('[data-testid="global-nav-bar"], [data-testid="user-widget-link"], [aria-label*="Marketplace" i]')) {
                        addCls(ch, "Root__globalNav");
                    }
                }
            }
        }

        const controls = document.querySelector('[data-testid="player-controls"]');
        if (controls) {
            const center = controls.parentElement;
            addCls(center, "main-nowPlayingBar-center");
            const inner = center?.parentElement;
            if (inner) {
                addCls(inner, "main-nowPlayingBar-nowPlayingBar");
                if (inner.firstElementChild && inner.firstElementChild !== center) addCls(inner.firstElementChild, "main-nowPlayingBar-left");
                if (inner.lastElementChild && inner.lastElementChild !== center) addCls(inner.lastElementChild, "main-nowPlayingBar-right");
            }
        }

        const pbWrap = document.querySelector('[data-testid="playback-progressbar"]');
        if (pbWrap) {
            addCls(pbWrap, "playback-progressbar");
            let p = pbWrap.parentElement;
            for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
                if (p.querySelector('[data-testid="playback-position"]') || p.querySelector('[data-testid="playback-duration"]')) {
                    addCls(p, "playback-bar");
                    break;
                }
            }
            syncProgress(pbWrap);
        }

        const vol = document.querySelector('[data-testid="volume-bar"]');
        if (vol) {
            addCls(vol, "main-nowPlayingBar-volumeBar");
            syncProgress(vol);
        }

        const mainView = document.querySelector(".Root__main-view");
        if (mainView) {
            for (const d of mainView.querySelectorAll('div[style*="background-color"]:not(.main-home-homeHeader)')) {
                if (d.dataset.m3eHdrChecked) continue;
                d.dataset.m3eHdrChecked = "1";
                const cs = getComputedStyle(d);
                if (cs.position === "absolute" && cs.backgroundImage && cs.backgroundImage.includes("linear-gradient")) {
                    const rect = d.getBoundingClientRect();
                    if (rect.height >= 120 && rect.height <= 460 && rect.width > 300) {
                        addCls(d, "main-home-homeHeader");
                    }
                }
            }

            const homeChip = mainView.querySelector('button[role="checkbox"]:not(.m3e-chip-checked), [data-encore-id="chip"]:not(.m3e-chip-checked)');
            if (homeChip) {
                addCls(homeChip, "m3e-chip-checked");
                const chipGroup = homeChip.closest('[class*="chip-group"]');
                if (chipGroup) addCls(chipGroup, "m3e-home-chips-row");
                if (!mainView.querySelector(".main-home-filterChipsContainer")) {
                    let cur = homeChip.parentElement;
                    while (cur && cur !== mainView) {
                        const pos = getComputedStyle(cur).position;
                        if (pos === "sticky" || pos === "fixed") {
                            addCls(cur, "main-home-filterChipsContainer");
                            const backdrop = cur.firstElementChild;
                            if (backdrop && getComputedStyle(backdrop).position === "absolute") {
                                addCls(backdrop, "main-home-filterChipsSection");
                            }
                            break;
                        }
                        cur = cur.parentElement;
                    }
                }
            }

            for (const a of mainView.querySelectorAll('section[data-testid="component-shelf"] > div:first-child a:not(.main-shelf-seeAll)')) {
                const href = a.getAttribute("href") || "";
                if (/\/(section|recents|discography|related)\b/.test(href) && !a.closest("h1, h2")) {
                    addCls(a, "main-shelf-seeAll");
                }
            }
        }

        const navBar = document.querySelector(".Root__nav-bar");
        if (navBar) {
            for (const item of navBar.querySelectorAll('[role="listitem"]:not(.main-yourLibraryX-listItem)')) {
                addCls(item, "main-yourLibraryX-listItem");
                const isArtist =
                    !!item.querySelector('[class*="circular" i], [class*="circle" i]') ||
                    !!item.querySelector('[aria-labelledby*="spotify:artist:"], [id*="spotify:artist:"]') ||
                    (!!item.querySelector('[aria-labelledby*="spotify:user:"], [id*="spotify:user:"]') &&
                     !item.querySelector('[aria-labelledby*=":playlist:"], [aria-labelledby*=":collection"], [id*=":playlist:"], [id*=":collection"]'));
                if (isArtist) addCls(item, "m3e-circle-art");
            }
        }

        const rightBar = document.querySelector(".Root__right-sidebar");
        if (rightBar) {
            for (const sec of rightBar.querySelectorAll(".main-nowPlayingView-section")) {
                if (sec.querySelector('[data-testid*="lyrics" i], [class*="lyrics" i]')) {
                    addCls(sec, "m3e-lyrics-card");
                }
            }
        }

        const settingsPage = document.querySelector('[data-testid="settings-page"]');
        if (settingsPage) {
            if (!document.getElementById("m3e-settings-section")) window.__m3eTryInjectSettings?.();
            for (const h2 of settingsPage.querySelectorAll("h2")) {
                if (h2.closest("#m3e-settings-section")) continue;
                const sec = h2.parentElement;
                if (sec && sec.parentElement && sec.parentElement.children.length >= 4) {
                    addCls(sec, "x-settings-section");
                }
            }
            for (const inp of settingsPage.querySelectorAll('input[type="checkbox"]')) {
                if (inp.closest("#m3e-settings-section")) continue;
                addCls(inp, "x-toggle-input");
                const lbl = inp.closest("label");
                if (lbl) {
                    addCls(lbl, "x-toggle-wrapper");
                    const indWrap = inp.nextElementSibling;
                    if (indWrap) {
                        addCls(indWrap, "x-toggle-indicatorWrapper");
                        addCls(indWrap.firstElementChild, "x-toggle-indicator");
                    }
                    const col2 = lbl.parentElement;
                    addCls(col2, "x-settings-secondColumn");
                    addCls(col2?.previousElementSibling, "x-settings-firstColumn");
                    const row = col2?.parentElement;
                    if (row) {
                        addCls(row, "x-settings-row");
                        if (!row.hasAttribute("data-settings-row")) row.setAttribute("data-settings-row", "true");
                    }
                }
            }
            for (const sel of settingsPage.querySelectorAll("select")) {
                if (sel.closest("#m3e-settings-section")) continue;
                addCls(sel, "main-dropDown-dropDown");
                const col2 = sel.parentElement;
                addCls(col2, "x-settings-secondColumn");
                addCls(col2?.previousElementSibling, "x-settings-firstColumn");
                const row = col2?.parentElement;
                if (row) {
                    addCls(row, "x-settings-row");
                    if (!row.hasAttribute("data-settings-row")) row.setAttribute("data-settings-row", "true");
                }
            }
        }

        for (const c of document.querySelectorAll('[data-encore-id="card"]:not(.main-card-card)')) {
            addCls(c, "main-card-card");
            const pb = c.querySelector('[data-testid="play-button"], button[data-encore-id="buttonPrimary"][data-is-icon-only="true"]');
            if (pb) {
                const wrap = pb.tagName === "BUTTON" ? pb.parentElement : pb;
                addCls(wrap, "main-playButton-PlayButton");
                const slot = wrap?.parentElement;
                if (slot && slot !== c && getComputedStyle(slot).position === "absolute") {
                    addCls(slot, "main-card-PlayButtonContainer");
                }
            }
        }
        for (const img of document.querySelectorAll('[data-testid="card-image"]:not(.main-cardImage-image)')) {
            addCls(img, "main-cardImage-image");
            const imgWrap = img.parentElement;
            addCls(imgWrap, "main-cardImage-imageWrapper");
            const imgContainer = imgWrap?.parentElement;
            if (imgContainer) {
                addCls(imgContainer, "main-card-imageContainer");
                const playBtn = imgContainer.querySelector('[data-testid="play-button"], button[data-encore-id="buttonPrimary"][data-is-icon-only="true"]');
                if (playBtn) {
                    const wrap = playBtn.tagName === "BUTTON" ? playBtn.parentElement : playBtn;
                    addCls(wrap, "main-playButton-PlayButton");
                    if (wrap?.parentElement && wrap.parentElement !== imgContainer) {
                        addCls(wrap.parentElement, "main-card-PlayButtonContainer");
                    }
                }
            }
            const card = img.closest('[role="group"], [draggable="true"], [data-encore-id="card"]') || imgContainer?.parentElement?.parentElement;
            if (card && !card.matches('[data-testid="shortcut-card"]')) {
                addCls(card, "main-card-card");
            }
        }

        for (const el of document.querySelectorAll('[data-testid="play-button"], button[data-encore-id="buttonPrimary"][data-is-icon-only="true"]:not([data-testid="control-button-playpause"])')) {
            addCls(el.tagName === "BUTTON" ? el.parentElement : el, "main-playButton-PlayButton");
        }
        for (const el of document.querySelectorAll('[data-testid="tracklist-row"]:not(.main-trackList-trackListRow)')) addCls(el, "main-trackList-trackListRow");
        for (const el of document.querySelectorAll('[data-testid="shortcut-card"]:not(.view-homeShortcutsGrid-shortcut)')) addCls(el, "view-homeShortcutsGrid-shortcut");

        for (const card of document.querySelectorAll(".e6ssqE0uX8qNAFRRz8rV:not(.m3e-wn-ready)")) {
            addCls(card, "m3e-wn-ready");
            const kids = Array.from(card.children);
            const mediaEl = card.querySelector(".W0HxH4qBfxlGF8ihq8ex, .AMNaKvCRDGoAyl4ltPZg");
            const mediaSlot = mediaEl ? kids.find((ch) => ch.contains(mediaEl)) : null;
            if (mediaSlot) addCls(mediaSlot, "m3e-wn-media");

            const titleEl = card.querySelector("h3, [data-testid='listRowTitle']");
            const headerSlot = titleEl ? kids.find((ch) => ch.contains(titleEl)) : null;
            if (headerSlot) addCls(headerSlot, "m3e-wn-header");

            const bodyEl = card.querySelector(".gIS5JUiTKLNmvZGDu3ei, .jg8minRucYgGRfA_3Hz1");
            const bodySlot = bodyEl ? kids.find((ch) => ch.contains(bodyEl)) : null;
            if (bodySlot) addCls(bodySlot, "m3e-wn-body");

            const footerEl = card.querySelector(".unqqrJbT4kC4bCvEjysi");
            const footerSlot = footerEl ? kids.find((ch) => ch.contains(footerEl)) : null;
            if (footerSlot) addCls(footerSlot, "m3e-wn-footer");
        }
    };

    let timer = null;
    const schedule = () => {
        if (timer) return;
        timer = setTimeout(() => { timer = null; syncAll(); }, 100);
    };

    let bootTries = 0;
    const boot = setInterval(() => {
        syncAll();
        const root = document.getElementById("main");
        if ((root && document.querySelector('[data-testid="now-playing-bar"]')) || ++bootTries >= 25) {
            clearInterval(boot);
            new MutationObserver((muts) => {
                for (const m of muts) {
                    const t = m.target;
                    if (t && t.nodeType === 1 && !t.closest?.('[data-testid="playback-position"], [data-testid="playback-progressbar"], .playback-bar')) {
                        schedule();
                        break;
                    }
                }
            }).observe(root || document.body, { childList: true, subtree: true });
            window.dispatchEvent(new Event("resize"));
        }
    }, 200);
})();

// Instant Play/Pause shape intent during Spotify audio fade-out
(() => {
    if (localStorage.getItem("m3e_theme_disabled") === "1") return;
    let clearTimer = null;

    document.addEventListener("click", (e) => {
        const btn = e.target?.closest?.('[data-testid="control-button-playpause"]');
        if (!btn) return;

        const isCurrentlyPlaying =
            btn.classList.contains("m3e-intent-playing") ||
            (!btn.classList.contains("m3e-intent-paused") && /Pause|Пауз/i.test(btn.getAttribute("aria-label") || ""));

        btn.classList.toggle("m3e-intent-paused", isCurrentlyPlaying);
        btn.classList.toggle("m3e-intent-playing", !isCurrentlyPlaying);

        clearTimeout(clearTimer);
        clearTimer = setTimeout(() => {
            btn.classList.remove("m3e-intent-paused", "m3e-intent-playing");
        }, 900);
    }, true);
})();
