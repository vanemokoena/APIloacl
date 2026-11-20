// app.js: wires the modules together. The logic lives in /js.
import { SUBURBS, KEYS, RADIO } from './js/config.js';
import { store } from './js/storage.js';
import { S } from './js/state.js';
import { $, esc, banner, tickClock } from './js/utils.js';
import { fetchWeather, renderWeather } from './js/weather.js';
import { loadStage, loadArea, searchAreas, showArea, renderSchedule } from './js/loadshedding.js';
import { initRadio } from './js/radio.js';

function setArea(a) {
  S.area = a; S.areaData = null;
  store.set(KEYS.area, a);
  showArea(); loadArea();
}

async function loadWeather() {
  try { S.weather = await fetchWeather(); renderWeather(S.weather); renderSchedule(); }
  catch { $('now').innerHTML = '<p class="muted">Weather is unavailable right now. Check your connection and refresh.</p>'; }
}

async function init() {
  banner(S.token ? '' : 'Showing sample load shedding data. Add a free EskomSePush token under “Your area” to see your real schedule.');
  showArea();
  await loadStage();
  if (S.area) loadArea();
}

/* ----- area ----- */
$('chips').innerHTML = SUBURBS.map(s => `<button class="chip" type="button" data-s="${esc(s)}">${esc(s)}</button>`).join('');
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  if (!S.token) return setArea({ id: 'demo', name: b.dataset.s, region: 'City of Mbombela (sample)' });
  $('q').value = b.dataset.s; searchAreas(b.dataset.s);
});
$('searchForm').addEventListener('submit', e => { e.preventDefault(); searchAreas($('q').value); });
$('results').addEventListener('click', e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  setArea({ id: b.dataset.id, name: b.dataset.name, region: b.dataset.region });
  $('results').innerHTML = '';
});
$('clearArea').addEventListener('click', () => { S.area = null; S.areaData = null; store.del(KEYS.area); showArea(); renderSchedule(); });
$('stageSel').addEventListener('change', e => { S.selStage = +e.target.value; renderSchedule(); });

/* ----- token ----- */
$('saveToken').addEventListener('click', () => {
  const t = $('token').value.trim(), m = $('tokenMsg');
  if (!/^[A-Za-z0-9-]{16,}$/.test(t)) { m.className = 'text-sm mt-2 err'; m.textContent = 'That doesn’t look like a valid token. Paste the full token from your EskomSePush account.'; return; }
  S.token = t; store.set(KEYS.token, t); $('token').value = '';
  m.className = 'text-sm mt-2 ok'; m.textContent = 'Token saved on this device.';
  S.areaData = null; init();
});
$('removeToken').addEventListener('click', () => {
  S.token = ''; store.del(KEYS.token); S.areaData = null;
  $('tokenMsg').className = 'text-sm mt-2'; $('tokenMsg').textContent = 'Token removed.';
  init();
});

/* ----- radio links ----- */
$('sabcLink').href = RADIO.sabcPlus;
$('stationLink').href = RADIO.website;

/* ----- boot ----- */
tickClock(); setInterval(tickClock, 30000);
loadWeather(); initRadio(); init();
