import { CITY } from './config.js';

export const $ = id => document.getElementById(id);

// Escape anything from an API before it goes into innerHTML.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmtDay = d => new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtTs = t => new Date(t).toLocaleString('en-ZA', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: CITY.tz });

export function banner(msg, kind) {
  const b = $('banner');
  if (!msg) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  b.style.borderColor = kind === 'error' ? 'var(--alert)' : 'var(--sun)';
  b.textContent = msg;
}

export function tickClock() {
  $('clock').textContent = new Date().toLocaleString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: CITY.tz });
}
