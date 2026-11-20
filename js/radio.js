import { RADIO, KEYS } from './config.js';
import { store } from './storage.js';
import { $ } from './utils.js';

const isHttps = u => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };

export function initRadio() {
  const audio = new Audio();
  audio.preload = 'none';
  const btn = $('radioBtn'), status = $('radioStatus'), vol = $('radioVol'), urlInput = $('radioUrl'), msg = $('radioMsg');
  let url = store.get(KEYS.radioUrl) || RADIO.defaultStream;
  let playing = false;

  const setStatus = (t, live = false) => { status.textContent = t; status.classList.toggle('live', live); };
  const setUi = on => {
    playing = on;
    btn.textContent = on ? 'Pause' : 'Play';
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + RADIO.name);
  };

  audio.volume = Number(store.get(KEYS.radioVol) ?? 0.8);
  vol.value = audio.volume;
  urlInput.value = url;
  setUi(false);
  setStatus('Press play to listen live');

  async function start() {
    setStatus('Connecting…');
    audio.src = url;
    try {
      await audio.play();
      setUi(true);
      setStatus('Live now', true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: RADIO.name, artist: RADIO.frequency, album: 'Live radio' });
        navigator.mediaSession.setActionHandler('pause', stop);
        navigator.mediaSession.setActionHandler('play', start);
      }
    } catch {
      setUi(false);
      setStatus('Couldn’t play the stream. Use SABC Plus below, or update the stream address.');
    }
  }
  function stop() {
    audio.pause();
    audio.removeAttribute('src'); // drop the buffer so the next play rejoins live
    audio.load();
    setUi(false);
    setStatus('Paused');
  }

  btn.addEventListener('click', () => (playing ? stop() : start()));
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) { setUi(false); setStatus('Stream error. Use SABC Plus below, or update the stream address.'); } });
  audio.addEventListener('waiting', () => { if (playing) setStatus('Buffering…'); });
  audio.addEventListener('playing', () => { if (playing) setStatus('Live now', true); });
  vol.addEventListener('input', () => { audio.volume = Number(vol.value); store.set(KEYS.radioVol, audio.volume); });

  $('radioSave').addEventListener('click', () => {
    const v = urlInput.value.trim();
    if (!isHttps(v)) { msg.className = 'text-sm mt-2 err'; msg.textContent = 'Use a full https:// address. Plain http streams are blocked on a secure site.'; return; }
    url = v; store.set(KEYS.radioUrl, v);
    msg.className = 'text-sm mt-2 ok'; msg.textContent = 'Saved. Press play to try it.';
    if (playing) stop();
  });
  $('radioReset').addEventListener('click', () => {
    url = RADIO.defaultStream; store.del(KEYS.radioUrl); urlInput.value = url;
    msg.className = 'text-sm mt-2 ok'; msg.textContent = 'Back to the default address.';
    if (playing) stop();
  });
}
