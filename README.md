# Mbombela Power & Weather

A dashboard for residents of Mbombela (Nelspruit), Mpumalanga. It shows the current national load shedding stage, your area's outage times, and the weather forecast for each outage slot.

**Live demo:** https://apilocalmbombela.vercel.app/

<img width="1565" height="818" alt="Screenshot 2026-11-20 213451" src="https://github.com/user-attachments/assets/44787ede-9b6b-462a-ba59-16d8664726dc" />


## Features
- Search your suburb and save it (localStorage)
- Current stage with an 8-step meter, plus upcoming stage changes
- Schedule for any stage, with temperature and rain chance at the start of each slot
- 24-hour and 7-day weather for Mbombela
- Sample-data mode when no API token is set
- Live Ligwalagwala FM (92.5 FM in Mbombela) player with volume, lock-screen controls and an editable stream address
- Responsive, keyboard accessible, light and dark mode

## Tech
Vanilla JavaScript (ES modules), Tailwind CSS (CDN), no build step.

```
index.html
app.js              wires everything together
css/style.css
js/config.js        city, API base, suburbs, radio settings
js/storage.js       safe localStorage wrapper
js/state.js         shared app state
js/utils.js         helpers, clock, banner
js/weather.js       Open-Meteo fetch + weather UI
js/loadshedding.js  EskomSePush fetch, stage, schedule UI
js/radio.js         Ligwalagwala FM player
```

APIs: [EskomSePush](https://esp.info/) (load shedding) and [Open-Meteo](https://open-meteo.com/) (weather, no key).

## Run locally
ES modules don't load from `file://`, so open the folder in VS Code and use the Live Server extension (or any static server).

## Using real load shedding data
1. Get a free token from EskomSePush (50 requests/day).
2. Open the app, expand **EskomSePush access token**, paste it, and save.

The token is stored only in your own browser. It is never in the source code, so it is safe to publish this repo.

## Deploy on GitHub Pages
Repo **Settings → Pages → Deploy from a branch → main / (root)**.

## Notes
Load shedding has been suspended for long stretches since 2024, so the live stage is often "No load shedding". The stage selector lets you preview schedules for any stage.

## Radio
The default stream address comes from a public radio directory and SABC may change it. If it stops working, paste a new https address under **Stream address**, or listen via [SABC Plus](https://www.sabc-plus.com).
