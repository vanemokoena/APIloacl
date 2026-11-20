import { ESP_BASE, CITY } from './config.js';
import { S } from './state.js';
import { $, esc, fmtDay, fmtTs, banner } from './utils.js';
import { weatherAt } from './weather.js';

/* ---------- API ---------- */
export async function espFetch(path) {
  let r;
  try { r = await fetch(ESP_BASE + path, { headers: { Token: S.token } }); }
  catch { throw new Error('Could not reach EskomSePush from the browser. Check your connection, or the API may block browser requests.'); }
  if (r.status === 400) throw new Error('EskomSePush rejected the request. Check the area or token.');
  if (r.status === 403) throw new Error('Your token was rejected. Check it was copied in full.');
  if (r.status === 429) throw new Error('Daily limit reached on the free token (50 requests). Try again tomorrow.');
  if (!r.ok) throw new Error('EskomSePush returned an error (' + r.status + ').');
  return r.json();
}

/* ---------- stage ---------- */
function renderMeter(stage) {
  const col = n => (n <= 2 ? 'var(--sun)' : n <= 4 ? '#e07b1f' : 'var(--alert)');
  $('meter').innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="seg" style="${i < stage ? `background:${col(i + 1)}` : ''}"></div>`).join('');
  $('meter').setAttribute('aria-label', stage ? `Stage ${stage} of 8` : 'No load shedding');
}

export function renderStage() {
  const s = S.stage;
  $('stageText').textContent = s.stage === 0 ? 'No load shedding' : `Stage ${s.stage}`;
  $('stageMeta').textContent = s.demo ? 'Sample data' : (s.updated ? 'Updated ' + fmtTs(s.updated) : '');
  renderMeter(s.stage);
  const nx = (s.next || []).filter(n => n.stage_start_timestamp);
  $('nextStages').textContent = nx.length
    ? 'Next: ' + nx.slice(0, 2).map(n => `${n.stage === 0 ? 'no load shedding' : 'Stage ' + n.stage} from ${fmtTs(n.stage_start_timestamp)}`).join(', then ')
    : (s.stage === 0 ? 'No stage changes announced.' : '');
}

export async function loadStage() {
  if (!S.token) { S.stage = { stage: 0, demo: true, next: [] }; }
  else {
    try {
      const e = (await espFetch('/status')).status.eskom;
      S.stage = { stage: parseInt(e.stage, 10) || 0, updated: e.stage_updated, next: e.next_stages };
    } catch (err) { banner(err.message, 'error'); S.stage = { stage: 0, demo: true, next: [] }; }
  }
  renderStage();
  fillStageSelect();
}

export function fillStageSelect() {
  const sel = $('stageSel');
  sel.innerHTML = Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}">Stage ${i + 1}</option>`).join('');
  S.selStage = S.selStage || Math.max(S.stage.stage, 2);
  sel.value = S.selStage;
  renderSchedule();
}

/* ---------- area search ---------- */
export async function searchAreas(text) {
  text = text.trim();
  const out = $('results');
  if (text.length < 3) { out.innerHTML = '<li class="text-sm err">Type at least 3 letters.</li>'; return; }
  if (!S.token) { out.innerHTML = '<li class="text-sm muted">Searching needs a token. Add one below, or tap a popular area above to preview sample times.</li>'; return; }
  out.innerHTML = '<li class="text-sm muted">Searching…</li>';
  try {
    const list = ((await espFetch('/areas_search?text=' + encodeURIComponent(text))).areas || []).slice(0, 8);
    out.innerHTML = list.length
      ? list.map(a => `<li><button class="btn-ghost w-full text-left text-sm" data-id="${esc(a.id)}" data-name="${esc(a.name)}" data-region="${esc(a.region)}"><strong>${esc(a.name)}</strong><br><span class="muted">${esc(a.region)}</span></button></li>`).join('')
      : `<li class="text-sm muted">No areas found for “${esc(text)}”. Try a nearby suburb name.</li>`;
  } catch (err) { out.innerHTML = `<li class="text-sm err">${esc(err.message)}</li>`; }
}

export function showArea() {
  const a = S.area;
  $('savedArea').innerHTML = a ? `Saved: <strong>${esc(a.name)}</strong><br><span class="muted">${esc(a.region)}</span>` : 'No area saved yet.';
  $('clearArea').classList.toggle('hidden', !a);
}

/* ---------- schedule ---------- */
function demoSchedule() {
  const starts = ['06:00', '10:00', '14:00', '18:00', '22:00'];
  const days = [0, 1, 2].map(n => {
    const d = new Date(Date.now() + n * 864e5);
    const date = d.toLocaleDateString('en-CA', { timeZone: CITY.tz });
    const stages = Array.from({ length: 8 }, (_, s) => Array.from({ length: Math.min(s + 1, 4) }, (_, k) => {
      const st = starts[(k * 2 + n) % 5];
      return `${st}-${String((+st.slice(0, 2) + 2) % 24).padStart(2, '0')}:30`;
    }).sort());
    return { date, name: d.toLocaleDateString('en-ZA', { weekday: 'long', timeZone: CITY.tz }), stages };
  });
  return { demo: true, events: [], schedule: { days } };
}

export async function loadArea() {
  if (!S.area) return renderSchedule();
  if (S.area.id === 'demo' || !S.token) { S.areaData = demoSchedule(); return renderSchedule(); }
  $('schedule').innerHTML = '<p class="p-4 muted text-sm">Loading schedule…</p>';
  try { S.areaData = await espFetch('/area?id=' + encodeURIComponent(S.area.id)); banner(''); }
  catch (err) { banner(err.message, 'error'); S.areaData = null; }
  renderSchedule();
}

export function renderSchedule() {
  const box = $('schedule'), sub = $('schedSub');
  if (!S.area) { sub.textContent = 'Pick an area to see outage times.'; box.innerHTML = '<p class="p-4 muted text-sm">Choose a suburb on the left. Your choice is saved on this device.</p>'; return; }
  if (!S.areaData) { box.innerHTML = ''; return; }
  const d = S.areaData, stage = S.selStage || 2;
  sub.textContent = (d.demo ? 'Sample times for ' : '') + S.area.name + ' · Stage ' + stage;

  const rows = (d.schedule?.days || []).slice(0, 3).map(day => {
    const slots = day.stages?.[stage - 1] || [];
    const inner = slots.length ? slots.map(sl => {
      const [a, b] = sl.split('-'), wx = weatherAt(S.weather, day.date, a);
      return `<div class="slot"><div><div class="font-semibold display text-lg">${a} – ${b}</div><div class="text-xs muted">${fmtDay(day.date)}</div></div>
        <div class="text-right text-sm">${wx ? `<span aria-hidden="true" class="text-xl">${wx.e}</span> ${wx.temp}°C · ${wx.t}<br><span class="rain">${wx.rain}% rain</span>` : '<span class="muted">Forecast not available</span>'}</div></div>`;
    }).join('') : `<div class="slot"><div class="muted text-sm">No outages on ${fmtDay(day.date)} at Stage ${stage}.</div></div>`;
    return `<div class="px-4 pt-3 text-sm font-semibold day-name">${esc(day.name)}</div>${inner}`;
  }).join('');

  const ev = (d.events || []).slice(0, 2).map(e => `<div class="slot"><div class="text-sm"><strong>${esc(e.note)}</strong><br><span class="muted">${fmtTs(e.start)} – ${fmtTs(e.end)}</span></div></div>`).join('');
  box.innerHTML = (rows || '<p class="p-4 muted text-sm">No schedule found for this area.</p>') + ev
    + (d.demo ? '<p class="p-4 text-xs muted note">These are sample times so you can preview the layout. Add an EskomSePush token for your real schedule.</p>' : '');
}
