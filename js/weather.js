import { CITY } from './config.js';
import { $ } from './utils.js';

export function wmo(c) {
  if (c === 0) return ['Clear', '☀️'];
  if (c <= 2) return ['Partly cloudy', '⛅'];
  if (c === 3) return ['Overcast', '☁️'];
  if (c === 45 || c === 48) return ['Fog', '🌫️'];
  if (c >= 51 && c <= 57) return ['Drizzle', '🌦️'];
  if (c >= 61 && c <= 67) return ['Rain', '🌧️'];
  if (c >= 71 && c <= 77) return ['Snow', '❄️'];
  if (c >= 80 && c <= 82) return ['Showers', '🌧️'];
  if (c >= 95) return ['Thunderstorm', '⛈️'];
  return ['Mixed', '🌥️'];
}

export async function fetchWeather() {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}`
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&hourly=temperature_2m,precipitation_probability,weather_code'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + `&timezone=${encodeURIComponent(CITY.tz)}&forecast_days=7`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('Weather service error ' + r.status);
  return r.json();
}

// Weather at the start of an outage slot, e.g. date "2026-11-20", hhmm "18:00".
export function weatherAt(w, date, hhmm) {
  if (!w) return null;
  const i = w.hourly.time.indexOf(`${date}T${hhmm.slice(0, 2)}:00`);
  if (i < 0) return null;
  const [t, e] = wmo(w.hourly.weather_code[i]);
  return { t, e, temp: Math.round(w.hourly.temperature_2m[i]), rain: w.hourly.precipitation_probability[i] ?? 0 };
}

export function renderWeather(w) {
  const c = w.current, [txt, ico] = wmo(c.weather_code);
  $('now').innerHTML = `<div class="text-5xl" aria-hidden="true">${ico}</div>
    <div><div class="display text-4xl font-extrabold">${Math.round(c.temperature_2m)}°C</div>
    <div class="muted text-sm">${txt} · feels like ${Math.round(c.apparent_temperature)}° · wind ${Math.round(c.wind_speed_10m)} km/h</div></div>`;

  const nowKey = c.time.slice(0, 13);
  let i0 = w.hourly.time.findIndex(t => t.slice(0, 13) >= nowKey);
  if (i0 < 0) i0 = 0;
  $('hourly').innerHTML = w.hourly.time.slice(i0, i0 + 24).map((t, k) => {
    const j = i0 + k, [, e] = wmo(w.hourly.weather_code[j]);
    return `<div class="hour"><div class="text-xs muted">${t.slice(11, 16)}</div><div class="text-xl" aria-hidden="true">${e}</div>
      <div class="font-semibold">${Math.round(w.hourly.temperature_2m[j])}°</div><div class="text-xs rain">${w.hourly.precipitation_probability[j] ?? 0}%</div></div>`;
  }).join('');

  $('daily').innerHTML = w.daily.time.map((d, j) => {
    const [, e] = wmo(w.daily.weather_code[j]);
    return `<div class="hour wide"><div class="text-xs muted">${new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</div>
      <div class="text-xl" aria-hidden="true">${e}</div><div class="font-semibold">${Math.round(w.daily.temperature_2m_max[j])}° <span class="muted font-normal">${Math.round(w.daily.temperature_2m_min[j])}°</span></div>
      <div class="text-xs rain">${w.daily.precipitation_probability_max[j] ?? 0}% rain</div></div>`;
  }).join('');
}
