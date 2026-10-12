'use strict';
(() => {
  const KEY = 'timeuntil.events.v1';
  const appVersion = document.querySelector('meta[name="app-version"]').content;
  const themes = { ember: ['#ff915d', '255,145,93'], violet: ['#b5a3ff', '181,163,255'], tidal: ['#79d8d0', '121,216,208'], gold: ['#f4ce71', '244,206,113'] };
  const $ = (id) => document.getElementById(id);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
  const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  let events = [], selected = null, editing = null, deleting = null, storageAvailable = true, toastTimeout;
  const demo = { id: 'preview', name: 'Your next big thing', target: new Date(Date.now() + 30 * 86400000).toISOString(), color: 'ember' };

  function validateEvent(e) {
    return e && typeof e.id === 'string' && e.id.length > 0 && e.id.length <= 200 && typeof e.name === 'string' && e.name.trim().length > 0 && e.name.length <= 80 && typeof e.target === 'string' && Number.isFinite(new Date(e.target).getTime()) && new Date(e.target).getFullYear() >= 1 && new Date(e.target).getFullYear() <= 9999 && Object.hasOwn(themes, e.color);
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (!state || !Array.isArray(state.events)) throw new Error('Invalid saved data');
        events = state.events.filter(validateEvent).filter((e, i, all) => all.findIndex(x => x.id === e.id) === i);
        selected = events.some(e => e.id === state.selected) ? state.selected : events[0]?.id || null;
      }
    } catch {
      storageAvailable = false;
      $('save-status').textContent = 'Browser storage unavailable. Changes last for this visit.';
      toast('Saved data could not be loaded. Your existing storage has been left untouched.');
    }
  }
  function persist() {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ events, selected }));
      $('save-status').textContent = 'Saved here. Ready when you return.';
    } catch {
      storageAvailable = false;
      $('save-status').textContent = 'Unable to save. Changes last for this visit.';
      toast('Browser storage is unavailable. Keep this tab open to keep your countdowns.');
    }
  }
  function toast(message) {
    clearTimeout(toastTimeout); $('toast').textContent = message; $('toast').hidden = false;
    toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function transferStatus(message, error = false) {
    $('transfer-status').textContent = message;
    $('transfer-status').hidden = false;
    $('transfer-status').classList.toggle('is-error', error);
  }
  function exportEvents() {
    const backup = { app: 'timeuntil', schemaVersion: 1, appVersion, exportedAt: new Date().toISOString(), timezone: zone, events, selected };
    const blob = new Blob([JSON.stringify(backup, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'timeuntil-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    transferStatus('Exported ' + events.length + ' countdown' + (events.length === 1 ? '' : 's') + ' as a JSON backup.');
  }
  async function importEvents(file) {
    // Validate the whole backup before changing any existing countdowns.
    if (file.size > 2 * 1024 * 1024) throw new Error('Choose a JSON backup smaller than 2 MB.');
    let backup;
    try { backup = JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON. Choose a Time Until backup.'); }
    if (!backup || Array.isArray(backup) || !Array.isArray(backup.events) || (backup.app !== undefined && backup.app !== 'timeuntil')) throw new Error('This file is not a Time Until countdown backup.');
    if (backup.schemaVersion !== undefined && backup.schemaVersion !== 1) throw new Error('This backup uses an unsupported format version.');
    if (backup.events.length > 10000) throw new Error('This backup contains too many countdowns. Import up to 10,000 at a time.');
    const incoming = backup.events.map((event, index) => {
      if (!validateEvent(event) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(event.target)) throw new Error('Countdown ' + (index + 1) + ' has an invalid name, date, or color. Nothing was imported.');
      return { id: event.id, name: event.name.trim(), target: new Date(event.target).toISOString(), color: event.color };
    });
    const ids = new Set(events.map(e => e.id));
    const signature = e => JSON.stringify([e.name.trim(), new Date(e.target).toISOString()]);
    const signatures = new Set(events.map(signature));
    const additions = [];
    for (const event of incoming) {
      if (ids.has(event.id) || signatures.has(signature(event))) continue;
      ids.add(event.id); signatures.add(signature(event)); additions.push(event);
    }
    const skipped = incoming.length - additions.length;
    if (additions.length) {
      const nextEvents = [...events, ...additions];
      const nextSelected = selected || (nextEvents.some(e => e.id === backup.selected) ? backup.selected : additions[0].id);
      // A failed save leaves both the current board and the existing stored data intact.
      if (!storageAvailable) throw new Error('Browser storage is unavailable. Import could not be saved. Your current countdowns are unchanged.');
      try { localStorage.setItem(KEY, JSON.stringify({ events: nextEvents, selected: nextSelected })); }
      catch { throw new Error('The backup could not be saved in this browser. Your current countdowns are unchanged.'); }
      events = nextEvents; selected = nextSelected; render();
    }
    transferStatus('Imported ' + additions.length + ' countdown' + (additions.length === 1 ? '' : 's') + '.' + (skipped ? ' Skipped ' + skipped + ' duplicate' + (skipped === 1 ? '' : 's') + '.' : '') + ' Existing countdowns kept.');
  }
  $('export-events').addEventListener('click', exportEvents);
  $('import-events').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async () => {
    const file = $('import-file').files[0]; if (!file) return;
    $('import-events').disabled = true;
    try { await importEvents(file); } catch (error) { transferStatus(error.message, true); }
    finally { $('import-file').value = ''; $('import-events').disabled = false; }
  });
  function parts(target, now = Date.now()) {
    const diff = Math.max(0, Math.ceil((new Date(target).getTime() - now) / 1000));
    return { days: Math.floor(diff / 86400), hours: Math.floor(diff % 86400 / 3600), minutes: Math.floor(diff % 3600 / 60), seconds: diff % 60, arrived: new Date(target).getTime() <= now };
  }
  const pad = (n) => String(n).padStart(2, '0');
  function theme(element, color) { const [accent, rgb] = themes[color]; element.style.setProperty('--accent', accent); element.style.setProperty('--accent-rgb', rgb); }
  function current() { return events.find(e => e.id === selected) || events[0] || demo; }
  function select(id) {
    if (!events.some(e => e.id === id)) throw new Error('Countdown not found');
    selected = id; persist(); render();
  }
  function render() {
    const e = current(), isDemo = !events.length;
    if (!isDemo) selected = e.id;
    theme($('hero'), e.color);
    $('hero-title').textContent = e.name;
    $('hero-date').textContent = dateFormat.format(new Date(e.target));
    $('hero-tools').hidden = isDemo;
    $('make-yours').hidden = !isDemo;
    $('hero-timezone').hidden = isDemo;
    $('hero-timezone').textContent = zone.replaceAll('_', ' ');
    $('event-count').textContent = events.length;
    $('empty-state').hidden = !isDemo;
    const list = $('event-list'); list.replaceChildren();
    const sorted = [...events].sort((a, b) => {
      const now = Date.now(), aPast = new Date(a.target).getTime() <= now, bPast = new Date(b.target).getTime() <= now;
      return Number(aPast) - Number(bPast) || new Date(a.target) - new Date(b.target);
    });
    for (const event of sorted) {
      const card = document.createElement('article'); card.className = 'event-card' + (event.id === selected ? ' selected' : ''); theme(card, event.color);
      const choose = document.createElement('button'); choose.className = 'event-select'; choose.type = 'button'; choose.setAttribute('aria-pressed', String(event.id === selected));
      const heading = document.createElement('span'); heading.className = 'card-heading';
      const mark = document.createElement('span'); mark.className = 'color-mark'; mark.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.className = 'card-title'; name.textContent = event.name; heading.append(mark, name);
      const date = document.createElement('span'); date.className = 'card-date'; date.textContent = dateFormat.format(new Date(event.target));
      const digits = document.createElement('span'); digits.className = 'card-countdown'; digits.dataset.id = event.id;
      choose.append(heading, date, digits); choose.addEventListener('click', () => select(event.id));
      const actions = document.createElement('div'); actions.className = 'card-actions';
      const edit = actionButton('Edit ' + event.name, '<path d="m15 5 4 4M4 20l4-1L20 7a3 3 0 0 0-4-4L4 15z"/>', () => openForm(event.id));
      const remove = actionButton('Delete ' + event.name, '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>', () => openDelete(event.id));
      actions.append(edit, remove); card.append(choose, actions); list.append(card);
    }
    if (events.length) { const add = document.createElement('button'); add.className = 'add-card'; add.innerHTML = '<span aria-hidden="true">+</span> Another moment to look forward to'; add.addEventListener('click', () => openForm()); list.append(add); }
    tick();
  }
  function actionButton(label, path, callback) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'icon-button'; b.setAttribute('aria-label', label); b.title = label;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; b.addEventListener('click', callback); return b;
  }
  function tick() {
    const now = Date.now(), e = current(), p = parts(e.target, now);
    for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
      const el = document.querySelector('[data-unit="' + unit + '"]'); const next = pad(p[unit]); if (el.textContent !== next) el.textContent = next;
    }
    // Fit unusually distant dates without allowing the day digits to overlap.
    const dayDigits = String(p.days).length;
    document.querySelector('[data-unit="days"]').style.fontSize = dayDigits > 3 ? 'clamp(22px, ' + (24 / dayDigits) + 'vw, ' + (300 / dayDigits) + 'px)' : '';
    $('hero-status').textContent = !events.length ? 'PREVIEW COUNTDOWN' : p.arrived ? 'THE MOMENT IS HERE' : 'COUNTING DOWN';
    $('hero-note').textContent = !events.length ? 'Something worth looking forward to.' : p.arrived ? 'The wait is over. Enjoy your moment.' : 'Every second brings you closer.';
    $('clock-hand').setAttribute('transform', 'rotate(' + (p.arrived ? 0 : p.seconds * 6) + ' 50 50)');
    $('hero-digits').setAttribute('aria-label', p.arrived ? 'The countdown has finished' : p.days + ' days, ' + p.hours + ' hours, ' + p.minutes + ' minutes, ' + p.seconds + ' seconds remaining');
    for (const el of document.querySelectorAll('.card-countdown')) {
      const event = events.find(x => x.id === el.dataset.id); if (!event) continue;
      const t = parts(event.target, now);
      el.innerHTML = t.arrived ? 'The moment is here' : t.days + '<small>d</small> ' + pad(t.hours) + '<small>h</small> ' + pad(t.minutes) + '<small>m</small> ' + pad(t.seconds) + '<small>s</small>';
    }
  }
  function localFields(target) {
    const d = new Date(target); return { date: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), time: pad(d.getHours()) + ':' + pad(d.getMinutes()) };
  }
  function openForm(id) {
    editing = id || null; const event = events.find(e => e.id === id);
    $('event-form').reset(); $('form-error').textContent = '';
    $('dialog-title').textContent = event ? 'Edit your moment.' : 'A new countdown.';
    $('submit-event').textContent = event ? 'Save changes' : 'Create countdown';
    const local = localFields(event?.target || Date.now() + 86400000);
    $('event-name').value = event?.name || ''; $('event-date').value = local.date; $('event-time').value = local.time;
    $('form-timezone').textContent = 'Date and time in ' + zone.replaceAll('_', ' ') + '.';
    document.querySelector('input[name="color"][value="' + (event?.color || 'ember') + '"]').checked = true;
    $('event-dialog').showModal(); $('event-name').focus();
  }
  function parseLocal(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Choose a valid date and time.');
    const target = new Date(date + 'T' + time);
    if (!Number.isFinite(target.getTime())) throw new Error('Choose a valid date and time.');
    const check = localFields(target);
    if (check.date !== date || check.time !== time) throw new Error('This time does not exist in your time zone. Choose another time.');
    return target.toISOString();
  }
  function saveEvent(input, id) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 80) throw new Error('Give your countdown a name of up to 80 characters.');
    if (!Object.hasOwn(themes, input.color)) throw new Error('Choose a valid countdown color.');
    if (id && !events.some(e => e.id === id)) throw new Error('Countdown not found');
    const target = parseLocal(input.date, input.time);
    const event = { id: id || (crypto.randomUUID ? crypto.randomUUID() : 'event-' + Date.now() + '-' + Math.random().toString(36).slice(2)), name, target, color: input.color };
    if (id) events = events.map(e => e.id === id ? event : e); else events.push(event);
    selected = event.id; persist(); render(); return event;
  }
  function openDelete(id) { deleting = id; const event = events.find(e => e.id === id); if (!event) return; $('delete-name').textContent = '“' + event.name + '” will be removed from this browser.'; $('delete-dialog').showModal(); }
  function closeForm() { $('event-dialog').close(); editing = null; }
  for (const id of ['add-top', 'add-empty', 'make-yours']) $(id).addEventListener('click', () => openForm());
  $('edit-hero').addEventListener('click', () => openForm(selected));
  for (const id of ['close-dialog', 'cancel-dialog']) $(id).addEventListener('click', closeForm);
  $('event-form').addEventListener('submit', (event) => { event.preventDefault(); try { const updated = !!editing; saveEvent({ name: $('event-name').value, date: $('event-date').value, time: $('event-time').value, color: document.querySelector('input[name="color"]:checked').value }, editing); closeForm(); toast(updated ? 'Countdown updated.' : 'A new moment to look forward to.'); } catch (error) { $('form-error').textContent = error.message; } });
  $('event-name').addEventListener('input', () => { $('form-error').textContent = ''; });
  $('cancel-delete').addEventListener('click', () => $('delete-dialog').close());
  $('confirm-delete').addEventListener('click', () => { events = events.filter(e => e.id !== deleting); if (selected === deleting) selected = events[0]?.id || null; persist(); $('delete-dialog').close(); render(); if (!events.length) focusView(false); $('add-top').focus(); toast('Countdown removed.'); });
  for (const id of ['event-dialog', 'delete-dialog']) $(id).addEventListener('click', (event) => { if (event.target === $(id)) { const r = $(id).getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $(id).close(); } });
  function focusView(on) { document.body.classList.toggle('is-focused', on); $('exit-focus').hidden = !on; if (on) $('exit-focus').focus(); else $('focus-toggle').focus(); }
  $('focus-toggle').addEventListener('click', () => focusView(true)); $('exit-focus').addEventListener('click', () => focusView(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('is-focused') && !$('event-dialog').open && !$('delete-dialog').open) focusView(false); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('storage', e => { if (e.key === KEY) { events = []; selected = null; load(); render(); } });
  $('today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  load(); render(); setInterval(tick, 1000);

  // Feature-detected browser tools use the same validation, state and persistence as the form.
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    const tools = [
      { name: 'list_countdowns', title: 'List countdowns', description: 'Read the countdowns saved in this browser, with their target instants and remaining time.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute() { return { events: events.map(e => ({ ...e, remaining: parts(e.target) })), timezone: zone }; } },
      { name: 'create_countdown', title: 'Create countdown', description: 'Create and locally save a named countdown. The date and time use the browser’s local time zone.', inputSchema: { type: 'object', properties: { name: { type: 'string', maxLength: 80 }, date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'HH:mm, 24-hour time' }, color: { type: 'string', enum: Object.keys(themes) } }, required: ['name', 'date', 'time', 'color'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { if (!input || typeof input !== 'object') throw new Error('Countdown details are required.'); const event = saveEvent(input); toast('A new moment to look forward to.'); return { ...event, savedLocally: storageAvailable }; } }
    ];
    for (const tool of tools) { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {} }
  }
})();
