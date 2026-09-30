'use strict';
/* =====================================================================
   Egna10 – bibliotek: färdiga frågepaket (mappen fragepaket bredvid sidan)
   och egna paket (sparade i webbläsaren). Man väljer hela paket, de bästa
   hälften/fjärdedelen eller enskilda frågor och lägger in dem i kortleken.
   ===================================================================== */

const LIB_BASE = new URL('../fragepaket/', location.href).href;
const LIB_TYPE_SHORT = { sant: 'Sant/falskt', siffra: 'Siffra', ordning: 'Ordning', tid: 'Tid', farg: 'Färg', ovrigt: 'Övrigt' };
const lib = {
  packs: [],            // { id, src: 'site'|'mine', file, name, desc, color, count, qs: null|[{ q, score }], loading, error }
  cur: null,            // valt paket (id)
  sel: new Map(),       // nyckel "paketid#index" -> { id, i }
  search: '',
  siteState: 'idle',    // idle | loading | ok | fail
  opened: false,
};

/* ---------- Hjälpfunktioner ---------- */
function libNorm(s) { return String(s || '').replace(/[|~]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); }
function libSig(q) { return libNorm(q.text) + '§' + q.alts.map(a => libNorm(a.text) || (a.img ? 'bild' : '')).join('§'); }
function libKey(id, i) { return id + '#' + i; }
function libPack(id) { return lib.packs.find(p => p.id === id); }
function libDeckSigs() {
  const s = new Set();
  for (const c of state.deck.cards) for (const q of c.sides) if (q.text.trim() || q.alts.some(a => a.text || a.img)) s.add(libSig(q));
  return s;
}
function libFlatten(deck) {
  // Gör om en kortlek till en lista med frågor (framsida, baksida, framsida …) med ev. betyg
  const clean = sanitizeDeck({ cards: Array.isArray(deck.cards) ? deck.cards : [] });
  const out = [];
  clean.cards.forEach((c, ci) => c.sides.forEach((q, si) => {
    const raw = deck.cards[ci] && deck.cards[ci].sides && deck.cards[ci].sides[si] || {};
    const empty = !q.text.trim() && q.alts.every(a => !a.text && !a.img);
    if (empty) return;
    const sc = Number(raw.score);
    out.push({ q, score: isFinite(sc) && sc > 0 ? sc : null });
  }));
  return out;
}
function libFill(q) { // hur komplett en fråga är (0–1), används som betyg när paketet saknar betyg
  let n = q.text.trim() ? 1 : 0;
  q.alts.forEach((a, i) => { if (a.text || a.img) n++; const f = q.ans[i]; if (f.text || f.img || f.mark || f.color) n++; });
  return n / 21;
}
function libRanked(p) {
  const s = (x) => x.score != null ? x.score : 2.5 + libFill(x.q);
  return p.qs.map((x, i) => i).sort((a, b) => (s(p.qs[b]) - s(p.qs[a])) || (a - b));
}
function libShares(n) { return { half: Math.max(1, Math.round(n / 2)), quarter: Math.max(1, Math.round(n / 4)) }; }
function libSelCount(id) { let n = 0; for (const v of lib.sel.values()) if (v.id === id) n++; return n; }

/* ---------- Läsa paket från mappen ---------- */
async function libFetchJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
  return JSON.parse(await r.text());
}
async function libDiscoverSite() {
  const found = new Map();
  let ok = false;
  try {
    const j = await libFetchJSON(LIB_BASE + 'index.json');
    for (const p of j.packs || []) if (p && p.file) found.set(p.file, p);
    ok = true;
  } catch (e) { /* ingen index.json */ }
  // Hitta även filer som lagts i mappen men inte står i index.json
  try {
    const gh = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (gh) {
      const path = new URL(LIB_BASE).pathname.replace(/^\/+|\/+$/g, '');
      const r = await fetch(`https://api.github.com/repos/${gh[1]}/${gh[1]}.github.io/contents/${path}`);
      if (r.ok) {
        for (const it of await r.json()) if (it && /\.egna10$/i.test(it.name) && !found.has(it.name)) found.set(it.name, { file: it.name });
        ok = true;
      }
    } else if (/^https?:$/.test(location.protocol)) {
      const r = await fetch(LIB_BASE, { cache: 'no-cache' });
      if (r.ok && /html/i.test(r.headers.get('content-type') || '')) {
        const html = await r.text();
        for (const m of html.matchAll(/href=["']([^"'?#]+\.egna10)["']/gi)) {
          const f = decodeURIComponent(m[1].split('/').pop());
          if (!found.has(f)) found.set(f, { file: f });
        }
        ok = true;
      }
    }
  } catch (e) { /* ingen listning */ }
  return { ok, list: [...found.values()] };
}
async function libLoadSite() {
  if (lib.siteState === 'loading') return;
  lib.siteState = 'loading'; libRenderPacks();
  const { ok, list } = await libDiscoverSite();
  lib.packs = lib.packs.filter(p => p.src !== 'site');
  const site = list.map(m => ({
    id: 'site:' + m.file, src: 'site', file: m.file,
    name: m.name || m.file.replace(/\.egna10$/i, ''), desc: m.description || '', color: m.color || '#8a8f98',
    count: m.questions || null, qs: null, meta: !!m.name,
  }));
  lib.packs = [...site, ...lib.packs];
  lib.siteState = ok && site.length ? 'ok' : 'fail';
  libRenderPacks();
  // filer utan uppgifter i index.json läses direkt så att namn och antal syns
  site.filter(p => !p.meta).forEach(p => libEnsure(p).then(libRenderPacks));
}
async function libEnsure(p) {
  if (!p || p.qs) return p;
  if (p.loading) return p.loading;
  p.loading = (async () => {
    try {
      const d = await libFetchJSON(LIB_BASE + encodeURIComponent(p.file));
      if (!d || !Array.isArray(d.cards)) throw new Error('fel format');
      p.qs = libFlatten(d);
      p.count = p.qs.length;
      if (!p.meta) { p.name = d.name || p.name; p.desc = d.description || p.desc; p.color = d.color || p.color; }
    } catch (e) { p.error = 'Kunde inte läsa ' + p.file; p.qs = []; }
    p.loading = null;
    return p;
  })();
  return p.loading;
}

/* ---------- Egna paket (sparas i webbläsaren, delas mellan egna10 och egna20) ---------- */
async function libLoadMine() {
  let arr = [];
  try { arr = (await DB.get('library')) || []; } catch (e) { /* ingen lagring */ }
  lib.packs = lib.packs.filter(p => p.src !== 'mine');
  for (const m of arr) {
    const qs = libFlatten(m.deck || {});
    lib.packs.push({ id: 'mine:' + m.id, src: 'mine', mid: m.id, name: m.name || 'Namnlös', desc: m.desc || '', color: m.color || '#9aa3ad', count: qs.length, qs });
  }
}
async function libStoreMine(entry) {
  let arr = [];
  try { arr = (await DB.get('library')) || []; } catch (e) { /* tomt */ }
  const i = arr.findIndex(x => x.id === entry.id);
  if (i >= 0) arr[i] = entry; else arr.push(entry);
  await DB.set('library', arr);
}
async function libRemoveMine(mid) {
  let arr = [];
  try { arr = (await DB.get('library')) || []; } catch (e) { /* tomt */ }
  await DB.set('library', arr.filter(x => x.id !== mid));
}
async function libAddFiles(files) {
  let added = 0, bad = [];
  for (const f of files) {
    if (!/\.(egna10|egnatio|json)$/i.test(f.name)) continue;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.cards)) throw new Error('fel format');
      const name = d.name && d.name !== 'Mina frågor' ? d.name : f.name.replace(/\.(egna10|egnatio|json)$/i, '');
      await libStoreMine({ id: uid() + uid(), name, desc: d.description || '', color: d.color || '', added: Date.now(), deck: { name, cards: d.cards } });
      added++;
    } catch (e) { bad.push(f.name); }
  }
  await libLoadMine();
  libRenderPacks();
  const last = lib.packs.filter(p => p.src === 'mine').pop();
  if (added && last) libShowPack(last.id);
  setLibInfo(added ? `${added} ${added === 1 ? 'paket' : 'paket'} tillagda under Mina paket.` + (bad.length ? ` Kunde inte läsa: ${bad.join(', ')}.` : '') : (bad.length ? `Kunde inte läsa: ${bad.join(', ')}.` : 'Hittade inga .egna10-filer.'));
}
async function libSaveDeck() {
  const def = state.deck.name && state.deck.name !== 'Mina frågor' ? state.deck.name : 'Min kortlek';
  const name = prompt('Namn på paketet i biblioteket:', def);
  if (name === null) return;
  const nm = name.trim() || def;
  const existing = lib.packs.find(p => p.src === 'mine' && p.name.toLowerCase() === nm.toLowerCase());
  if (existing && !confirm(`Det finns redan ett paket som heter ”${nm}”. Ersätta det?`)) return;
  const deck = JSON.parse(JSON.stringify({ name: nm, cards: state.deck.cards }));
  await libStoreMine({ id: existing ? existing.mid : uid() + uid(), name: nm, desc: `${state.deck.cards.length} kort från din kortlek`, added: Date.now(), deck });
  await libLoadMine();
  libRenderPacks();
  const p = lib.packs.find(x => x.src === 'mine' && x.name === nm);
  if (p) libShowPack(p.id);
  setLibInfo(`Kortleken är sparad i biblioteket som ”${nm}”.`);
}

/* ---------- Rita biblioteket ---------- */
function setLibInfo(s) { const el = $('#libInfo'); if (el) el.textContent = s || ''; }
function libRenderPacks() {
  const site = lib.packs.filter(p => p.src === 'site'), mine = lib.packs.filter(p => p.src === 'mine');
  const item = p => {
    const n = libSelCount(p.id);
    return `<li class="libp${p.id === lib.cur && !lib.search ? ' cur' : ''}" data-id="${esc(p.id)}" tabindex="0">
      <span class="libp-dot" style="background:${esc(p.color || '#999')}"></span>
      <span class="libp-name">${esc(p.name)}</span>
      <span class="libp-n">${p.count != null ? p.count : ''}</span>
      ${n ? `<span class="libp-sel" title="${n} valda">${n}</span>` : ''}
      ${p.src === 'mine' ? `<button type="button" class="libp-x" title="Ta bort ur biblioteket" aria-label="Ta bort ${esc(p.name)}">×</button>` : ''}
    </li>`;
  };
  $('#libPacks').innerHTML = site.map(item).join('') || `<li class="libp-empty">${lib.siteState === 'loading' ? 'Letar efter paket…' : 'Inga paket hittades'}</li>`;
  $('#libMine').innerHTML = mine.map(item).join('') || '<li class="libp-empty">Inga egna paket än</li>';
  const note = $('#libSiteNote');
  if (lib.siteState === 'fail') {
    note.hidden = false;
    note.textContent = location.protocol === 'file:'
      ? 'Mappen fragepaket kan inte läsas när sidan öppnas direkt från disken. Öppna sidan via webbadressen eller Live Server – eller tryck ”Öppna mapp…” och välj mappen fragepaket.'
      : 'Hittade ingen mapp ”fragepaket” bredvid sidan. Du kan lägga till paket med ”Lägg till fil…” eller ”Öppna mapp…”.';
  } else note.hidden = true;
  libRenderFoot();
}
function libRowHTML(p, i, showPack) {
  const x = p.qs[i], q = x.q, key = libKey(p.id, i);
  const sel = lib.sel.has(key), inDeck = libRowInDeck.has(libSig(q));
  const alts = q.alts.map(a => a.text ? a.text.replace(/[|~]/g, ' ') : (a.img ? '[bild]' : '')).filter(Boolean);
  const stars = x.score != null ? `<span class="libq-stars" title="Betyg ${x.score} av 5">${'★'.repeat(Math.round(x.score))}<i>${'★'.repeat(5 - Math.round(x.score))}</i></span>` : '';
  return `<li class="libq${sel ? ' sel' : ''}${inDeck ? ' indeck' : ''}" data-key="${esc(key)}">
    <label class="libq-main">
      <input type="checkbox"${sel ? ' checked' : ''}>
      <span class="libq-body">
        <span class="libq-top"><span class="libq-type"><i style="background:${ringColor(q)}"></i>${LIB_TYPE_SHORT[q.type] || ''}</span>${stars}${showPack ? `<span class="libq-pack">${esc(p.name)}</span>` : ''}${inDeck ? '<span class="libq-in">I kortleken</span>' : ''}</span>
        <span class="libq-text">${esc(q.text.replace(/[|~]/g, ' ').trim() || '(ingen fråga)')}</span>
        <span class="libq-alts">${esc(alts.slice(0, 5).join(' · '))}${alts.length > 5 ? ' …' : ''}</span>
      </span>
    </label>
    <button type="button" class="libq-peek" aria-expanded="false" title="Visa hela kortet">Visa</button>
    <div class="libq-pv" hidden></div>
  </li>`;
}
let libRowInDeck = new Set();
function libRenderMain() {
  libRowInDeck = libDeckSigs();
  const box = $('#libQs'), head = $('#libHead');
  if (lib.search) {
    const s = libNorm(lib.search), hits = [];
    for (const p of lib.packs) if (p.qs) p.qs.forEach((x, i) => {
      const hay = libNorm(x.q.text) + ' ' + x.q.alts.map(a => libNorm(a.text)).join(' ') + ' ' + x.q.ans.map(a => libNorm(a.text)).join(' ');
      if (hay.includes(s)) hits.push([p, i]);
    });
    const loading = lib.packs.some(p => p.src === 'site' && !p.qs);
    head.innerHTML = `<h3 class="lib-title">Sökresultat</h3><p class="lib-desc">${hits.length} ${hits.length === 1 ? 'fråga' : 'frågor'} för ”${esc(lib.search)}”${loading ? ' – letar i fler paket…' : ''}</p>
      <div class="libpick"><button type="button" data-pick="hits">Välj alla träffar</button><button type="button" data-pick="unhits">Avmarkera träffarna</button></div>`;
    box.innerHTML = hits.slice(0, 400).map(([p, i]) => libRowHTML(p, i, true)).join('') || '<li class="libq-empty">Inga frågor matchar sökningen.</li>';
    box.dataset.hits = JSON.stringify(hits.map(([p, i]) => libKey(p.id, i)));
    return;
  }
  const p = libPack(lib.cur);
  if (!p) { head.innerHTML = '<h3 class="lib-title">Bibliotek</h3><p class="lib-desc">Välj ett paket till vänster.</p>'; box.innerHTML = ''; return; }
  if (!p.qs) {
    head.innerHTML = `<h3 class="lib-title">${esc(p.name)}</h3><p class="lib-desc">Laddar frågor…</p>`; box.innerHTML = '';
    libEnsure(p).then(() => { if (lib.cur === p.id && !lib.search) { libRenderMain(); libRenderPacks(); } });
    return;
  }
  const n = p.qs.length, sh = libShares(n), cnt = libSelCount(p.id);
  const scored = p.qs.some(x => x.score != null);
  head.innerHTML = `<h3 class="lib-title"><span class="libp-dot" style="background:${esc(p.color || '#999')}"></span>${esc(p.name)}</h3>
    <p class="lib-desc">${esc(p.desc || '')}${p.desc ? ' · ' : ''}${n} frågor${cnt ? ` · <b>${cnt} valda</b>` : ''}${p.error ? ` · <span class="bad">${esc(p.error)}</span>` : ''}</p>
    <div class="libpick" role="group" aria-label="Välj frågor i paketet">
      <span class="libpick-l">Välj:</span>
      <button type="button" data-pick="all">Alla <small>${n}</small></button>
      <button type="button" data-pick="half" title="${scored ? 'De frågor som har högst betyg' : 'De mest kompletta frågorna'}">Bästa hälften <small>${sh.half}</small></button>
      <button type="button" data-pick="quarter" title="${scored ? 'De frågor som har högst betyg' : 'De mest kompletta frågorna'}">Bästa fjärdedelen <small>${sh.quarter}</small></button>
      <button type="button" data-pick="none">Ingen</button>
    </div>`;
  box.innerHTML = n ? p.qs.map((x, i) => libRowHTML(p, i, false)).join('') : '<li class="libq-empty">Paketet innehåller inga frågor.</li>';
  delete box.dataset.hits;
}
function libRenderFoot() {
  const n = lib.sel.size, add = $('#libAdd'), info = $('#libCount');
  if (!add) return;
  if (!n) { info.textContent = 'Inga frågor valda – kryssa i frågor eller använd knapparna Alla / Bästa hälften.'; add.disabled = true; add.querySelector('span').textContent = 'Lägg till i kortleken'; return; }
  const sigs = libDeckSigs(); let dup = 0; const packs = new Set();
  for (const v of lib.sel.values()) { const p = libPack(v.id); packs.add(v.id); if (p && p.qs && sigs.has(libSig(p.qs[v.i].q))) dup++; }
  const nn = n - dup;
  info.innerHTML = `<b>${n} ${n === 1 ? 'fråga' : 'frågor'}</b> valda från ${packs.size} ${packs.size === 1 ? 'paket' : 'paket'}` +
    (nn > 0 ? ` = ${Math.ceil(nn / 2)} kort` : '') + (dup ? ` · ${dup} finns redan i kortleken och hoppas över` : '') + (nn % 2 ? ' · udda antal, sista kortet får en tom baksida' : '');
  add.disabled = nn === 0;
  add.querySelector('span').textContent = nn ? `Lägg till ${nn} ${nn === 1 ? 'fråga' : 'frågor'}` : 'Lägg till i kortleken';
}
function libShowPack(id) {
  lib.cur = id; lib.search = ''; $('#libSearch').value = '';
  $('#libBody').classList.add('showq');
  libRenderPacks(); libRenderMain();
  $('#libQs').scrollTop = 0; const m = $('.libmain'); if (m) m.scrollTop = 0;
}
function libSetSel(key, on) {
  const [id, i] = [key.slice(0, key.lastIndexOf('#')), Number(key.slice(key.lastIndexOf('#') + 1))];
  if (on) lib.sel.set(key, { id, i }); else lib.sel.delete(key);
}
function libPick(kind) {
  if (kind === 'hits' || kind === 'unhits') {
    const keys = JSON.parse($('#libQs').dataset.hits || '[]');
    keys.forEach(k => libSetSel(k, kind === 'hits'));
  } else {
    const p = libPack(lib.cur); if (!p || !p.qs) return;
    for (const k of [...lib.sel.keys()]) if (lib.sel.get(k).id === p.id) lib.sel.delete(k);
    const sh = libShares(p.qs.length), ranked = libRanked(p);
    const take = kind === 'all' ? ranked : kind === 'half' ? ranked.slice(0, sh.half) : kind === 'quarter' ? ranked.slice(0, sh.quarter) : [];
    take.forEach(i => libSetSel(libKey(p.id, i), true));
  }
  libRenderMain(); libRenderPacks();
}

/* ---------- Lägga in i kortleken ---------- */
function libPair(qs) {
  // Parar ihop frågorna två och två (fram/bak) – helst olika frågetyper på samma kort
  const rest = qs.slice(), cards = [];
  while (rest.length) {
    const a = rest.shift();
    let j = rest.findIndex(b => b.type !== a.type);
    if (j < 0) j = 0;
    const b = rest.length ? rest.splice(j, 1)[0] : null;
    cards.push([a, b]);
  }
  return cards;
}
async function libAddSelected() {
  const order = new Map(lib.packs.map((p, i) => [p.id, i]));
  const items = [...lib.sel.values()].sort((a, b) => (order.get(a.id) - order.get(b.id)) || (a.i - b.i));
  const sigs = libDeckSigs(), seen = new Set(), qs = [];
  let dup = 0;
  for (const it of items) {
    const p = libPack(it.id); if (!p || !p.qs || !p.qs[it.i]) continue;
    const q = JSON.parse(JSON.stringify(p.qs[it.i].q)), s = libSig(q);
    if (sigs.has(s) || seen.has(s)) { dup++; continue; }
    seen.add(s); qs.push(q);
  }
  if (!qs.length) { alert('Alla valda frågor finns redan i kortleken.'); return; }
  if ($('#libShuffle').checked) for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
  const cards = libPair(qs).map(([a, b]) => { const c = newCard(); c.sides[0] = a; c.sides[1] = b || newQuestion(a.type === 'sant' ? 'ovrigt' : 'sant'); return c; });
  const onlyEmpty = state.deck.cards.length === 1 && isEmptyCard(state.deck.cards[0]);
  const at = onlyEmpty ? 0 : state.deck.cards.length;
  if (onlyEmpty) state.deck.cards = cards; else state.deck.cards.push(...cards);
  state.status.clear();
  lib.sel.clear();
  selectCard(at, 0);
  await saveNow();
  $('#dlgLib').close();
  setStatus(`La till ${qs.length} ${qs.length === 1 ? 'fråga' : 'frågor'} (${cards.length} kort) från biblioteket` + (dup ? ` – ${dup} fanns redan och hoppades över` : '') + (qs.length % 2 ? '. Sista kortets baksida är tom.' : '.'));
  if (typeof isMobile === 'function' && isMobile() && typeof setView === 'function') setView('cards');
}

/* ---------- Öppna och koppla ihop ---------- */
async function openLibrary() {
  const dlg = $('#dlgLib');
  lib.search = ''; $('#libSearch').value = '';
  setLibInfo('');
  dlg.showModal();
  if (!lib.opened) {
    lib.opened = true;
    await libLoadMine();
    libRenderPacks(); libRenderMain();
    await libLoadSite();
    if (!lib.cur) { const first = lib.packs[0]; if (first) { lib.cur = first.id; } }
    if (!isMobile()) $('#libBody').classList.add('showq');
  } else {
    await libLoadMine();
    if (lib.siteState === 'fail' || lib.siteState === 'idle') libLoadSite();
  }
  libRenderPacks(); libRenderMain();
}
function bindLibrary() {
  const dlg = $('#dlgLib'); if (!dlg) return;
  $$('.js-lib').forEach(b => b.addEventListener('click', openLibrary));
  const lists = [$('#libPacks'), $('#libMine')];
  lists.forEach(ul => {
    ul.addEventListener('click', async e => {
      const li = e.target.closest('.libp'); if (!li) return;
      const p = libPack(li.dataset.id); if (!p) return;
      if (e.target.closest('.libp-x')) {
        if (!confirm(`Ta bort ”${p.name}” ur biblioteket? (Kortleken påverkas inte.)`)) return;
        await libRemoveMine(p.mid);
        for (const k of [...lib.sel.keys()]) if (lib.sel.get(k).id === p.id) lib.sel.delete(k);
        if (lib.cur === p.id) lib.cur = (lib.packs[0] || {}).id || null;
        await libLoadMine(); libRenderPacks(); libRenderMain();
        return;
      }
      libShowPack(p.id);
    });
    ul.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('libp')) { e.preventDefault(); libShowPack(e.target.dataset.id); } });
  });
  $('#libBack').addEventListener('click', () => { $('#libBody').classList.remove('showq'); });
  $('#libHead').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) libPick(b.dataset.pick); });
  const qs = $('#libQs');
  qs.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;
    const li = e.target.closest('.libq'); libSetSel(li.dataset.key, e.target.checked);
    li.classList.toggle('sel', e.target.checked);
    libRenderPacks();
    if (!lib.search) { const p = libPack(lib.cur); const d = $('#libHead .lib-desc'); if (p && d) libRenderMainDesc(p); }
  });
  qs.addEventListener('click', e => {
    const b = e.target.closest('.libq-peek'); if (!b) return;
    const li = b.closest('.libq'), pv = li.querySelector('.libq-pv');
    const open = pv.hidden;
    if (open && !pv.innerHTML) {
      const k = li.dataset.key, id = k.slice(0, k.lastIndexOf('#')), i = Number(k.slice(k.lastIndexOf('#') + 1));
      const p = libPack(id);
      if (p && p.qs[i]) pv.innerHTML = sceneToSVG(buildSide(p.qs[i].q, state.deck, {}), { cssSize: '100%' });
    }
    pv.hidden = !open; b.textContent = open ? 'Dölj' : 'Visa'; b.setAttribute('aria-expanded', String(open));
  });
  let st = 0;
  $('#libSearch').addEventListener('input', e => {
    clearTimeout(st);
    st = setTimeout(async () => {
      lib.search = e.target.value.trim();
      if (lib.search) $('#libBody').classList.add('showq');
      libRenderMain(); libRenderPacks();
      if (lib.search) {
        const todo = lib.packs.filter(p => !p.qs);
        if (todo.length) { await Promise.all(todo.map(libEnsure)); if (lib.search) libRenderMain(); libRenderPacks(); }
      }
    }, 160);
  });
  $('#libClear').addEventListener('click', () => { lib.sel.clear(); libRenderMain(); libRenderPacks(); });
  $('#libAdd').addEventListener('click', libAddSelected);
  $('#libFileBtn').addEventListener('click', () => $('#libFile').click());
  $('#libDirBtn').addEventListener('click', () => $('#libDir').click());
  $('#libFile').addEventListener('change', e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) libAddFiles(f); });
  $('#libDir').addEventListener('change', e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) libAddFiles(f); });
  $('#libSaveDeck').addEventListener('click', libSaveDeck);
  dlg.addEventListener('dragover', e => { if ([...(e.dataTransfer.items || [])].some(i => i.kind === 'file')) e.preventDefault(); });
  dlg.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); const f = [...(e.dataTransfer.files || [])]; if (f.length) libAddFiles(f); });
  window.addEventListener('keydown', e => { if (dlg.open && e.key === '/' && document.activeElement !== $('#libSearch') && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); $('#libSearch').focus(); } });
}
function libRenderMainDesc(p) {
  const n = p.qs.length, cnt = libSelCount(p.id), d = $('#libHead .lib-desc'); if (!d) return;
  d.innerHTML = `${esc(p.desc || '')}${p.desc ? ' · ' : ''}${n} frågor${cnt ? ` · <b>${cnt} valda</b>` : ''}`;
}
