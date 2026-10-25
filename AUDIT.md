# Audit — zmanim-tonight (25 Oct 2026)

Scope: the whole repo at `59c4bdd` (main), as deployed to https://hereiszee.github.io/zmanim-tonight/.
Method: eight independent reviewers, one per dimension (astronomy, Hebrew calendar, PWA/offline,
security & privacy, accessibility & i18n, performance, code quality, embedded data), each finding
then challenged by two skeptics working from the code. 71 findings raised; 57 confirmed, 5 refuted,
9 left unverified by the panel and checked by hand instead. Everything confirmed and fixable in code
was fixed on branch `fix/audit-findings` (commit `a8d2ca5`). Nothing has been pushed.

## Headline findings

| Sev | Finding | Status |
|---|---|---|
| High | **Fast day disappears in London/Amsterdam each summer.** Around 17 Tammuz the sun never reaches 16.1° below the horizon at lat ≳ 49.5°, so `alot` is null, "Fast begins" never renders, "Fast ends" shows "—", the hero skips the fast and the dial collapses to the all-night "polar" ring (`index.html` old 760/1030/1248). | Fixed — 72-min dawn stands in, labelled; fast times computed once in `computeZmanim` |
| High | **Chanukah chips off by one candle.** Hebcal dates "N Candles" to the civil evening it is lit; the app rolls the Hebrew day at sunset, so after shkia on the first night the header read "2 Candles". | Fixed — evening-dated entries filed under the Hebrew day |
| High | **Ya'aleh V'Yavo missing on Hoshana Rabba** — dataset flags it 0, not chol hamoed. | Fixed |
| High | **Sefaria HTML injected unsanitized** into the reader (`showDaf`, `showChok`, `showSulam`), including user-authored sheet content and refs placed raw inside attributes. | Fixed — allowlist sanitizer + escaping, meta CSP |
| High | **Service worker caches 404/5xx and cross-origin responses** and serves `index.html` for *any* failed GET, including JSON. | Fixed |
| High | **Light-mode gold text at 2.4:1 contrast**; passed rows at 45% opacity fall to 1.5–2.8:1. | Fixed — `--gold-text` token (5:1), colour instead of opacity |
| High | **Reader overlay not a dialog**: no role, focus stays behind it, Tab walks the obscured page. | Fixed — role=dialog, page `inert`, focus in/out |
| High | **572 KB city blob on the critical path** — 75% of the gzipped page, needed only when typing a city. | Fixed — page 812 KB → 254 KB (gzip 232 → 64 KB) |
| High | **Empty timezone in `cities-extra.json`** (Gulou, CN): picking it saves `tz:""`, the next render throws, page blank until site data is cleared. | Fixed in data; also validated at pick time and at load, and `render()` now recovers |

## Fixed, by dimension

### Astronomy / zmanim
- Displayed times were truncated by `Intl`, so every zman showed up to 59 s early. Now rounded as printed luchot do: times you **wait for** round **up** (misheyakir, netz, mincha gedola/ketana, plag, tzeit, Rabbeinu Tam, fast end, Shabbat/Yom Tov ends, Tikkun Chatzot, the Kiddush Levana opening); **deadlines** round **down** (alot, sof zman Shema/tefilla, chatzot, candle lighting, shkia, fast start, chatzot halayla, the Kiddush Levana close). The countdown, greyed-out rows and dial switch at the minute shown. Set in `ROUND_UP` in `index.html`. *Two times serve both ways: alot is treated as a deadline (last eating before a fast or davening), plag as a start (earliest early-Shabbat candles); someone who davens Mincha until plag should treat it as a deadline.*
- Dial local-midnight used the offset at noon, so on DST transition days the hand and arcs were an hour off before 02:00. Now the offset at midnight.
- Geolocation assigned the device's timezone and never set `israel` or the Jerusalem candle custom. Now sets `israel` from the zone, `mukaf`/40 min from a Jerusalem bounding box, rounds the fix to ~1 km, has a 15 s timeout and distinguishes "blocked" from "no fix".

### Hebrew calendar
- Nacheim keyed on 9 Av, so on Tisha B'Av nidcheh (10 Av, seven years in the dataset) it was missing while Aneinu showed. Now follows the observed fast.
- Shushan Purim / Purim Meshulash inferred "Jerusalem" from `candles===40` or a name match. Now an explicit `mukaf` flag on the preset, picker, GPS and coordinate paths; old saved locations inherit it from the 40-minute custom.
- `isRestYmd` only guarded `y <= 2046`; stepping back into 2024 made Rosh Hashana a weekday. Range now read from the data (`LU_FIRST`/`LU_LAST`), used by the date picker too.
- Omer "Tonight is day N" switched at sunset. Between shkia and tzeit it now says "count from HH:MM", and the rollnote says bein hashmashot instead of asserting the new day. (The Hebrew-date rollover itself still happens at sunset.)
- `isChanukah` scanned eight Hebrew dates per call (up to 96 `Intl` constructions per render); now O(1) incl. the 3-Tevet short-Kislev case.

### PWA / offline
- `sw.js`: same-origin only; cache only `ok` basic responses; `cache.put` under `waitUntil`; `index.html` fallback only for navigations; `cities.json` and all icons precached; cache bumped to `v5`.
- Registers on `localhost` so it can be tested before deploy; registration errors are logged, not swallowed.
- Manifest `theme_color`/`background_color` were the pre-restyle navy; now `#161618`, plus a light-scheme `theme-color` meta. Maskable 512 px icon added.
- `<!doctype html>` and `<html lang="en">` — the page was rendering in quirks mode with no language until JS ran.

### Security & privacy
- `sanitize()` (DOMParser, inline-tag allowlist, attributes limited to class/dir/lang; script/style/iframe dropped) on every Sefaria text; `esc()` on refs, city names, `<option>`s and `data-*` attributes.
- Meta CSP: `connect-src 'self' https://www.sefaria.org`, `object-src 'none'`, `base-uri 'none'`. Inline scripts/styles are the whole app so `'unsafe-inline'` stays. `<meta name="referrer" content="no-referrer">` so the page URL isn't sent to Sefaria.
- Saved `zmanim-loc` validated (finite coords, zone `Intl` accepts) before first render; `render()` falls back to the default city once rather than leaving the page blank.
- README no longer claims "no network calls"; it now states what is fetched and when.

### Accessibility & i18n
- Light theme: `--ink-dim` 3.9:1 → 5.3:1; new `--gold-text` for amber type.
- City search is an ARIA combobox/listbox with ArrowDown/Up/Escape and a polite live region announcing counts and loading state (status rows were disabled buttons, skipped by Tab).
- Geolocation state in a `role=status` region; the button keeps its name and gets `aria-busy`.
- Moon SVG `aria-hidden` (name sits beside it); `lang="he"` on the Hebrew date, HaMan button, reader titles and refs; Targum indent uses logical margin; `.rd-sulam-ref` `text-align:start`.
- `body` font `1rem` so controls follow the browser's text-size preference; focus rings on learn-links and the dialog close button; dead `.band .now` reduced-motion rule removed.

### Performance
- `dtf()` caches `Intl.DateTimeFormat` by locale+options (13 construction sites → cached); `hebrewParts` memoised.
- City data: core index fetched on first keystroke (and precached), the 8.5 MB extra index fetched on typing rather than on focus, with a yield between its two normalisation passes.
- 30 s/1 s timers idle while `document.hidden`; a `visibilitychange` catch-up render.

### Code quality
- `window.__rolled/__satYmd/__weekParsha/__cityHits` → module-level state; `"Yom Tov reading"` sentinel → `weekParsha === null` (Chok button hidden that week, reader guarded if `__CHOK` fails to parse); `DIAL_TIER` dead `ends` key removed and `PRIORITY` derived from it (adds `fastStart`); the only `?.` (Safari < 13.1 parse error for the whole app) removed; Kiddush Levana window constants named and sourced; `locName()` is pure (Hebrew-name migration runs once when the index loads).

### Data
- Seven Golan rows tagged `IL` carried `Asia/Damascus`/`Asia/Beirut` (Syria has no DST since 2022 → an hour off all winter). Now `Asia/Jerusalem`.
- Jerusalem's Hebrew alias was יבוס; Lod לד; Ramallah ראמאללא. Corrected. (Only these three were hand-checked — see "Not fixed".)
- Same-name/same-country places deduped by name alone (Santana BR ×2 in different zones, Cuauhtémoc MX ×2). Now distinguished by zone city; exact duplicate rows dropped.
- UI said "237k places"; the real total is ~243k. Text no longer hard-codes a count.

## Verified in the browser (local server, Chromium)
London 2026-07-02: Fast begins 3:36 AM (72-min label), Fast ends 10:34 PM, hero "Fast ends", four dial arcs. Hoshana Rabba 2025: Ya'aleh V'Yavo said. 15 Dec 2025 daytime: chip "1 Candle", Tonight "2 Candles". 22 Jul 2029: Nacheim at Mincha. 3 Oct 2024: Yom Tov block renders via fallback. City search: ARIA attributes present, live region text, Gulou → Asia/Shanghai, Jerusalem → 40 min/mukaf/ירושלים. Reader: focus to close button, page inert, focus restored on close, sanitizer strips script/onclick/href/style. Light mode and Hebrew RTL screenshots clean; no console errors; service worker registered on localhost.

**Not tested:** offline behaviour end-to-end, install on iOS/Android, Safari. Screen-reader behaviour was inferred from the markup, not heard.

## Refuted by the skeptics (left as is)
- *MA sha'ah zmanis uses a 72-min dawn while the Alot row shows 16.1°* — deliberate and documented in the footer.
- *No elevation term* — sea level is stated in the footer; a recognised opinion.
- *Cache version rarely bumped* — network-first makes this mostly self-healing; the stated consequence didn't follow.
- *Targum paragraph indented on the wrong side* — it is always `dir="rtl"`, so the physical margin was correct (converted to logical anyway).
- *Dead `?.` / reduced-motion rule* etc. — real but trivial; done in passing.

## Not fixed (needs a data regeneration or a product decision)
- **Country field** isn't an ISO code for 2,768 embedded rows (`IL/PS`, `CA, US`, `08, CA`) and ~30k extra rows. Cosmetic in results; the Jerusalem rule no longer depends on it.
- **Hebrew aliases at scale** — GeoNames alternate names are noisy; only Jerusalem/Lod/Ramallah were corrected. A curated override table for the top ~100 cities would be the proper fix.
- **Modern Israeli observances** (Yom HaShoah, HaZikaron, HaAtzmaut, Yerushalayim) aren't in the Hebcal export, so the timeline card omits them while the tachanun card handles them.
- **391 embedded tz ids** (Asia/Kolkata, Europe/Kyiv, …) aren't in `Intl.supportedValuesOf` on V8/ICU. The coordinate form now adds the saved zone to the select so nothing breaks, but normalising the index to canonical ids at build time would be cleaner.
- **Network-first for the page itself** means repeat launches wait for the download. Stale-while-revalidate would be faster but changes how updates land; left as a choice for you.
- **Precomputing `normE`/`skel` offline** for the 234k-row index would remove ~300 ms of main-thread work on first search.
- **Hebrew date rolls at sunset** while parsha/holiday-end logic rolls at tzeit. Wording softened; unifying the boundary is a design call.

## Strengths the reviewers singled out
NOAA port is faithful (spot-checked against the NOAA spreadsheet); all arithmetic in UTC ms with the city zone applied only at display; polar/null handling disciplined; molad arithmetic reproduces 1 Tishri for 5700–5900 with the dechiyot; tachanun table matched istheretachanuntoday.com across two full years for NYC and Jerusalem; Chok L'Yisrael map complete (54×6 keys); dataset internally consistent (flag counts, contiguous daf segments); zero third-party scripts/fonts/analytics; genuine bilingual implementation with logical CSS properties and mirrored arrows.
