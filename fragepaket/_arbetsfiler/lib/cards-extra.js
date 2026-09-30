'use strict';
/* =====================================================================
   Egna10 – markera flera kort (kryssrutor på datorn, håll in på mobilen)
   och sortera kortleken.
   ===================================================================== */
const cardSel = { ids: new Set(), anchor: null, mode: false, undo: null, lpTimer: 0, lpFired: false };

function csCount() { return cardSel.ids.size; }
function csIndices() { return state.deck.cards.map((c, i) => cardSel.ids.has(c.id) ? i : -1).filter(i => i >= 0); }
function csPrune() { const ids = new Set(state.deck.cards.map(c => c.id)); for (const id of [...cardSel.ids]) if (!ids.has(id)) cardSel.ids.delete(id); }
function csToggle(i, on) {
  const c = state.deck.cards[i]; if (!c) return;
  const v = on === undefined ? !cardSel.ids.has(c.id) : on;
  if (v) cardSel.ids.add(c.id); else cardSel.ids.delete(c.id);
  cardSel.anchor = i;
}
function csRange(i) {
  const a = cardSel.anchor == null ? i : cardSel.anchor;
  const [lo, hi] = a < i ? [a, i] : [i, a];
  for (let k = lo; k <= hi; k++) cardSel.ids.add(state.deck.cards[k].id);
}
function csClear() { cardSel.ids.clear(); cardSel.mode = false; cardSel.anchor = null; csRender(); }
function csRender() {
  csPrune();
  const n = csCount(), total = state.deck.cards.length;
  if (!n) cardSel.mode = false;
  document.body.classList.toggle('selmode', cardSel.mode || n > 0);
  $$('#cardList li').forEach(li => {
    const c = state.deck.cards[Number(li.dataset.i)];
    const on = !!c && cardSel.ids.has(c.id);
    li.classList.toggle('mk', on);
    const ck = li.querySelector('.ck'); if (ck) ck.checked = on;
  });
  const all = $('#ckAll');
  if (all) { all.checked = n > 0 && n === total; all.indeterminate = n > 0 && n < total; }
  const bar = $('#selBar');
  if (bar) {
    bar.hidden = !n;
    $('#selInfo').textContent = n ? `${n} markerade – knapparna ovan gäller ${n === 1 ? 'det' : 'alla'}` : '';
  }
  const srt = $('#cardSort');
  if (srt) {
    const u = srt.querySelector('option[value="undo"]'); if (u) u.disabled = !cardSel.undo;
    srt.options[0].textContent = n > 1 ? `Sortera ${n} markerade…` : 'Sortera…';
  }
}

/* ---------- Klick, kryssrutor och håll-in ---------- */
function csListClick(e) {
  const li = e.target.closest('li'); if (!li) return;
  const i = Number(li.dataset.i);
  if (cardSel.lpFired) { cardSel.lpFired = false; e.preventDefault(); return; }
  if (e.target.classList.contains('ck')) {
    if (e.shiftKey) csRange(i); else csToggle(i, e.target.checked);
    csRender(); return;
  }
  if (e.shiftKey && !isMobile()) { e.preventDefault(); csRange(i); csRender(); return; }
  if ((e.ctrlKey || e.metaKey) && !isMobile()) { e.preventDefault(); csToggle(i); csRender(); return; }
  if (isMobile() && (cardSel.mode || csCount())) { csToggle(i); if (!csCount()) cardSel.mode = false; csRender(); return; }
  selectCard(i);
  if (isMobile()) setView('editor');
}
function csBindLongPress(ol) {
  let sx = 0, sy = 0;
  const cancel = () => { clearTimeout(cardSel.lpTimer); cardSel.lpTimer = 0; };
  ol.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const li = e.target.closest('li'); if (!li) return;
    sx = e.clientX; sy = e.clientY; cardSel.lpFired = false;
    cancel();
    cardSel.lpTimer = setTimeout(() => {
      cardSel.lpFired = true; cardSel.mode = true;
      csToggle(Number(li.dataset.i), true); csRender();
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (err) { /* ok */ }
    }, 450);
  });
  ol.addEventListener('pointermove', e => { if (cardSel.lpTimer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => ol.addEventListener(t, cancel));
  ol.addEventListener('contextmenu', e => { if (e.target.closest('li') && (cardSel.lpFired || cardSel.lpTimer || isMobile())) e.preventDefault(); });
}

/* ---------- Åtgärder på markerade kort ---------- */
function csAfterChange(cur) {
  state.status.clear();
  selectCard(Math.max(0, Math.min(state.deck.cards.length - 1, cur)));
  scheduleSave(); csRender();
}
function csDelete() {
  const idx = csIndices(), n = idx.length;
  if (!confirm(`Ta bort ${n} ${n === 1 ? 'kort' : 'kort'}?`)) return;
  state.deck.cards = state.deck.cards.filter(c => !cardSel.ids.has(c.id));
  if (!state.deck.cards.length) state.deck.cards.push(newCard());
  cardSel.ids.clear(); cardSel.mode = false;
  csAfterChange(idx[0]);
  setStatus(`${n} kort borttagna.`);
}
function csDuplicate() {
  const out = [], copies = [];
  for (const c of state.deck.cards) {
    out.push(c);
    if (cardSel.ids.has(c.id)) { const d = JSON.parse(JSON.stringify(c)); d.id = uid(); out.push(d); copies.push(d.id); }
  }
  state.deck.cards = out;
  cardSel.ids = new Set(copies);
  csAfterChange(state.deck.cards.findIndex(c => c.id === copies[0]));
  setStatus(`${copies.length} kort duplicerade – kopiorna är markerade.`);
}
function csMove(d) {
  const a = state.deck.cards, idx = csIndices();
  if (!idx.length) return;
  if (d < 0 && idx[0] === 0) return;
  if (d > 0 && idx[idx.length - 1] === a.length - 1) return;
  const curId = curCard().id;
  const order = d < 0 ? idx : idx.slice().reverse();
  for (const i of order) [a[i], a[i + d]] = [a[i + d], a[i]];
  csAfterChange(a.findIndex(c => c.id === curId));
}

/* ---------- Sortering ---------- */
const CS_TYPE_ORDER = ['sant', 'siffra', 'ordning', 'tid', 'farg', 'ovrigt'];
function csText(c) { return (c.sides[0].text || c.sides[1].text || '').replace(/[|~]/g, ' ').trim(); }
function csScore(c) { return csCardScore(c); }
function csPack(c) { return c.sides[0].pack || c.sides[1].pack || ''; }
function csWarn(c) { const i = state.deck.cards.indexOf(c); return i >= 0 ? cardStatus(i) : 0; }
const CS_SORTS = {
  alpha: { label: 'frågetext A–Ö', cmp: (a, b) => csText(a).localeCompare(csText(b), 'sv') || 0, empty: c => !csText(c) },
  best: { label: 'betyg (bäst först)', cmp: (a, b) => csScore(b) - csScore(a), empty: c => !csScore(c) },
  worst: { label: 'betyg (sämst först)', cmp: (a, b) => csScore(a) - csScore(b), empty: c => !csScore(c) },
  pack: { label: 'paket', cmp: (a, b) => csPack(a).localeCompare(csPack(b), 'sv'), empty: c => !csPack(c) },
  type: { label: 'frågetyp', cmp: (a, b) => CS_TYPE_ORDER.indexOf(a.sides[0].type) - CS_TYPE_ORDER.indexOf(b.sides[0].type) },
  todo: { label: 'saker att kontrollera först', cmp: (a, b) => csWarn(b) - csWarn(a) },
};
function csSort(kind) {
  const cards = state.deck.cards;
  if (kind === 'undo') {
    if (!cardSel.undo) return;
    const byId = new Map(cards.map(c => [c.id, c]));
    const restored = cardSel.undo.map(id => byId.get(id)).filter(Boolean);
    for (const c of cards) if (!restored.includes(c)) restored.push(c);
    state.deck.cards = restored; cardSel.undo = null;
    csAfterChange(state.cur); setStatus('Sorteringen är ångrad.'); return;
  }
  const idx = csCount() > 1 ? csIndices() : cards.map((c, i) => i);
  const part = idx.map(i => cards[i]);
  cardSel.undo = cards.map(c => c.id);
  const curId = curCard().id;
  let label;
  if (kind === 'random') {
    for (let i = part.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [part[i], part[j]] = [part[j], part[i]]; }
    label = 'slumpvis ordning';
  } else if (kind === 'reverse') { part.reverse(); label = 'omvänd ordning'; }
  else {
    const S = CS_SORTS[kind]; if (!S) return;
    // stabil sortering; kort som saknar värdet (t.ex. inget paket) hamnar sist
    const dec = part.map((c, k) => ({ c, k, e: S.empty ? S.empty(c) : false }));
    dec.sort((x, y) => (x.e - y.e) || S.cmp(x.c, y.c) || (x.k - y.k));
    part.splice(0, part.length, ...dec.map(x => x.c));
    label = S.label;
  }
  idx.forEach((i, k) => { cards[i] = part[k]; });
  csAfterChange(cards.findIndex(c => c.id === curId));
  setStatus(`Sorterat efter ${label}${idx.length < cards.length ? ` (${idx.length} markerade kort)` : ''}. Välj ”Ångra senaste sortering” i sorteringslistan för att backa.`);
}

function bindCardSelect() {
  bindCardScore();
  const ol = $('#cardList');
  csBindLongPress(ol);
  $('#pCards').addEventListener('click', e => {
    const b = e.target.closest('#btnDelCard, #btnDupCard, #btnUp, #btnDown');
    if (!b || !csCount()) return;
    e.stopPropagation(); e.preventDefault();
    if (b.id === 'btnDelCard') csDelete();
    else if (b.id === 'btnDupCard') csDuplicate();
    else csMove(b.id === 'btnUp' ? -1 : 1);
  }, true);
  $('#ckAll').addEventListener('change', e => {
    if (e.target.checked) { state.deck.cards.forEach(c => cardSel.ids.add(c.id)); cardSel.mode = true; }
    else csClear();
    csRender();
  });
  $('#selDone').addEventListener('click', csClear);
  $('#cardSort').addEventListener('change', e => { const v = e.target.value; e.target.selectedIndex = 0; if (v) csSort(v); });
  ol.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); state.deck.cards.forEach(c => cardSel.ids.add(c.id)); csRender(); }
    if (e.key === 'Escape' && csCount()) { e.preventDefault(); csClear(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && csCount()) { e.preventDefault(); csDelete(); }
  });
}
function csCk(ci) { const c = state.deck.cards[ci]; return `<input type="checkbox" class="ck" tabindex="-1" aria-label="Markera kort ${ci + 1}"${c && cardSel.ids.has(c.id) ? ' checked' : ''}>`; }

/* ---------- Betyg för hela kortet (1–5 stjärnor) ---------- */
function csCardScore(c) {
  if (Number(c.score) > 0) return Number(c.score);
  const s = c.sides.map(q => Number(q.score) || 0).filter(Boolean);
  return s.length ? Math.round(s.reduce((x, y) => x + y) / s.length) : 0;
}
function csRenderScore() {
  const el = $('#cardScore'); if (!el) return;
  const c = curCard(), v = Number(c.score) || 0, auto = !v ? csCardScore(c) : 0;
  el.innerHTML = '<span class="cs-l">Kortets betyg</span>' + [1, 2, 3, 4, 5].map(i =>
    `<button type="button" class="cs-star${i <= v ? ' on' : i <= auto ? ' auto' : ''}" data-v="${i}" aria-label="${i} av 5" aria-pressed="${i <= v}">★</button>`).join('');
  el.title = v ? `Kortets betyg: ${v} av 5 (klicka på samma stjärna igen för att ta bort)` : auto ? `Inget eget betyg – frågorna från biblioteket har i snitt ${auto}` : 'Ge kortet ett betyg 1–5 (används för sortering och ”bästa” i biblioteket)';
}
function bindCardScore() {
  const el = $('#cardScore'); if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('.cs-star'); if (!b) return;
    const c = curCard(), v = Number(b.dataset.v);
    if (Number(c.score) === v) delete c.score; else c.score = v;
    csRenderScore(); refreshListItem(); scheduleSave();
  });
}
