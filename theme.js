(async function M3ExpressiveTheme() {
    while (!window.Spicetify?.Player) {
        await new Promise((r) => setTimeout(r, 250));
    }

    const STORAGE_KEY = "m3e_color_mode"; // "impulse" | "track"
    const STYLE_KEY = "m3e_palette_style"; // "tonal" | "expressive" | "vibrant" | "content"
    const VARS = [
        "--spice-m3-surface", "--spice-m3-surface-lowest", "--spice-m3-surface-low",
        "--spice-m3-surface-container", "--spice-m3-surface-high", "--spice-m3-surface-highest",
        "--spice-m3-primary", "--spice-m3-on-primary", "--spice-m3-primary-container",
        "--spice-m3-on-primary-cont", "--spice-m3-secondary-cont", "--spice-m3-on-secondary-cont",
        "--spice-m3-tertiary", "--spice-m3-outline", "--spice-m3-outline-variant",
        "--spice-m3-on-surface", "--spice-m3-on-surface-var",
        "--spice-rgb-m3-primary", "--spice-rgb-m3-secondary-cont",
        "--spice-rgb-m3-outline", "--spice-rgb-m3-outline-variant",
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
            bgH = (h + 325) % 360;   // сдвиг оттенка поверхности -35° как в Android 16 Expressive
            secH = (h + 35) % 360;   // контрастные контейнеры +35°
            tertH = (h + 120) % 360;
        } else if (style === "content") {
            sat = Math.max(12, Math.min(94, rawS));
            bgSat = Math.min(32, Math.max(4, Math.round(rawS * 0.34)));
        } else {
            // tonal (стандарт Google)
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
        if (document.documentElement.dataset.m3ePlus !== "1") return;
        const activeCards = document.querySelectorAll(
            '.view-homeShortcutsGrid-shortcut:has([aria-label*="Pause" i], [aria-label*="Пауз" i], [aria-pressed="true"]), ' +
            '.main-card-card:has([aria-label*="Pause" i], [aria-label*="Пауз" i], [aria-pressed="true"])'
        );
        activeCards.forEach((c) => applyCardColor(c));
    }

    document.addEventListener("pointerover", (e) => {
        if (document.documentElement.dataset.m3ePlus !== "1") return;
        const card = e.target?.closest?.(".view-homeShortcutsGrid-shortcut, .main-card-card");
        if (card) applyCardColor(card);
    }, { passive: true });

    function modeDescText(mode) {
        return mode === "track"
            ? "Интерфейс подстраивается под текущий трек"
            : "Используется палитра системных обоев";
    }

    function tryInjectSettings() {
        if (document.getElementById("m3e-settings-section")) return true;
        const firstSec =
            document.querySelector(".x-settings-section:has([data-settings-row])") ||
            document.querySelector(".x-settings-row")?.closest(".x-settings-section");
        if (!firstSec || !firstSec.parentElement) return false;

        const mode = getMode();
        const isTrack = mode === "track";
        const plusOn = getExpressivePlus();
        const curStyle = getPaletteStyle();
        const sec = document.createElement("div");
        sec.id = "m3e-settings-section";
        sec.className = "x-settings-section";

        sec.innerHTML = `
            <div class="x-settings-headerContainer">
                <h2 class="encore-text encore-text-title-small" style="color: var(--spice-m3-primary, #b8cac5);">M3 Expressive</h2>
            </div>
            <div class="x-settings-row" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-track-mode-toggle" style="cursor: pointer;">
                        Цвета от обложки трека
                    </label>
                    <span id="m3e-mode-desc" class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #c7c6c5);">
                        ${modeDescText(mode)}
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-track-mode-toggle" type="checkbox" class="x-toggle-input" ${isTrack ? "checked" : ""}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-plus-row" class="x-settings-row ${isTrack ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-expressive-plus-toggle" style="cursor: pointer;">
                        Expressive+
                    </label>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #c7c6c5);">
                        Подсветка плиток и карточек в цвет их обложки
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper" style="cursor: pointer;">
                        <input id="m3e-expressive-plus-toggle" type="checkbox" class="x-toggle-input" ${plusOn ? "checked" : ""} ${isTrack ? "" : "disabled"}>
                        <span class="x-toggle-indicatorWrapper">
                            <span class="x-toggle-indicator"></span>
                        </span>
                    </label>
                </div>
            </div>
            <div id="m3e-style-row" class="x-settings-row ${isTrack ? "" : "m3e-row-disabled"}" data-settings-row="true">
                <div class="x-settings-firstColumn qWhdBLUR95jKDvG8ScyT">
                    <label class="encore-text encore-text-body-medium" for="m3e-style-select">
                        Стиль палитры
                    </label>
                    <span class="encore-text encore-text-body-small" style="color: var(--spice-m3-on-surface-var, #c7c6c5);">
                        Задаёт яркость и контраст оттенков
                    </span>
                </div>
                <div class="x-settings-secondColumn">
                    <select id="m3e-style-select" class="main-dropDown-dropDown" ${isTrack ? "" : "disabled"}>
                        <option value="tonal" ${curStyle === "tonal" ? "selected" : ""}>Сбалансированный</option>
                        <option value="expressive" ${curStyle === "expressive" ? "selected" : ""}>Контрастный</option>
                        <option value="vibrant" ${curStyle === "vibrant" ? "selected" : ""}>Яркий</option>
                        <option value="content" ${curStyle === "content" ? "selected" : ""}>Цвет обложки</option>
                    </select>
                </div>
            </div>
        `;

        firstSec.parentElement.insertBefore(sec, firstSec);

        const toggle = sec.querySelector("#m3e-track-mode-toggle");
        const desc = sec.querySelector("#m3e-mode-desc");
        const plusRow = sec.querySelector("#m3e-plus-row");
        const plusToggle = sec.querySelector("#m3e-expressive-plus-toggle");
        const styleRow = sec.querySelector("#m3e-style-row");
        const styleSelect = sec.querySelector("#m3e-style-select");

        const updateDependentState = (trackEnabled) => {
            plusToggle.disabled = !trackEnabled;
            styleSelect.disabled = !trackEnabled;
            plusRow.classList.toggle("m3e-row-disabled", !trackEnabled);
            styleRow.classList.toggle("m3e-row-disabled", !trackEnabled);
        };

        toggle.addEventListener("change", async () => {
            const next = toggle.checked ? "track" : "impulse";
            saveMode(next);
            desc.textContent = modeDescText(next);
            updateDependentState(next === "track");
            syncPlusState();
            if (next === "track") {
                await applyTrackPalette();
                Spicetify.showNotification("Цвета: обложка трека", false, 1200);
            } else {
                clearTrackOverrides();
                Spicetify.showNotification("Цвета: системные обои", false, 1200);
            }
        });

        plusToggle.addEventListener("change", () => {
            saveExpressivePlus(plusToggle.checked);
            syncPlusState();
            Spicetify.showNotification(
                plusToggle.checked ? "Expressive+ включён" : "Expressive+ выключен",
                false,
                1200
            );
        });

        styleSelect.addEventListener("change", async () => {
            savePaletteStyle(styleSelect.value);
            if (getMode() === "track") {
                await applyTrackPalette();
            }
            Spicetify.showNotification("Стиль палитры: " + styleSelect.options[styleSelect.selectedIndex].text, false, 1200);
        });

        return true;
    }

    let settingsTimer = null;
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
        if (!document.getElementById("m3e-settings-section") && document.querySelector(".x-settings-row")) {
            scheduleSettingsInject();
        }
    });
    obs.observe(mainView, { childList: true, subtree: true });

    if (Spicetify.Platform?.History?.listen) {
        Spicetify.Platform.History.listen(() => scheduleSettingsInject());
    }
    scheduleSettingsInject();

    Spicetify.Player.addEventListener("songchange", () => {
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

    syncPlusState();
    if (getMode() === "track") applyInitialTrackPalette();
})();

/* M3E_STARTUP_REPAINT */
setTimeout(() => window.dispatchEvent(new Event("resize")), 400);
setTimeout(() => window.dispatchEvent(new Event("resize")), 1200);

/* M3E_FOCUS_SNAP_START */
(() => {
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
/* M3E_FOCUS_SNAP_END */

/* M3E_PROFILE_MENU_CLEAN_START */
(() => {
    const HIDE_MENU_RE = /^(Upgrade to Premium|Перейти на Premium|Улучшить до Premium|Support|Справка|Поддержка)$/i;
    const cleanMenus = (root) => {
        if (!root || root.nodeType !== 1) return;
        const menus = root.matches?.('[role="menu"]')
            ? [root]
            : Array.from(root.querySelectorAll?.('[role="menu"]') || []);
        for (const menu of menus) {
            for (const item of menu.querySelectorAll('[role="menuitem"], a, button')) {
                const txt = (item.textContent || "").replace(/\s+/g, " ").trim();
                const href = item.getAttribute?.("href") || "";
                if (HIDE_MENU_RE.test(txt) || /support\.spotify\.com|campaign=upgrade/i.test(href)) {
                    const row = item.closest("li, .main-contextMenu-menuItem") || item;
                    row.style.setProperty("display", "none", "important");
                }
            }
        }
    };

    const menuObs = new MutationObserver((muts) => {
        for (const m of muts) {
            const t = m.target;
            if (t !== document.body && !t.closest?.('#context-menu, [data-tippy-root], [role="menu"]')) continue;
            for (const n of m.addedNodes) {
                if (n.nodeType === 1 && (n.matches?.('[role="menu"]') || n.querySelector?.('[role="menu"]'))) {
                    cleanMenus(n);
                }
            }
        }
    });
    menuObs.observe(document.body, { childList: true, subtree: true });
})();
/* M3E_PROFILE_MENU_CLEAN_END */

/* M3E_DJ_RECOLOR_START */
(() => {
    const GREEN_RE = /rgb\(\s*(?:29,\s*185,\s*84|30,\s*215,\s*96|31,\s*223,\s*100|25,\s*230,\s*140|26,\s*188,\s*84)\s*\)|#(?:1db954|1ed760|1fdf64|19e68c|1abc54)/i;
    const recolorDj = () => {
        const bar = document.querySelector(".main-nowPlayingBar-right");
        if (!bar) return;
        for (const el of bar.querySelectorAll("button, button span, button svg, button path, button circle")) {
            if (el.dataset?.m3eDj === "1" && el.tagName !== "BUTTON") continue;
            const aStroke = el.getAttribute?.("stroke") || "";
            const aFill   = el.getAttribute?.("fill") || "";
            if (GREEN_RE.test(aStroke)) { el.style.setProperty("stroke", "var(--spice-m3-primary, #b8cac5)", "important"); if (el.dataset) el.dataset.m3eDj = "1"; continue; }
            if (GREEN_RE.test(aFill))   { el.style.setProperty("fill",   "var(--spice-m3-primary, #b8cac5)", "important"); if (el.dataset) el.dataset.m3eDj = "1"; continue; }
            const cs = getComputedStyle(el);
            let hit = false;
            if (GREEN_RE.test(cs.color))  { el.style.setProperty("color",  "var(--spice-m3-primary, #b8cac5)", "important"); hit = true; }
            if (GREEN_RE.test(cs.fill))   { el.style.setProperty("fill",   "var(--spice-m3-primary, #b8cac5)", "important"); hit = true; }
            if (GREEN_RE.test(cs.stroke)) { el.style.setProperty("stroke", "var(--spice-m3-primary, #b8cac5)", "important"); hit = true; }
            if (hit && el.dataset) el.dataset.m3eDj = "1";
        }
    };

    let djTimer = null;
    const scheduleDj = () => {
        if (djTimer) return;
        djTimer = setTimeout(() => { djTimer = null; recolorDj(); }, 250);
    };

    const waitBar = setInterval(() => {
        const bar = document.querySelector(".main-nowPlayingBar-right");
        if (!bar) return;
        clearInterval(waitBar);
        recolorDj();
        new MutationObserver(scheduleDj).observe(bar, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-pressed", "aria-checked"] });
    }, 400);

    if (window.Spicetify?.Player) {
        Spicetify.Player.addEventListener("songchange", () => setTimeout(recolorDj, 180));
    }
})();
/* M3E_DJ_RECOLOR_END */