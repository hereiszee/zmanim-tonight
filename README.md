# Zmanim

A single-file, offline-capable zmanim dashboard: Hebrew date (with sunset rollover), halachic times for any location, tachanun (shacharit & mincha), parsha of the week (Israel & diaspora schedules), special Shabbatot, chag-aware candle lighting & havdalah, and the phase of the moon.

**Live:** https://hereiszee.github.io/zmanim-tonight/

All zmanim and calendar computation happens in the browser — the NOAA solar algorithm for sun times, `Intl` Hebrew calendar for dates, and embedded datasets for the rest. No analytics or tracking. Two things are fetched on demand: the full city index (`cities-extra.json`, ~8.5 MB, downloaded once when you start typing a city) and the texts in the reader (Daf Yomi, Chok L'Yisrael, HaSulam), which come from the [Sefaria](https://www.sefaria.org) API when you open them. Install it from Safari/Chrome via "Add to Home Screen".

## Data & attribution

- Parsha and special-Shabbat schedule (2025–2046) from [Hebcal](https://www.hebcal.com) (CC BY 4.0)
- City index from [GeoNames](https://www.geonames.org) (CC BY 4.0) and © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Reader texts from [Sefaria](https://www.sefaria.org)
- Tachanun follows common Ashkenaz practice; minhagim vary

Times are approximations — for practical halacha, confirm with your local rav and a published luach.

## Development

Serve the folder over `http://localhost` (e.g. `python3 -m http.server`); the service worker registers on localhost as well as on https. Bump `CACHE` in `sw.js` when the precached shell changes.
