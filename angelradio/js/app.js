/* Angelradio – webbsidan. Binder ihop gränssnittet med mottagaren (device.js) eller demoläget (sim.js). */
(function () {
  'use strict';
  const SITE_VERSION = '1.0.0';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ar.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ar.' + k, JSON.stringify(v)); } catch (e) { /* privat läge */ } }
  };
  const M = window.ArMelody;

  /* Inbyggd versionslista, används om firmware/releases.json inte kan läsas (t.ex. när sidan öppnas som fil) */
  const DEFAULT_RELEASES = [
    { version: '2.1.0', date: '2026-11-15', model: 'AR-RX', file: 'firmware/ReceiverOS-2.1.0.hex', notes: [
      'Inställningar, sändare och egna ljud kan ändras härifrån via USB.',
      'Räckviddstest under System, med live-procent och pip.',
      'Namn på sändarna visas på skärmen vid larm.',
      'Tre platser för egna larmljud.',
      'Skärpta gränser för signalomdömen (95/80/50 %).'] },
    { version: '2.0.0', date: '2026-10-13', model: 'AR-RX', file: 'firmware/ReceiverOS-2.0.0.hex', notes: [
      'Mottagaren kan inte längre fastna i parningsläget.',
      'En fällning ger ett larm, även om sändaren upprepar koden.',
      'Batteriprocent efter batterityp och varning vid lågt batteri.',
      'Ta bort en enskild sändare utan att numren ändras.',
      'Larmet blockerar inte längre ratten eller radion.'] }
  ];

  const DEFAULT_SETTINGS = { vol: 7, sig: 0, sigr: 1, alen: 0, beepno: 1, remind: 1, remints: 30, rush: 1, flash: 1, dim: 15, con: 3, flip: 0, btype: 0, lowbat: 1, relay: 0, dbl: 0 };
  const PROFILES = {
    dag: { vol: 7, alen: 0, remind: 1, remints: 30, beepno: 1, flash: 1, con: 3 },
    natt: { vol: 4, alen: 0, remind: 1, remints: 30, beepno: 1, flash: 1, con: 1 },
    tyst: { vol: 1, alen: 5, remind: 0, beepno: 0, flash: 1, con: 2 }
  };
  const KEY_LABEL = { vol: 'volym', sig: 'larmsignal', sigr: 'rusningssignal', alen: 'larmlängd', beepno: 'pip-nummer', remind: 'påminnelse', remints: 'påminnelseintervall', rush: 'larm vid rusning', flash: 'blinkande skärm', dim: 'skärmsläckning', con: 'ljusstyrka', flip: 'vänd skärm', btype: 'batterityp', lowbat: 'batterivarning', relay: 'vidaresändning', dbl: 'dubbelkontroll' };

  const S = {
    dev: null, mode: 'none', /* none | busy | serial | raw | sim */
    info: null, sounds: [], saved: null, draft: null, tx: [], log: [], mel: { 1: null, 2: null, 3: null }, melNames: { 1: '', 2: '', 3: '' },
    releases: DEFAULT_RELEASES, customHex: null,
    rt: { running: false, points: [], rows: store.get('rtRows', []), bySlot: store.get('rtBySlot', {}), cur: null },
    studio: { slot: 0, mel: store.get('draftMel', null) || M.PRESETS[4].mel(), tool: 'draw', stop: null, playhead: -1 },
    unsub: []
  };
  const connected = () => S.mode === 'serial' || S.mode === 'sim';
  const hasPort = () => connected() || S.mode === 'raw';

  /* ======================== Små hjälpare ======================== */
  let toastTimer = 0;
  function toast(msg, type, ms) {
    const old = $('.toast'); if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + msg + '</span>';
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), ms || 3800);
    return el;
  }
  function dialog(opts) {
    const d = $('#dlg'), body = $('#dlgBody');
    return new Promise((res) => {
      body.innerHTML = (opts.top || '') + '<h3>' + esc(opts.title) + '</h3>' + (opts.html || '') +
        '<div class="b">' + (opts.buttons || [{ label: 'OK', value: true, cls: 'default' }]).map((b, i) => '<button type="button" data-i="' + i + '" class="' + (b.cls || '') + '">' + (b.icon ? icon(b.icon) : '') + esc(b.label) + '</button>').join('') + '</div>';
      const btns = opts.buttons || [{ label: 'OK', value: true }];
      const done = (v) => { d.close(); d.onclose = null; res(v); };
      $$('.b button', body).forEach((b) => b.addEventListener('click', () => done(btns[+b.dataset.i].value)));
      d.onclose = () => res(undefined);
      d.showModal();
      if (opts.onOpen) opts.onOpen(body, done);
    });
  }
  const confirmDlg = (title, html, okLabel, danger) => dialog({ title, html: '<p>' + html + '</p>', buttons: [{ label: 'Avbryt', value: false }, { label: okLabel || 'OK', value: true, cls: danger ? 'default danger' : 'default' }] });

  function ago(sec) {
    if (sec == null || sec < 0) return 'aldrig';
    if (sec < 45) return 'nyss';
    if (sec < 3600) return Math.round(sec / 60) + ' min sedan';
    if (sec < 86400) return Math.round(sec / 3600) + ' h sedan';
    return Math.round(sec / 86400) + ' d sedan';
  }
  const clock = (d) => (d || new Date()).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function txLabel(slot) {
    const t = S.tx.find((x) => x.slot === slot);
    return '#' + slot + (t && t.name ? ' ' + t.name : '');
  }
  function quality(p) {
    if (p == null) return { t: '–', cls: '', col: 'var(--muted)' };
    if (p >= 95) return { t: 'Utmärkt', cls: 'bra', col: 'var(--ok)' };
    if (p >= 80) return { t: 'Bra', cls: 'acc', col: 'var(--accent)' };
    if (p >= 50) return { t: 'Svag', cls: 'mitt', col: 'var(--warn)' };
    return { t: 'Kritisk', cls: 'dalig', col: 'var(--danger)' };
  }
  /* Batteriprocent från spänning för 3 celler i serie */
  const CURVES = {
    0: [[4.80, 100], [4.50, 85], [4.20, 60], [3.90, 35], [3.60, 15], [3.30, 0]],      // alkaliska
    1: [[4.20, 100], [4.05, 85], [3.90, 55], [3.75, 25], [3.60, 8], [3.30, 0]],       // NiMH (LADDA)
    2: [[5.20, 100], [4.95, 85], [4.80, 55], [4.60, 25], [4.30, 8], [3.60, 0]]        // litium
  };
  function batPct(mv, type) {
    const v = mv / 1000, c = CURVES[type] || CURVES[0];
    if (v >= c[0][0]) return 100;
    for (let i = 1; i < c.length; i++) if (v >= c[i][0]) { const [v1, p1] = c[i - 1], [v0, p0] = c[i]; return Math.round(p0 + (v - v0) / (v1 - v0) * (p1 - p0)); }
    return 0;
  }
  function download(name, data, type) {
    const blob = new Blob([data], { type: type || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function verCmp(a, b) {
    const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
    return 0;
  }
  async function guard(fn, msg) {
    try { return await fn(); } catch (e) { console.error(e); toast((msg ? msg + ': ' : '') + esc(e.message || e), 'fel', 6000); return undefined; }
  }

  /* ======================== Flikar och tema ======================== */
  const TABS = ['oversikt', 'inst', 'sandare', 'ljud', 'rackvidd', 'uppdatera', 'hjalp'];
  function setTab(t, noHash) {
    if (!TABS.includes(t)) t = 'oversikt';
    S.tab = t;
    for (const id of TABS) $('#p-' + id).hidden = id !== t;
    $$('#tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $$('#mobnav button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
    if (!noHash) history.replaceState(null, '', '#' + t);
    renderSaveBar();
    if (t === 'ljud') drawRoll();
    if (t === 'rackvidd') drawChart();
    window.scrollTo({ top: 0 });
  }
  function toggleTheme() {
    const light = document.documentElement.dataset.theme !== 'light';
    if (light) document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
    store.set('theme', light ? 'light' : 'dark');
    try { localStorage.setItem('ar.theme', light ? 'light' : 'dark'); } catch (e) { /* ignoreras */ }
    $('meta[name=theme-color]').content = light ? '#ffffff' : '#14171b';
    drawRoll(); drawChart();
  }

  /* ======================== Anslutning ======================== */
  async function connect() {
    if (connected() || S.mode === 'raw') return disconnect();
    if (!('serial' in navigator)) {
      const v = await dialog({ title: 'USB stöds inte här', html: '<p>Den här webbläsaren kan inte prata med USB-enheter. Öppna sidan i Google Chrome eller Microsoft Edge på en dator.</p><p style="margin-top:8px">Du kan ändå prova allt i demoläget.</p>', buttons: [{ label: 'Stäng', value: false }, { label: 'Prova demoläget', value: true, cls: 'default', icon: 'i-flask' }] });
      if (v) startDemo();
      return;
    }
    let port;
    try { port = await navigator.serial.requestPort(); } catch (e) { return; /* användaren avbröt */ }
    await connectPort(port);
  }
  async function connectPort(port, auto) {
    if (connected() || S.mode === 'raw' || S.mode === 'busy') return;
    if (auto) toast('Mottagaren kopplades in. Ansluter…', '', 2500);
    setMode('busy');
    const dev = new window.ArSerialDevice(port);
    try {
      const info = await dev.connect();
      S.dev = dev;
      if (!info) {
        setMode('raw');
        S.info = { name: 'Mottagare', fw: 'okänd', model: 'AR-RX' };
        renderAll();
        const v = await dialog({ title: 'Mottagaren svarar inte på inställningar', html: '<p>Porten öppnades, men programvaran i mottagaren kan inte prata med sidan. Det gäller version 2.0.0 och äldre.</p><p style="margin-top:8px">Uppdatera till senaste versionen, så fungerar allt.</p>', buttons: [{ label: 'Koppla från', value: 'off' }, { label: 'Gå till Uppdatera', value: 'upd', cls: 'default', icon: 'i-update' }] });
        if (v === 'upd') setTab('uppdatera'); else if (v === 'off') disconnect();
        return;
      }
      await onConnected(dev, info, 'serial');
    } catch (e) {
      console.error(e);
      try { await dev.disconnect(); } catch (e2) { /* ignoreras */ }
      setMode('none');
      const busy = /open|busy|access|InvalidState|NetworkError/i.test(e.name + ' ' + e.message);
      dialog({ title: 'Kunde inte ansluta', html: '<p>' + (busy ? 'Porten används redan av ett annat program. Stäng Arduino IDE, PlatformIO eller andra flikar med sidan och försök igen.' : esc(e.message)) + '</p>' });
    }
  }
  async function startDemo() {
    if (hasPort()) await disconnect();
    setMode('busy');
    const dev = new window.ArSimDevice();
    const info = await dev.connect();
    await onConnected(dev, info, 'sim');
    toast('Demoläget är igång. Allt du gör här påverkar bara en låtsasmottagare.', '', 5000);
  }
  async function onConnected(dev, info, mode) {
    S.dev = dev; S.info = info;
    S.unsub.forEach((f) => f()); S.unsub = [
      dev.on('rx', onRx), dev.on('pair', onPair), dev.on('rt', onRt), dev.on('alarm', onAlarm), dev.on('clone', onClone),
      dev.on('lost', () => { toast('Anslutningen bröts. Kontrollera kabeln.', 'fel', 6000); disconnect(true); })
    ];
    setMode(mode);
    await loadAll();
    if (mode === 'serial') toast('Ansluten till ' + esc(info.name) + ' med programvara ' + esc(info.fw) + '.', 'ok');
  }
  async function loadAll() {
    const d = S.dev;
    await guard(async () => {
      S.sounds = await d.sounds();
      S.saved = Object.assign({}, DEFAULT_SETTINGS, await d.getSettings());
      S.draft = { ...S.saved };
      S.tx = await d.listTx();
      S.log = await d.readLog();
      for (let i = 1; i <= 3; i++) {
        const m = await d.readMelody(i);
        S.mel[i] = m.bytes && m.bytes.length ? m.bytes : null; S.melNames[i] = m.name || '';
      }
    }, 'Kunde inte läsa från mottagaren');
    renderAll();
  }
  async function disconnect(lost) {
    const d = S.dev;
    S.unsub.forEach((f) => f()); S.unsub = [];
    S.dev = null; S.info = null; S.saved = null; S.draft = null; S.tx = []; S.log = []; S.sounds = [];
    S.rt.running = false;
    $('#monOn').checked = false;
    setMode('none');
    renderAll();
    if (d && !lost) await guard(() => d.disconnect());
  }
  function setMode(m) {
    S.mode = m;
    const pill = $('#connPill'), txt = $('#connTxt');
    pill.classList.remove('on', 'demo', 'busy');
    const name = S.info ? S.info.name : 'Mottagare';
    if (m === 'busy') { pill.classList.add('busy'); txt.textContent = 'Ansluter…'; }
    else if (m === 'serial') { pill.classList.add('on'); txt.textContent = name + ' ansluten'; }
    else if (m === 'raw') { pill.classList.add('busy'); txt.textContent = 'Endast uppdatering'; }
    else if (m === 'sim') { pill.classList.add('demo'); txt.textContent = 'Demoläge'; }
    else txt.textContent = 'Ej ansluten';
    const on = m !== 'none' && m !== 'busy';
    $('#btnConnectTxt').textContent = on ? 'Koppla från' : 'Anslut';
    $('#btnConnect use').setAttribute('href', on ? '#i-unplug' : '#i-plug');
    $('#btnConnect').classList.toggle('default', !on);
    $('#btnConnect').disabled = m === 'busy';
    const svg = $('#devSvg');
    svg.classList.toggle('on', m === 'serial'); svg.classList.toggle('demo', m === 'sim');
    for (const b of $$('[data-needs=conn]')) b.disabled = !connected();
    $('#btnFlash').disabled = !hasPort() || m === 'busy';
    $$('#instGrid input, #instGrid select, #instGrid .seg button, #qVol, #qSig, #profiles button').forEach((el) => { el.disabled = !connected(); });
  }

  /* ======================== Översikt ======================== */
  function renderOverview() {
    const i = S.info, on = connected();
    const kick = $('#heroKicker'), dot = $('#heroDot');
    dot.className = 'dotx' + (S.mode === 'serial' ? ' on' : S.mode === 'sim' ? ' demo' : S.mode === 'raw' ? ' busy' : '');
    if (!hasPort()) {
      kick.textContent = 'Ingen enhet ansluten';
      $('#heroTitle').textContent = 'Koppla in din mottagare med USB-kabeln';
      $('#heroSub').textContent = 'Sedan kan du ändra inställningar, döpa dina sändare, skapa egna larmljud och uppdatera programvaran, direkt här i webbläsaren. Du behöver inte installera något.';
      $('#heroBtns').hidden = false; $('#heroChips').hidden = true;
      oled('ANGELRADIO', '––', 'Ej ansluten');
    } else {
      kick.textContent = S.mode === 'sim' ? 'Demoläge' : S.mode === 'raw' ? 'Ansluten, okänd programvara' : 'Ansluten via USB';
      $('#heroTitle').textContent = (i.name || 'Mottagare') + (S.mode === 'sim' ? ' (demo)' : '');
      $('#heroSub').textContent = S.mode === 'raw' ? 'Den här versionen av programvaran kan inte ändras härifrån. Uppdatera för att låsa upp allt.' : S.mode === 'sim' ? 'En låtsasmottagare med sju sändare. Prova inställningar, ljudstudion och räckviddstestet. Inget du gör här påverkar en riktig mottagare.' : 'Allt du ändrar här skickas till mottagaren när du sparar. Dra ur kabeln när du är klar.';
      $('#heroBtns').hidden = true; $('#heroChips').hidden = false;
      const latest = S.releases[0], newer = latest && i.fw && verCmp(latest.version, i.fw) > 0;
      const pct = i.batMv ? (i.batPct != null ? i.batPct : batPct(i.batMv, S.saved ? S.saved.btype : i.batType)) : null;
      $('#heroChips').innerHTML =
        chip('i-cpu', 'v' + esc(i.fw), 'Programvara', newer ? 'new' : 'good') +
        (pct != null ? chip('i-bat', pct + ' %', (i.batMv / 1000).toFixed(2).replace('.', ',') + ' V', pct < 20 ? 'cold' : '') : '') +
        (on ? chip('i-radio', S.tx.length + ' st', 'Sändare') : '') +
        (newer ? '<button type="button" class="stat" data-act="tab" data-tab="uppdatera" style="cursor:pointer"><span class="sic" style="background:var(--blue-soft);color:var(--blue)">' + icon('i-update') + '</span><span><span class="sv">v' + esc(latest.version) + ' finns</span><br><span class="sl">Uppdatera</span></span></button>' : '');
      if (on) oled('ANGELRADIO', S.tx.length + ' SANDARE', pct != null ? 'Batt ' + pct + ' %  v' + i.fw : 'v' + i.fw);
      else oled('ANGELRADIO', 'v' + (i.fw || '?'), 'Uppdatera mig');
    }
    /* Rutor */
    $('#devModel').textContent = i ? (i.name + (i.hw && i.hw !== '?' ? ' · kort v' + i.hw : '')) : '–';
    if (on) {
      const pct = i.batPct != null ? i.batPct : batPct(i.batMv, S.draft.btype);
      $('#tBat').innerHTML = pct + '<small> %</small>';
      const bar = $('#tBatBar'); bar.style.width = pct + '%'; bar.parentElement.className = 'pbar ' + (pct < 20 ? 'bad' : pct < 40 ? 'warn' : 'ok');
      $('#tBatSub').textContent = (i.batMv / 1000).toFixed(2).replace('.', ',') + ' V · ' + ['Alkaliska', 'Laddbara', 'Litium'][S.draft.btype];
      const act = S.tx.filter((t) => !t.paused).length;
      $('#tTx').innerHTML = S.tx.length + '<small> av ' + i.slots + '</small>';
      $('#tTxSub').textContent = act + ' aktiva' + (S.tx.length - act ? ', ' + (S.tx.length - act) + ' pausade' : '');
      const last = S.log.find((l) => l.type === 'fall' || l.type === 'rush');
      $('#tLast').innerHTML = last ? '#' + last.slot + '<small> ' + (last.type === 'rush' ? 'rusning' : 'fäll') + '</small>' : '–';
      $('#tLastSub').textContent = last ? ago(last.ago) + (S.tx.find((t) => t.slot === last.slot && t.name) ? ' · ' + S.tx.find((t) => t.slot === last.slot).name : '') : 'Inga napp i loggen';
      const latest = S.releases[0];
      $('#tFw').innerHTML = esc(i.fw);
      $('#tFwSub').innerHTML = latest && verCmp(latest.version, i.fw) > 0 ? '<a href="#uppdatera" data-act="tab" data-tab="uppdatera">v' + esc(latest.version) + ' finns</a>' : 'Senaste versionen';
    } else {
      ['#tBat', '#tTx', '#tLast', '#tFw'].forEach((s) => { $(s).textContent = '–'; });
      ['#tBatSub', '#tTxSub', '#tLastSub', '#tFwSub'].forEach((s) => { $(s).innerHTML = '&nbsp;'; });
      $('#tBatBar').style.width = '0';
      if (S.mode === 'raw') $('#tFw').textContent = 'Okänd';
    }
    renderLog(); renderBars(); renderQuick();
  }
  const chip = (ic, v, l, cls) => '<span class="stat ' + (cls || '') + '"><span class="sic">' + icon(ic) + '</span><span><span class="sv">' + v + '</span><br><span class="sl">' + l + '</span></span></span>';
  function oled(a, b, c) {
    $('#oledL1').textContent = a; $('#oledL2').textContent = b; $('#oledL3').textContent = c;
  }
  function renderLog() {
    const tb = $('#logBody');
    if (!connected()) { tb.innerHTML = '<tr><td colspan="4" class="empty">' + (S.mode === 'raw' ? 'Loggen kan inte läsas från den här versionen.' : 'Anslut mottagaren för att se loggen.') + '</td></tr>'; return; }
    if (!S.log.length) { tb.innerHTML = '<tr><td colspan="4" class="empty">Loggen är tom.</td></tr>'; return; }
    const TY = { fall: '<span class="pill acc">Fäll</span>', rush: '<span class="pill info">Rusning</span>', lowbat: '<span class="pill mitt">Lågt batteri</span>', start: '<span class="pill">Start</span>' };
    tb.innerHTML = S.log.slice(0, 8).map((l) => '<tr' + (l.fresh ? ' class="flash"' : '') + '><td>' + ago(l.ago) + '</td><td>' + (l.slot ? '<span class="num">' + l.slot + '</span> ' + esc((S.tx.find((t) => t.slot === l.slot) || {}).name || '') : '<span class="muted">–</span>') + '</td><td>' + (TY[l.type] || esc(l.type)) + '</td><td class="n">' + (l.vol != null ? l.vol : '') + '</td></tr>').join('');
    S.log.forEach((l) => { l.fresh = false; });
  }
  function renderBars() {
    const el = $('#nappBars');
    if (!connected()) { el.innerHTML = '<div class="empty">Ingen statistik än.</div>'; $('#nappTot').textContent = ''; return; }
    const cnt = {};
    for (const l of S.log) if (l.type === 'fall' || l.type === 'rush') cnt[l.slot] = (cnt[l.slot] || 0) + 1;
    const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const max = Math.max(1, ...rows.map((r) => r[1]));
    const tot = rows.reduce((s, r) => s + r[1], 0);
    $('#nappTot').textContent = tot ? tot + ' totalt' : '';
    el.innerHTML = rows.length ? rows.map(([s, n]) => '<div class="br"><span class="nm"><span class="num">' + s + '</span> ' + esc((S.tx.find((t) => t.slot === +s) || {}).name || '') + '</span><div class="pbar"><i style="width:' + Math.round(n / max * 100) + '%"></i></div><span class="v">' + n + '</span></div>').join('') : '<div class="empty">Inga napp i loggen än.</div>';
  }
  function renderQuick() {
    const on = connected();
    $('#qVol').value = on ? S.draft.vol : 0;
    $('#qVolV').textContent = on ? S.draft.vol : '–';
    fillSoundSelect($('#qSig'), on ? S.draft.sig : null);
  }

  /* ======================== Inställningar ======================== */
  function fillSoundSelect(sel, val) {
    const opts = S.sounds.length ? S.sounds : [{ idx: 0, name: '–' }];
    sel.innerHTML = opts.map((s) => '<option value="' + s.idx + '"' + (s.empty ? ' disabled' : '') + '>' + esc(s.name) + '</option>').join('');
    if (val != null) sel.value = String(val);
  }
  function renderSettings() {
    const on = connected(), d = S.draft || DEFAULT_SETTINGS;
    fillSoundSelect($('#sSig'), d.sig); fillSoundSelect($('#sSigR'), d.sigr);
    for (const el of $$('#p-inst [data-key]')) {
      const k = el.dataset.key;
      if (el.type === 'checkbox') el.checked = !!d[k];
      else if (el.tagName === 'SELECT') el.value = String(d[k]);
      else el.value = d[k];
    }
    for (const g of $$('[data-seg]')) $$('button', g).forEach((b) => b.setAttribute('aria-selected', String(String(d[g.dataset.seg]) === b.dataset.v)));
    $('#sVolV').textContent = on ? d.vol : '–';
    $('#sConV').textContent = on ? ['', 'Låg', 'Mellan', 'Hög', 'Max'][d.con] : '–';
    $('#sRemindS').disabled = !on || !d.remind;
    $('#calNow').textContent = on && S.info.batMv ? (S.info.batMv / 1000).toFixed(2).replace('.', ',') + ' V' : '–';
    const pk = Object.keys(PROFILES).find((p) => Object.entries(PROFILES[p]).every(([k, v]) => d[k] === v));
    $$('#profiles button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.prof === pk)));
    renderSaveBar();
  }
  function diff() {
    if (!S.saved || !S.draft) return {};
    const o = {};
    for (const k of Object.keys(S.draft)) if (S.draft[k] !== S.saved[k]) o[k] = S.draft[k];
    return o;
  }
  function renderSaveBar() {
    const d = Object.keys(diff());
    const bar = $('#saveBar');
    bar.hidden = !d.length || !connected() || !['inst', 'oversikt'].includes(S.tab);
    if (d.length) $('#saveTxt').innerHTML = '<b>' + d.length + ' osparad' + (d.length > 1 ? 'e' : '') + ' ändring' + (d.length > 1 ? 'ar' : '') + '</b> <span class="muted">· ' + esc(d.map((k) => KEY_LABEL[k] || k).join(', ')) + '</span>';
  }
  function setDraft(k, v) {
    if (!S.draft) return;
    S.draft[k] = v;
    renderSettings(); renderQuick();
  }
  async function saveSettings() {
    const d = diff(); if (!Object.keys(d).length) return;
    const btn = $('[data-act=save-settings]'); btn.disabled = true;
    await guard(async () => {
      await S.dev.setSettings(d);
      S.saved = { ...S.draft };
      toast('Sparat i mottagaren.', 'ok');
      renderAll();
    }, 'Kunde inte spara');
    btn.disabled = false;
  }

  /* ======================== Sändare ======================== */
  function renderTx() {
    const tb = $('#txBody');
    $('#txCount').textContent = connected() ? S.tx.length + ' av ' + (S.info.slots || 50) : '';
    if (!connected()) { tb.innerHTML = '<tr><td colspan="6" class="empty">Anslut mottagaren för att se dina sändare.</td></tr>'; return; }
    const q = $('#txSearch').value.trim().toLowerCase();
    const list = S.tx.filter((t) => !q || String(t.slot) === q || (t.name || '').toLowerCase().includes(q));
    if (!S.tx.length) { tb.innerHTML = '<tr><td colspan="6" class="empty">Inga sändare parade än. Klicka på Lägg till sändare.</td></tr>'; return; }
    if (!list.length) { tb.innerHTML = '<tr><td colspan="6" class="empty">Ingen sändare matchar sökningen.</td></tr>'; return; }
    tb.innerHTML = list.map((t) => {
      const r = S.rt.bySlot[t.slot], qv = r ? quality(r.pct) : null;
      return '<tr data-slot="' + t.slot + '" class="' + (t.paused ? 'paused' : '') + (t.fresh ? ' flash' : '') + '">' +
        '<td><span class="num">' + t.slot + '</span></td>' +
        '<td class="grow"><input type="text" maxlength="12" value="' + esc(t.name) + '" placeholder="Namnlös" data-txname="' + t.slot + '" aria-label="Namn på sändare ' + t.slot + '"></td>' +
        '<td class="muted" data-seen>' + ago(t.seen) + '</td>' +
        '<td>' + (qv ? '<span class="pill ' + qv.cls + '" title="Räckviddstest ' + esc(r.when || '') + '">' + r.pct + ' %</span>' : '<span class="muted">–</span>') + '</td>' +
        '<td><span class="sw"><input type="checkbox" data-txon="' + t.slot + '"' + (t.paused ? '' : ' checked') + ' aria-label="Aktiv"><i></i></span></td>' +
        '<td class="n"><button type="button" class="icon ghost danger" data-txdel="' + t.slot + '" title="Ta bort sändare ' + t.slot + '" aria-label="Ta bort">' + icon('i-trash') + '</button></td></tr>';
    }).join('');
    S.tx.forEach((t) => { t.fresh = false; });
  }
  async function pairFlow() {
    let found = null;
    const off = S.dev.on('pair', (p) => { found = p; });
    await guard(() => S.dev.pair(true));
    const res = await dialog({
      top: '<div class="radar" id="pairRadar">' + icon('i-radio') + '</div>',
      title: 'Fäll vippan på den nya sändaren',
      html: '<p id="pairTxt">Mottagaren lyssnar. Den måste höra samma kod två gånger, så håll vippan fälld en sekund.</p><div id="pairName" hidden style="margin-top:12px"><input type="text" id="pairNameIn" maxlength="12" placeholder="Namn, t.ex. Djupa hålet" style="width:100%"></div>',
      buttons: [{ label: 'Avbryt', value: false }, { label: 'Spara', value: true, cls: 'default' }],
      onOpen(body) {
        const saveBtn = $$('.b button', body)[1]; saveBtn.disabled = true;
        const iv = setInterval(() => {
          if (!found) return;
          clearInterval(iv);
          $('#pairRadar', body).style.animation = 'none';
          $('#pairRadar', body).style.background = 'var(--ok-soft)'; $('#pairRadar', body).style.color = 'var(--ok)';
          $('#pairRadar use', body).setAttribute('href', '#i-check');
          $('h3', body).textContent = 'Sändare #' + found.slot + ' tillagd';
          $('#pairTxt', body).textContent = 'Ge den ett namn om du vill, så syns det på skärmen vid larm.';
          $('#pairName', body).hidden = false; $('#pairNameIn', body).focus();
          saveBtn.disabled = false;
        }, 150);
        $('#dlg').addEventListener('close', () => clearInterval(iv), { once: true });
      }
    });
    const name = found ? ($('#pairNameIn') || {}).value || '' : '';
    off();
    await guard(() => S.dev.pair(false));
    if (found) {
      if (res && name.trim()) await guard(() => S.dev.txName(found.slot, name.trim()));
      S.tx = await S.dev.listTx();
      const t = S.tx.find((x) => x.slot === found.slot); if (t) t.fresh = true;
      renderTx(); renderOverview();
      toast('Sändare #' + found.slot + ' är parad.', 'ok');
    }
  }
  function onPair() { /* hanteras i pairFlow */ }
  const monLines = [];
  function onRx(e) {
    const t = S.tx.find((x) => x.slot === e.slot);
    if (t) { t.seen = 0; const cell = $('#txBody tr[data-slot="' + t.slot + '"] [data-seen]'); if (cell) cell.textContent = 'nyss'; }
    if (!$('#monOn').checked) return;
    if (!e.slot && !$('#monUnknown').checked) return;
    const mon = $('#mon');
    if (!monLines.length) mon.innerHTML = '';
    const ch = e.ch === 2 ? 'Fäll' : e.ch === 1 ? 'Rusning' : '';
    const desc = e.slot ? '<span class="num" style="height:18px;min-width:22px;font-size:11.5px">' + e.slot + '</span> ' + esc((t && t.name) || '') + ' <span class="x">' + ch + '</span>' : (e.bits !== 24 ? '<span class="x">Brus (' + e.bits + ' bitar)</span>' : '<span class="x">Okänd sändare</span>');
    const div = document.createElement('div');
    div.className = 'new';
    div.innerHTML = '<span class="t">' + clock() + '</span><span class="k">' + esc(e.code || '') + '</span><span>' + desc + '</span>';
    mon.prepend(div); monLines.unshift(div);
    while (monLines.length > 200) monLines.pop().remove();
  }
  function onAlarm(e) {
    S.log.unshift({ ago: 0, slot: e.slot, type: e.type, vol: S.saved ? S.saved.vol : null, fresh: true });
    const t = S.tx.find((x) => x.slot === e.slot); if (t) t.seen = 0;
    oled('SANDARE #' + e.slot, e.type === 'rush' ? 'RUSNING!' : 'FALL!', t && t.name ? t.name : '');
    toast(icon('i-flag') + ' <b>' + (e.type === 'rush' ? 'Rusning' : 'Fäll') + ' på ' + esc(txLabel(e.slot)) + '</b>', '', 7000);
    renderLog(); renderBars(); renderTx();
    setTimeout(() => { if (connected()) renderOverview(); }, 8000);
  }
  function onClone(e) { toast('Skickar sändare ' + e.n + ' av ' + e.of + ' till handmottagaren…', '', 2000); }

  /* ======================== Ljudstudio ======================== */
  const CW = 22, RH = 18, ROWS = M.HIGH - M.LOW + 1;
  let drag = null;
  function buildKeys() {
    const k = $('#keys'); let h = '';
    for (let m = M.HIGH; m >= M.LOW; m--) h += '<div data-m="' + m + '" class="' + (M.isBlack(m) ? 'blk' : '') + (m % 12 === 0 ? ' c' : '') + '">' + (M.isBlack(m) ? '' : M.noteName(m)) + '</div>';
    k.innerHTML = h;
  }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function drawRoll() {
    const cv = $('#rollCv'); if (!cv || $('#p-ljud').hidden) return;
    const W = M.STEPS * CW, H = ROWS * RH, dpr = window.devicePixelRatio || 1;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const light = document.documentElement.dataset.theme === 'light';
    c.fillStyle = cssVar('--sunken'); c.fillRect(0, 0, W, H);
    for (let r = 0; r < ROWS; r++) {
      const m = M.HIGH - r;
      if (M.isBlack(m)) { c.fillStyle = light ? 'rgba(0,0,0,.045)' : 'rgba(0,0,0,.28)'; c.fillRect(0, r * RH, W, RH); }
      c.fillStyle = cssVar('--border'); c.fillRect(0, r * RH + RH - 1, W, 1);
    }
    const len = M.lengthSteps(S.studio.mel);
    for (let s = 0; s <= M.STEPS; s++) {
      c.fillStyle = s % 16 === 0 ? cssVar('--border-strong') : s % 4 === 0 ? cssVar('--border') : (light ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.025)');
      c.fillRect(s * CW, 0, s % 4 === 0 ? 1 : 1, H);
    }
    if (len) { c.fillStyle = light ? 'rgba(244,182,63,.06)' : 'rgba(244,182,63,.04)'; c.fillRect(0, 0, len * CW, H); }
    const acc = cssVar('--accent');
    for (const n of S.studio.mel.notes) {
      const r = M.HIGH - n.m; if (r < 0 || r >= ROWS) continue;
      const x = n.s * CW + 1, y = r * RH + 2, w = n.len * CW - 2, h = RH - 4;
      const on = S.studio.playhead >= n.s && S.studio.playhead < n.s + n.len;
      c.fillStyle = on ? '#ffd37c' : acc;
      roundRect(c, x, y, w, h, 3); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w - 3, y + 3, 1.5, h - 6);
    }
    if (S.studio.playhead >= 0) { c.fillStyle = light ? '#1a1d22' : '#ffffff'; c.fillRect(S.studio.playhead * CW, 0, 2, H); }
    renderMeter();
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function renderMeter() {
    const mel = S.studio.mel, b = M.byteCount(mel), over = b > M.MAX_BYTES;
    $('#melMeter').innerHTML = mel.notes.length + ' toner · <span class="' + (over ? 'bad' : '') + '">' + b + ' av ' + M.MAX_BYTES + ' byte</span> · ' + (M.lengthSteps(mel) * M.stepMs(mel.bpm) / 1000).toFixed(1).replace('.', ',') + ' s';
  }
  function cellAt(ev) {
    const r = $('#rollCv').getBoundingClientRect();
    return { col: Math.max(0, Math.min(M.STEPS - 1, Math.floor((ev.clientX - r.left) / CW))), row: Math.max(0, Math.min(ROWS - 1, Math.floor((ev.clientY - r.top) / RH))) };
  }
  function noteAt(col, m) { return S.studio.mel.notes.find((n) => n.m === m && col >= n.s && col < n.s + n.len); }
  function commitNote(n) {
    /* en ton i taget: kapa eller ta bort det som överlappar */
    const out = [];
    for (const o of S.studio.mel.notes) {
      if (o === n) continue;
      if (o.s + o.len <= n.s || o.s >= n.s + n.len) { out.push(o); continue; }
      if (o.s < n.s) out.push({ ...o, len: n.s - o.s });
      if (o.s + o.len > n.s + n.len && o.s >= n.s) out.push({ s: n.s + n.len, len: o.s + o.len - (n.s + n.len), m: o.m });
    }
    out.push(n); S.studio.mel.notes = out; M.normalize(S.studio.mel);
  }
  function rollDown(ev) {
    if (ev.button > 0) return;
    const { col, row } = cellAt(ev), m = M.HIGH - row;
    const erase = S.studio.tool === 'erase';
    /* Sudda tar tonen i kolumnen oavsett höjd; Rita tar bort en ton om man klickar exakt på den */
    const hit = noteAt(col, m) || (erase ? S.studio.mel.notes.find((n) => col >= n.s && col < n.s + n.len) : null);
    if (hit) { S.studio.mel.notes = S.studio.mel.notes.filter((n) => n !== hit); changedMel(); return; }
    if (erase) return;
    const len = +$('#melLen').value;
    const n = { s: col, len: Math.min(len, M.STEPS - col), m };
    S.studio.mel.notes.push(n);
    drag = { n, start: col, moved: false };
    M.tone(M.freq(m), 120, (S.draft ? S.draft.vol : 7) / 10);
    $('#rollCv').setPointerCapture(ev.pointerId);
    drawRoll();
  }
  function rollMove(ev) {
    if (!drag) return;
    const { col } = cellAt(ev);
    if (col > drag.start || drag.moved) { drag.moved = true; drag.n.len = Math.max(1, col - drag.start + 1); drawRoll(); }
  }
  function rollUp() { if (!drag) return; commitNote(drag.n); drag = null; changedMel(); }
  function changedMel() {
    if (S.studio.slot === 0) store.set('draftMel', S.studio.mel);
    S.studio.dirty = true;
    drawRoll(); renderSlots();
  }
  function renderSlots() {
    for (const b of $$('#slots .slot')) {
      const s = +b.dataset.slot;
      b.setAttribute('aria-pressed', String(s === S.studio.slot));
      if (s === 0) continue;
      const nm = S.melNames[s], has = !!S.mel[s];
      $('span', b).textContent = !connected() ? 'Anslut för att läsa' : has ? (nm || 'Namnlöst') + ' · i mottagaren' : 'Tom';
    }
    $('#melName').value = S.studio.mel.name || '';
    $('#melBpm').value = S.studio.mel.bpm; $('#melRep').value = String(S.studio.mel.rep);
  }
  function selectSlot(s) {
    stopMel();
    S.studio.slot = s;
    if (s === 0) S.studio.mel = store.get('draftMel', null) || M.empty('');
    else if (S.mel[s]) S.studio.mel = M.decode(S.mel[s], S.melNames[s]);
    else S.studio.mel = M.empty('');
    S.studio.dirty = false;
    renderSlots(); drawRoll();
  }
  function playMel() {
    if (S.studio.stop) { stopMel(); return; }
    if (!S.studio.mel.notes.length) { toast('Rita några toner först.'); return; }
    const btn = $('#btnMelPlay');
    $('use', btn).setAttribute('href', '#i-stop'); $('span', btn).textContent = 'Stoppa';
    S.studio.stop = M.play(S.studio.mel, {
      vol: (S.draft ? S.draft.vol : 7) / 10, reps: S.studio.mel.rep === 0 ? 2 : S.studio.mel.rep,
      onStep: (p) => { S.studio.playhead = p; drawRoll(); },
      onEnd: () => { S.studio.stop = null; $('use', btn).setAttribute('href', '#i-play'); $('span', btn).textContent = 'Spela'; }
    });
  }
  function stopMel() { if (S.studio.stop) { const f = S.studio.stop; S.studio.stop = null; f(); } }
  async function saveMel() {
    const mel = S.studio.mel;
    if (!mel.notes.length) { toast('Melodin är tom.'); return; }
    let bytes; try { bytes = M.encode(mel); } catch (e) { toast(esc(e.message), 'fel'); return; }
    let slot = S.studio.slot;
    if (slot === 0) {
      slot = await dialog({ title: 'Var ska ljudet sparas?', html: '<p>Mottagaren har tre platser för egna ljud. Det som ligger på platsen skrivs över.</p>', buttons: [1, 2, 3].map((i) => ({ label: 'Plats ' + i + (S.mel[i] ? ' (' + (S.melNames[i] || 'upptagen') + ')' : ''), value: i, cls: S.mel[i] ? '' : 'default' })).concat([{ label: 'Avbryt', value: 0, cls: 'ghost' }]) });
      if (!slot) return;
    }
    const name = ($('#melName').value.trim() || ('Eget ' + slot)).slice(0, 12);
    mel.name = name;
    await guard(async () => {
      await S.dev.writeMelody(slot, name, bytes);
      S.mel[slot] = bytes; S.melNames[slot] = name;
      S.sounds = await S.dev.sounds();
      S.studio.slot = slot; S.studio.dirty = false;
      renderSlots(); renderSettings(); renderQuick();
      toast('Sparat som Eget ljud ' + slot + '. Välj det under Inställningar → Larmsignal.', 'ok', 5000);
    }, 'Kunde inte spara ljudet');
  }
  function buildLib() {
    $('#lib').innerHTML = M.PRESETS.map((p, i) => '<button type="button" data-preset="' + i + '">' + icon('i-music') + '<span>' + esc(p.mel().name) + '</span></button>').join('');
  }

  /* ======================== Räckvidd ======================== */
  function rtTick(p, live) {
    if (!$('#rtSound').checked) return;
    if (!live) { M.tone(1500, 110, 0.6); setTimeout(() => M.tone(1000, 160, 0.6), 140); return; }
    const f = 700 + Math.max(0, Math.min(100, p)) * 13;
    M.tone(f, 45, 0.55);
    if (p < 50) setTimeout(() => M.tone(f, 45, 0.55), 110);
  }
  function onRt(e) {
    const q = quality(e.pct);
    const t = S.tx.find((x) => x.slot === e.slot); if (t) t.seen = 0;
    S.rt.cur = e;
    $('#rtLive').hidden = !e.live;
    $('#rtLive').className = 'pill live ' + (e.live ? 'acc' : '');
    $('#rtWho').textContent = e.live ? 'Sändare ' + txLabel(e.slot) : 'Klar · ' + txLabel(e.slot);
    $('#rtPct').innerHTML = e.pct + '<small>%</small>';
    $('#rtPct').style.color = q.col;
    $('#rtQ').textContent = q.t; $('#rtQ').style.color = q.col;
    $('#rtSegs').style.color = q.col;
    $$('#rtSegs i').forEach((s, i) => s.classList.toggle('f', i < Math.round(e.pct / 10)));
    $('#rtPk').textContent = e.live ? e.got + ' av ' + e.exp + ' paket senaste sekunden' : (e.min != null && e.min < e.pct ? 'Lägst ' + e.min + ' % under mätningen' : (e.got ? e.got + ' av ' + e.exp + ' paket totalt' : ''));
    if (e.live) { S.rt.points.push({ t: Date.now(), pct: e.pct, slot: e.slot }); if (S.rt.points.length > 300) S.rt.points.shift(); }
    else {
      S.rt.rows.unshift({ when: clock(), date: new Date().toISOString(), slot: e.slot, name: (t && t.name) || '', pct: e.pct, got: e.got, exp: e.exp, min: e.min, dist: '' });
      S.rt.rows = S.rt.rows.slice(0, 100);
      S.rt.bySlot[e.slot] = { pct: e.pct, when: clock() };
      store.set('rtRows', S.rt.rows); store.set('rtBySlot', S.rt.bySlot);
      renderRtRows(); renderTx();
    }
    rtTick(e.pct, e.live);
    drawChart();
  }
  function renderRtRows() {
    const tb = $('#rtBody');
    if (!S.rt.rows.length) { tb.innerHTML = '<tr><td colspan="6" class="empty">Inga mätningar än.</td></tr>'; return; }
    tb.innerHTML = S.rt.rows.map((r, i) => {
      const q = quality(r.pct);
      return '<tr><td>' + esc(r.when) + '</td><td><span class="num">' + r.slot + '</span> ' + esc(r.name) + '</td>' +
        '<td><input type="number" class="n" min="0" max="2000" step="5" value="' + esc(r.dist) + '" data-rtdist="' + i + '" style="width:80px" aria-label="Avstånd i meter"> <span class="muted">m</span></td>' +
        '<td class="n">' + (r.exp ? r.got + '/' + r.exp : '–') + '</td>' +
        '<td class="n"><span class="pill ' + q.cls + '">' + r.pct + ' %</span></td>' +
        '<td class="muted">' + (r.min != null && r.min < r.pct ? 'lägst ' + r.min + ' %' : '') + '</td></tr>';
    }).join('');
  }
  function drawChart() {
    const cv = $('#rtChart'); if (!cv || $('#p-rackvidd').hidden) return;
    const W = cv.clientWidth || 600, H = cv.clientHeight || 220, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const L = 34, R = 8, T = 8, B = 22, pw = W - L - R, ph = H - T - B;
    /* varje zon (0–50, 50–80, 80–95, 95–100) får en fjärdedel av höjden, så att det viktiga området överst syns */
    const Z = [0, 50, 80, 95, 100];
    const y = (p) => { p = Math.max(0, Math.min(100, p)); let i = 0; while (i < 3 && p > Z[i + 1]) i++; const f = (i + (p - Z[i]) / (Z[i + 1] - Z[i])) / 4; return T + ph - f * ph; };
    const bands = [[95, 100, '--ok-soft'], [80, 95, '--accent-soft'], [50, 80, '--warn-soft'], [0, 50, '--danger-soft']];
    for (const [a, b, v] of bands) { c.fillStyle = cssVar(v); c.fillRect(L, y(b), pw, y(a) - y(b)); }
    c.fillStyle = cssVar('--muted'); c.font = '11px ' + cssVar('--font'); c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const p of [0, 50, 80, 95, 100]) { c.fillText(p + '%', L - 6, y(p)); c.fillStyle = cssVar('--border'); c.fillRect(L, Math.round(y(p)), pw, 1); c.fillStyle = cssVar('--muted'); }
    const pts = S.rt.points;
    const span = 60000, now = pts.length ? Math.max(Date.now(), pts[pts.length - 1].t) : Date.now();
    const x = (t) => L + pw - (now - t) / span * pw;
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let s = 0; s <= 60; s += 15) c.fillText(s ? '−' + s + ' s' : 'nu', L + pw - s / 60 * pw, H - B + 6);
    const vis = pts.filter((p) => now - p.t <= span);
    if (!vis.length) {
      c.fillStyle = cssVar('--muted'); c.textBaseline = 'middle'; c.font = '13px ' + cssVar('--font');
      c.fillText(S.rt.running ? 'Väntar på mätvärden…' : 'Starta testet för att se kurvan', L + pw / 2, T + ph / 2);
      return;
    }
    c.save(); c.beginPath(); c.rect(L, T, pw, ph); c.clip();
    c.strokeStyle = cssVar('--text'); c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath();
    vis.forEach((p, i) => { const px = x(p.t), py = y(p.pct); if (i) c.lineTo(px, py); else c.moveTo(px, py); });
    c.stroke();
    for (const p of vis) { c.fillStyle = quality(p.pct).col.startsWith('var') ? cssVar(quality(p.pct).col.slice(4, -1)) : quality(p.pct).col; c.beginPath(); c.arc(x(p.t), y(p.pct), 3.2, 0, 7); c.fill(); }
    c.restore();
  }
  async function rtToggle() {
    const on = !S.rt.running;
    await guard(async () => {
      await S.dev.rangeTest(on);
      S.rt.running = on;
      if (on) { S.rt.points = []; $('#rtWho').textContent = 'Väntar på sändare'; $('#rtPct').innerHTML = '–<small>%</small>'; $('#rtPct').style.color = ''; $('#rtQ').innerHTML = '&nbsp;'; $('#rtPk').textContent = 'Fäll en vippa, eller vrid rullen så att magneten står vid givaren för en lång mätning.'; $$('#rtSegs i').forEach((s) => s.classList.remove('f')); M.audio(); }
      else $('#rtLive').hidden = true;
      const b = $('#btnRt'); $('use', b).setAttribute('href', on ? '#i-stop' : '#i-play'); $('span', b).textContent = on ? 'Stoppa test' : 'Starta test';
      b.classList.toggle('default', !on);
      drawChart();
    }, 'Kunde inte starta testet');
  }

  /* ======================== Uppdatering ======================== */
  async function loadReleases() {
    try {
      const r = await fetch('firmware/releases.json', { cache: 'no-cache' });
      if (r.ok) { const j = await r.json(); if (Array.isArray(j.releases) && j.releases.length) S.releases = j.releases.sort((a, b) => verCmp(b.version, a.version)); }
    } catch (e) { /* använder den inbyggda listan */ }
    renderUpdate();
  }
  function renderUpdate() {
    const cur = S.info && S.info.fw, latest = S.releases[0];
    $('#fwCur').textContent = cur ? (cur === 'okänd' ? 'Okänd' : 'v' + cur) : '–';
    $('#fwNew').textContent = latest ? 'v' + latest.version : '–';
    const st = $('#fwState');
    if (!hasPort()) { st.className = 'pill'; st.textContent = 'Inte ansluten'; }
    else if (cur === 'okänd' || verCmp(latest.version, cur) > 0) { st.className = 'pill info'; st.textContent = 'Ny version finns'; }
    else { st.className = 'pill bra'; st.textContent = 'Senaste versionen'; }
    $('#changelog').innerHTML = S.releases.map((r, i) => '<div class="rel"><h3>Version ' + esc(r.version) + (i === 0 ? ' <span class="pill acc">Senaste</span>' : '') + (cur && r.version === cur ? ' <span class="pill bra">Din version</span>' : '') + ' <span class="dt">' + esc(new Date(r.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })) + '</span></h3><ul>' + r.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul></div>').join('');
    const pick = $('#fwPick'), keep = pick.value;
    pick.innerHTML = S.releases.map((r) => '<option value="' + esc(r.version) + '">v' + esc(r.version) + (r === latest ? ' (senaste)' : '') + '</option>').join('');
    if (keep && S.releases.some((r) => r.version === keep)) pick.value = keep;
    const target = S.customHex ? 'egen fil' : 'v' + pick.value;
    $('#btnFlash').innerHTML = icon('i-download') + (S.customHex ? 'Skriv egen fil' : cur && cur !== 'okänd' && verCmp(pick.value, cur) === 0 ? 'Installera om ' + target : cur && cur !== 'okänd' && verCmp(pick.value, cur) < 0 ? 'Gå tillbaka till ' + target : 'Uppdatera till ' + target);
    $('#btnFlash').disabled = !hasPort();
  }
  function stepState(name, st) {
    const li = $('#flashSteps li[data-s="' + name + '"]'); if (!li) return;
    li.className = st || '';
  }
  async function makeBackup() {
    const d = S.dev;
    const b = { app: 'angelradio', format: 1, date: new Date().toISOString(), device: { model: S.info.model, fw: S.info.fw, hw: S.info.hw }, settings: await d.getSettings(), tx: (await d.listTx()).map((t) => ({ slot: t.slot, code: t.code, name: t.name, paused: t.paused })), melodies: {} };
    for (let i = 1; i <= 3; i++) { const m = await d.readMelody(i); if (m.bytes && m.bytes.length) b.melodies[i] = { name: m.name, data: window.ArProto.bytesToHex(m.bytes) }; }
    return b;
  }
  async function restoreBackup(b, opts) {
    const d = S.dev; opts = opts || {};
    if (opts.settings !== false && b.settings) { const s = {}; for (const k of Object.keys(DEFAULT_SETTINGS)) if (k in b.settings) s[k] = b.settings[k]; await d.setSettings(s); }
    if (opts.tx !== false && Array.isArray(b.tx)) for (const t of b.tx) await d.txSet(t);
    if (opts.mel !== false && b.melodies) for (const k of Object.keys(b.melodies)) await d.writeMelody(+k, b.melodies[k].name || '', window.ArProto.hexToBytes(b.melodies[k].data));
  }
  async function flash() {
    const rel = S.releases.find((r) => r.version === $('#fwPick').value) || S.releases[0];
    const label = S.customHex ? 'filen ' + S.customHex.name : 'version ' + rel.version;
    const ok = await confirmDlg('Uppdatera mottagaren?', 'Mottagaren får ' + esc(label) + '. Det tar ungefär en halv minut. Dra inte ur kabeln under tiden.', 'Uppdatera');
    if (!ok) return;
    const steps = $('#flashSteps'), bar = $('#flashBar');
    steps.hidden = false; bar.hidden = false; $$('li', steps).forEach((l) => { l.className = ''; }); $('i', bar).style.width = '0';
    $('#flashPct').textContent = '';
    $('#btnFlash').disabled = true; $('#btnConnect').disabled = true;
    const keep = $('#fwKeep').checked && S.mode !== 'raw';
    let backup = null, cur = 'backup';
    try {
      stepState('backup', 'doing');
      if (keep) { backup = await makeBackup(); store.set('autobackup', backup); stepState('backup', 'done'); }
      else stepState('backup', S.mode === 'raw' ? 'done' : '');
      cur = 'dl'; stepState('dl', 'doing');
      let image = null;
      if (S.customHex) image = S.customHex.image;
      else if (S.mode === 'sim') { await sleep(500); image = new Uint8Array(28050); }
      else {
        const r = await fetch(rel.file, { cache: 'no-cache' });
        if (!r.ok) throw new Error('Programfilen ' + rel.file + ' finns inte på servern (' + r.status + ').');
        image = window.ArHex.parseHex(await r.text(), 32768).image;
      }
      stepState('dl', 'done');
      const map = { boot: 'boot', write: 'write', verify: 'verify' };
      const res = await S.dev.flash(image, {
        version: S.customHex ? S.info.fw : rel.version,
        onStep: (s) => { if (cur && cur !== s) stepState(cur, 'done'); cur = map[s] || s; stepState(cur, 'doing'); },
        onProgress: (p, phase) => {
          const tot = phase === 'write' ? p * 0.7 : 0.7 + p * 0.3;
          $('i', bar).style.width = Math.round(tot * 100) + '%';
          $('#flashPct').textContent = phase === 'write' ? Math.round(p * 100) + ' %' : '';
        }
      });
      stepState(cur, 'done');
      cur = 'restore'; stepState('restore', 'doing');
      if (res.info) {
        S.info = res.info;
        if (S.mode === 'raw') { await onConnected(S.dev, res.info, 'serial'); }
        else if (keep && backup) {
          /* EEPROM finns normalt kvar efter uppdatering. Skriv bara tillbaka om något nollställts. */
          const now = await S.dev.getSettings(), tx = await S.dev.listTx();
          const lost = tx.length < backup.tx.length || Object.keys(backup.settings).some((k) => k in now && now[k] !== backup.settings[k]);
          if (lost) await restoreBackup(backup);
        }
        stepState('restore', 'done');
        await loadAll();
      } else {
        stepState('restore', 'fail');
        setMode('raw');
      }
      $('i', bar).style.width = '100%';
      toast('Klart! Mottagaren har nu ' + (S.info ? 'version ' + esc(S.info.fw) : 'den nya programvaran') + '.', 'ok', 6000);
    } catch (e) {
      console.error(e);
      stepState(cur, 'fail');
      dialog({ title: 'Uppdateringen gick inte', html: '<p>' + esc(e.message) + '</p><p style="margin-top:8px">Mottagaren är inte skadad. Kontrollera kabeln och försök igen.' + (backup ? ' Dina inställningar finns sparade i webbläsaren.' : '') + '</p>' });
      if (S.mode === 'serial') { try { const info = await S.dev.connect(); if (!info) setMode('raw'); } catch (e2) { disconnect(true); } }
    } finally {
      $('#btnConnect').disabled = false;
      setMode(S.mode);
      renderUpdate();
    }
  }
  async function pickHex(file) {
    if (!file) return;
    try {
      const txt = await file.text();
      const r = window.ArHex.parseHex(txt, 32768);
      if (r.size > window.ArStk500.MAX_APP) throw new Error('Filen är ' + r.size + ' byte men får vara högst ' + window.ArStk500.MAX_APP + '.');
      S.customHex = { name: file.name, image: r.image, size: r.size };
      $('#hexInfo').innerHTML = icon('i-file') + ' <b>' + esc(file.name) + '</b> · ' + r.size.toLocaleString('sv-SE') + ' byte (' + Math.round(r.size / window.ArStk500.MAX_APP * 100) + ' % av minnet) · <a href="#" data-act="hex-clear">Ta bort</a>';
    } catch (e) { S.customHex = null; $('#hexInfo').innerHTML = '<span class="bad">' + esc(e.message) + '</span>'; }
    renderUpdate();
  }

  /* ======================== Säkerhetskopia ======================== */
  async function backupDownload() {
    await guard(async () => {
      const b = await makeBackup();
      const day = new Date().toISOString().slice(0, 10);
      download('angelradio-kopia-' + day + '.angelradio', JSON.stringify(b, null, 2), 'application/json');
      store.set('lastBackup', Date.now());
      renderBackupHint();
      toast('Säkerhetskopian är sparad.', 'ok');
    }, 'Kunde inte spara kopian');
  }
  async function restoreFromFile(file) {
    if (!file) return;
    let b;
    try { b = JSON.parse(await file.text()); if (b.app !== 'angelradio') throw new Error('Det här är ingen Angelradio-kopia.'); }
    catch (e) { toast(esc(e.message), 'fel'); return; }
    const n = (b.tx || []).length, m = Object.keys(b.melodies || {}).length;
    const ok = await confirmDlg('Läsa in säkerhetskopian?', 'Kopian är från ' + esc(new Date(b.date).toLocaleString('sv-SE')) + ' och innehåller inställningar, ' + n + ' sändare och ' + m + ' egna ljud. Det som finns i mottagaren nu skrivs över.', 'Läs in');
    if (!ok) return;
    await guard(async () => { await restoreBackup(b); await loadAll(); toast('Kopian är inläst.', 'ok'); }, 'Kunde inte läsa in kopian');
  }
  function renderBackupHint() {
    const t = store.get('lastBackup', 0);
    $('#lastBackup').textContent = t ? 'Senaste kopian sparades ' + new Date(t).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) + '.' : '';
  }

  /* ======================== Hjälp ======================== */
  function renderSupport() {
    const ua = navigator.userAgent;
    const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Okänd';
    const rows = [
      ['USB (Web Serial)', 'serial' in navigator],
      ['Ljud (Web Audio)', !!(window.AudioContext || window.webkitAudioContext)],
      ['Säker anslutning', window.isSecureContext],
      ['Webbläsare: ' + br, ['Chrome', 'Edge', 'Opera'].includes(br)]
    ];
    $('#support').innerHTML = rows.map(([l, ok]) => '<div>' + (ok ? '<span class="ok">' + icon('i-check') + '</span>' : '<span class="bad">' + icon('i-x') + '</span>') + esc(l) + '</div>').join('');
    $('#siteVer').textContent = SITE_VERSION;
    $('#unsupported').hidden = 'serial' in navigator;
  }

  function renderAll() {
    renderOverview(); renderSettings(); renderTx(); renderSlots(); renderUpdate(); renderRtRows(); renderBackupHint();
    for (const b of $$('[data-needs=conn]')) b.disabled = !connected();
    $('#btnFlash').disabled = !hasPort();
    if (!connected()) $('#saveBar').hidden = true;
    drawRoll();
  }

  /* ======================== Händelser ======================== */
  function bind() {
    $('main').appendChild($('#saveBar'));
    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
    $('#mobnav').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
    window.addEventListener('hashchange', () => setTab(location.hash.slice(1), true));
    $('#btnTheme').addEventListener('click', toggleTheme);
    $('#btnConnect').addEventListener('click', connect);
    $('#connPill').addEventListener('click', () => setTab(hasPort() ? 'oversikt' : 'hjalp'));

    document.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-act]'); if (!a || a.disabled) return;
      const act = a.dataset.act;
      if (a.tagName === 'A') e.preventDefault();
      switch (act) {
        case 'connect': connect(); break;
        case 'demo': startDemo(); break;
        case 'tab': setTab(a.dataset.tab); break;
        case 'readlog': if (connected()) { await guard(async () => { S.log = await S.dev.readLog(); renderLog(); renderBars(); }); } break;
        case 'preview-sig': {
          const idx = +(a.closest('.r').querySelector('select').value);
          if (connected() && S.mode === 'serial') { guard(() => S.dev.play(idx)); toast('Spelas i mottagaren.'); break; }
          const pv = M.BUILTIN_PREVIEW[idx];
          if (pv) M.play(pv(), { vol: (S.draft ? S.draft.vol : 7) / 10, reps: 1 });
          else if (idx >= 3 && S.mel[idx - 2]) M.play(M.decode(S.mel[idx - 2]), { vol: (S.draft ? S.draft.vol : 7) / 10, reps: 1 });
          else if (connected()) { guard(() => S.dev.play(idx)); toast('Det här ljudet kan bara spelas i mottagaren.'); }
          break;
        }
        case 'beep': guard(async () => { await S.dev.setSettings({ vol: S.draft.vol }); S.saved.vol = S.draft.vol; await S.dev.beep(); renderSaveBar(); }); break;
        case 'save-settings': saveSettings(); break;
        case 'undo-settings': S.draft = { ...S.saved }; renderSettings(); renderQuick(); break;
        case 'defaults':
          if (await confirmDlg('Återställa inställningarna?', 'Alla inställningar går tillbaka till fabriksläget. Sändare och egna ljud finns kvar.', 'Återställ', true)) {
            await guard(async () => { await S.dev.defaults(); S.saved = Object.assign({}, DEFAULT_SETTINGS, await S.dev.getSettings()); S.draft = { ...S.saved }; renderAll(); toast('Inställningarna är återställda.', 'ok'); });
          }
          break;
        case 'calibrate': {
          const v = parseFloat(String($('#calV').value).replace(',', '.'));
          if (!(v > 2 && v < 6.5)) { toast('Skriv in spänningen du mätte, till exempel 4,15.', 'fel'); break; }
          await guard(async () => { await S.dev.calibrate(v * 1000); S.info = await S.dev.info(); renderAll(); toast('Kalibrerat. Mottagaren visar nu ' + (S.info.batMv / 1000).toFixed(2).replace('.', ',') + ' V.', 'ok'); });
          break;
        }
        case 'pair': pairFlow(); break;
        case 'tx-pause-all': case 'tx-resume-all': {
          const pause = act === 'tx-pause-all';
          await guard(async () => { for (const t of S.tx) if (t.paused !== pause) await S.dev.txPause(t.slot, pause); S.tx = await S.dev.listTx(); renderTx(); renderOverview(); });
          break;
        }
        case 'mon-clear': monLines.length = 0; $('#mon').innerHTML = '<div class="x">Rensat.</div>'; break;
        case 'mel-play': playMel(); break;
        case 'mel-play-dev': guard(async () => { await S.dev.playMelodyBytes(M.encode(S.studio.mel)); toast('Spelas i mottagaren.'); }); break;
        case 'mel-clear': S.studio.mel.notes = []; changedMel(); break;
        case 'mel-save': saveMel(); break;
        case 'rtttl-in':
          try {
            const mel = M.parseRTTTL($('#rtttl').value);
            S.studio.mel = mel; changedMel(); renderSlots();
            toast('Inläst: ' + mel.notes.length + ' toner' + (mel.truncated ? ' (kapad till 64 steg)' : '') + '.', 'ok');
          } catch (err) { toast(esc(err.message), 'fel'); }
          break;
        case 'rtttl-out':
          $('#rtttl').value = M.toRTTTL(S.studio.mel);
          try { await navigator.clipboard.writeText($('#rtttl').value); toast('Kopierat till urklipp.', 'ok'); } catch (err) { toast('Melodin står i rutan ovan.'); }
          break;
        case 'rt-toggle': rtToggle(); break;
        case 'rt-clear':
          if (await confirmDlg('Rensa mätningarna?', 'Alla sparade mätningar tas bort från den här webbläsaren.', 'Rensa', true)) { S.rt.rows = []; S.rt.bySlot = {}; S.rt.points = []; store.set('rtRows', []); store.set('rtBySlot', {}); renderRtRows(); renderTx(); drawChart(); }
          break;
        case 'rt-csv': {
          const lines = ['tid;sändare;namn;avstånd_m;paket;av;procent;lägst'].concat(S.rt.rows.map((r) => [r.date, r.slot, '"' + (r.name || '').replace(/"/g, '""') + '"', r.dist, r.got, r.exp, r.pct, r.min == null ? '' : r.min].join(';')));
          download('rackvidd-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + lines.join('\r\n'), 'text/csv');
          break;
        }
        case 'flash': flash(); break;
        case 'hex-clear': S.customHex = null; $('#hexInfo').textContent = ''; $('#hexFile').value = ''; renderUpdate(); break;
        case 'backup': backupDownload(); break;
        case 'restore': $('#restoreFile').click(); break;
        case 'install': break; /* hanteras i setupInstall */
        case 'clone':
          await guard(async () => { toast('Skickar sändarna till handmottagaren…', '', 2500); await S.dev.clone(); toast('Klart. Handmottagaren piper när den är färdig.', 'ok'); }, 'Kloningen misslyckades');
          break;
      }
    });

    /* Inställningar */
    const onField = (el) => {
      const k = el.dataset.key; if (!k || !S.draft) return;
      const v = el.type === 'checkbox' ? (el.checked ? 1 : 0) : Number(el.value);
      setDraft(k, v);
    };
    document.addEventListener('input', (e) => { if (e.target.matches('input[type=range][data-key]')) onField(e.target); });
    document.addEventListener('change', (e) => { if (e.target.matches('[data-key]:not([type=range])')) onField(e.target); });
    $$('[data-seg]').forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b && !b.disabled) setDraft(g.dataset.seg, Number(b.dataset.v)); }));
    $('#profiles').addEventListener('click', (e) => { const b = e.target.closest('button[data-prof]'); if (!b || !S.draft) return; Object.assign(S.draft, PROFILES[b.dataset.prof]); renderSettings(); renderQuick(); toast('Profilen ' + b.textContent + ' är vald. Tryck på Spara för att skicka den.'); });

    /* Sändare */
    $('#txSearch').addEventListener('input', renderTx);
    $('#txBody').addEventListener('change', async (e) => {
      const n = e.target.closest('[data-txname]'), on = e.target.closest('[data-txon]');
      if (n) { const s = +n.dataset.txname; await guard(async () => { await S.dev.txName(s, n.value.trim()); const t = S.tx.find((x) => x.slot === s); if (t) t.name = n.value.trim(); toast('Namnet är sparat.', 'ok', 1800); renderOverview(); }); }
      if (on) { const s = +on.dataset.txon; await guard(async () => { await S.dev.txPause(s, !on.checked); const t = S.tx.find((x) => x.slot === s); if (t) t.paused = !on.checked; renderTx(); renderOverview(); }); }
    });
    $('#txBody').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-txname]')) e.target.blur(); });
    $('#txBody').addEventListener('click', async (e) => {
      const d = e.target.closest('[data-txdel]'); if (!d) return;
      const s = +d.dataset.txdel;
      if (!(await confirmDlg('Ta bort sändare #' + s + '?', 'Sändaren larmar inte längre. Numren på de andra ändras inte, och nästa nya sändare får det lediga numret.', 'Ta bort', true))) return;
      await guard(async () => { await S.dev.txDel(s); S.tx = S.tx.filter((t) => t.slot !== s); renderTx(); renderOverview(); toast('Sändare #' + s + ' är borttagen.', 'ok'); });
    });
    $('#monOn').addEventListener('change', async (e) => {
      if (!connected()) { e.target.checked = false; toast('Anslut mottagaren först.'); return; }
      await guard(() => S.dev.monitor(e.target.checked));
      if (e.target.checked) { monLines.length = 0; $('#mon').innerHTML = '<div class="x">Lyssnar…</div>'; }
    });

    /* Ljudstudio */
    buildKeys(); buildLib();
    const cv = $('#rollCv');
    cv.addEventListener('pointerdown', rollDown);
    cv.addEventListener('pointermove', rollMove);
    cv.addEventListener('pointerup', rollUp);
    cv.addEventListener('pointercancel', rollUp);
    $('#keys').addEventListener('click', (e) => { const k = e.target.closest('[data-m]'); if (k) M.tone(M.freq(+k.dataset.m), 180, (S.draft ? S.draft.vol : 7) / 10); });
    $('#slots').addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (b) selectSlot(+b.dataset.slot); });
    $('#melTool').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (!b) return; S.studio.tool = b.dataset.tool; $$('#melTool button').forEach((x) => x.setAttribute('aria-selected', String(x === b))); });
    $('#melName').addEventListener('input', (e) => { S.studio.mel.name = e.target.value; if (S.studio.slot === 0) store.set('draftMel', S.studio.mel); });
    $('#melBpm').addEventListener('change', (e) => { S.studio.mel.bpm = Math.max(40, Math.min(255, +e.target.value || 160)); e.target.value = S.studio.mel.bpm; changedMel(); });
    $('#melRep').addEventListener('change', (e) => { S.studio.mel.rep = +e.target.value; changedMel(); });
    $('#lib').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset]'); if (!b) return;
      stopMel();
      const mel = M.PRESETS[+b.dataset.preset].mel();
      S.studio.mel = mel; changedMel(); renderSlots();
      playMel();
    });

    /* Räckvidd */
    $('#rtSegs').innerHTML = '<i></i>'.repeat(10);
    $('#rtBody').addEventListener('change', (e) => { const i = e.target.dataset.rtdist; if (i == null) return; S.rt.rows[+i].dist = e.target.value; store.set('rtRows', S.rt.rows); });

    /* Uppdatering */
    $('#fwPick').addEventListener('change', renderUpdate);
    const dz = $('#hexDrop');
    dz.addEventListener('click', () => $('#hexFile').click());
    dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#hexFile').click(); } });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); pickHex(e.dataTransfer.files[0]); });
    $('#hexFile').addEventListener('change', (e) => pickHex(e.target.files[0]));
    $('#restoreFile').addEventListener('change', (e) => { restoreFromFile(e.target.files[0]); e.target.value = ''; });

    if ('serial' in navigator) navigator.serial.addEventListener('disconnect', (e) => {
      if (S.dev && S.dev.port && e.target === S.dev.port && !$('#flashSteps li.doing')) { toast('Mottagaren kopplades ur.', 'fel'); disconnect(true); }
    });
    window.addEventListener('resize', () => { drawChart(); });
    setInterval(() => {
      /* håll "senast hörd" och "för X min sedan" aktuella */
      if (!connected()) return;
      for (const t of S.tx) if (t.seen >= 0) t.seen += 10;
      for (const l of S.log) l.ago += 10;
      if (S.tab === 'sandare' && !document.activeElement.matches('[data-txname]')) $$('#txBody tr[data-slot]').forEach((tr) => { const t = S.tx.find((x) => x.slot === +tr.dataset.slot); const c = $('[data-seen]', tr); if (t && c) c.textContent = ago(t.seen); });
      if (S.tab === 'oversikt') renderLog();
    }, 10000);
    setInterval(() => { if (S.rt.running && S.tab === 'rackvidd') drawChart(); }, 1000);
    window.addEventListener('beforeunload', (e) => { if (Object.keys(diff()).length || $('#flashSteps li.doing')) { e.preventDefault(); e.returnValue = ''; } });
  }

  /* ---------- Automatisk anslutning ---------- */
  async function autoConnect() {
    $('#autoConn').checked = store.get('autoConn', true);
    if (!('serial' in navigator)) { $('#autoConn').disabled = true; return; }
    $('#autoConn').addEventListener('change', (e) => store.set('autoConn', e.target.checked));
    navigator.serial.addEventListener('connect', (e) => {
      if (store.get('autoConn', true) && S.mode === 'none') connectPort(e.target, true);
    });
    if (!store.get('autoConn', true)) return;
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length === 1 && S.mode === 'none') connectPort(ports[0], true);
    } catch (e) { /* ingen behörighet än */ }
  }

  /* ---------- Installera som app ---------- */
  let installEvt = null;
  function setupInstall() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const btns = [$('#btnInstall'), $('#btnInstall2')];
    const show = (on) => { $('#btnInstall').hidden = !on; $('#btnInstall2').disabled = !on; $('#btnInstall2').textContent = standalone ? 'Installerad' : on ? 'Installera' : 'Inte tillgänglig'; };
    show(false);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; show(true); });
    window.addEventListener('appinstalled', () => { installEvt = null; show(false); $('#btnInstall2').textContent = 'Installerad'; toast('Angelradio är installerad. Du hittar den i startmenyn och på skrivbordet.', 'ok', 5000); });
    const run = async () => {
      if (!installEvt) { toast('Öppna sidan i Chrome eller Edge och välj Installera i adressfältet.'); return; }
      installEvt.prompt();
      const r = await installEvt.userChoice;
      if (r.outcome === 'accepted') show(false);
    };
    btns.forEach((b) => b.addEventListener('click', run));
  }

  function init() {
    bind();
    setupInstall();
    renderSupport();
    setMode('none');
    renderAll();
    loadReleases();
    setTab(location.hash.slice(1) || 'oversikt', true);
    const params = new URLSearchParams(location.search);
    if (params.has('demo')) startDemo();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
    if (!params.has('demo')) autoConnect();
  }
  /* Exponeras för felsökning i konsolen */
  window.Angelradio = { state: S, startDemo, setTab };
  init();
})();
