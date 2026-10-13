'use strict';
(() => {
  const time = document.getElementById('clock-time');
  const detail = document.getElementById('clock-detail');
  const ring = document.getElementById('seconds-dots');
  const selector = document.getElementById('clock-color');
  const colorKey = 'timeuntil.clock.color.v1';
  const colors = { ember: '#ff915d', violet: '#b5a3ff', tidal: '#79d8d0', gold: '#f4ce71' };
  function applyColor(color) {
    const choice = Object.hasOwn(colors, color) ? color : 'ember';
    selector.value = choice;
    document.documentElement.style.setProperty('--clock-color', colors[choice]);
  }
  function restoreColor() {
    try { applyColor(localStorage.getItem(colorKey)); } catch { applyColor(selector.value); }
  }
  restoreColor();
  selector.addEventListener('change', () => {
    applyColor(selector.value);
    try { localStorage.setItem(colorKey, selector.value); } catch { /* The selected color still works for this visit. */ }
  });
  window.addEventListener('storage', event => { if (event.key === colorKey || event.key === null) restoreColor(); });
  const dots = [];
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
  let timer;
  for (let index = 0; index < 60; index++) {
    const angle = index * Math.PI / 30 - Math.PI / 2;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(240 + 205 * Math.cos(angle)));
    dot.setAttribute('cy', String(240 + 205 * Math.sin(angle)));
    dot.setAttribute('r', '4');
    dot.classList.add('second-dot'); ring.append(dot); dots.push(dot);
  }
  function tick() {
    clearTimeout(timer);
    const now = new Date(), seconds = now.getSeconds();
    const hoursMinutes = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (time.textContent !== hoursMinutes) time.textContent = hoursMinutes;
    time.dateTime = now.toISOString();
    time.setAttribute('aria-label', hoursMinutes + ' local time');
    dots.forEach((dot, index) => dot.classList.toggle('elapsed', index < seconds));
    detail.textContent = hoursMinutes + ' in ' + zone.replaceAll('_', ' ') + '. ' + (60 - seconds) + ' seconds remaining in this minute.';
    // Re-read wall-clock time at each second boundary, including after sleeping.
    if (!document.hidden) timer = setTimeout(tick, 1000 - now.getMilliseconds() + 5);
  }
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('pageshow', () => { restoreColor(); tick(); });
  window.addEventListener('pagehide', () => clearTimeout(timer));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && event.target !== selector) document.getElementById('back-to-countdowns').click(); });
  tick();
})();
