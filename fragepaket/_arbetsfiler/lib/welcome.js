
/* ---------- Startsida: visas första gången, går att öppna igen via loggan ---------- */
const WL_KEY = 'egna10.welcomeSeen'; // delas mellan egna10 och egna20 (samma webbplats)
function wlSeen() { try { return localStorage.getItem(WL_KEY) === '1'; } catch (e) { return true; } }
function wlShow() {
  const w = $('#welcome'); if (!w) return;
  w.querySelectorAll('.wl-never').forEach(c => { c.checked = true; });
  w.hidden = false; w.scrollTop = 0;
  document.body.classList.add('wl-open');
  w.tabIndex = -1;
  requestAnimationFrame(() => w.focus({ preventScroll: true }));
}
function wlClose(next) {
  const w = $('#welcome'); if (!w || w.hidden) return;
  const never = w.querySelector('.wl-never').checked;
  try { if (never) localStorage.setItem(WL_KEY, '1'); else localStorage.removeItem(WL_KEY); } catch (e) {}
  w.hidden = true;
  document.body.classList.remove('wl-open');
  if (next === 'lib' && typeof openLibrary === 'function') openLibrary();
}
function bindWelcome() {
  const w = $('#welcome'); if (!w) return;
  w.addEventListener('click', e => {
    const b = e.target.closest('[data-wl]');
    if (!b) return;
    if (b.dataset.wl === 'how') { $('#wlHow').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    wlClose(b.dataset.wl);
  });
  // två kryssrutor (dator och mobil) – håll dem i takt
  w.addEventListener('change', e => {
    if (e.target.classList.contains('wl-never')) w.querySelectorAll('.wl-never').forEach(c => { c.checked = e.target.checked; });
  });
  // Esc stänger; andra kortkommandon i appen ska inte gälla medan startsidan är öppen
  document.addEventListener('keydown', e => {
    if (w.hidden) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); wlClose(); }
  }, true);
  const brand = $('.toolbar .brand');
  if (brand) {
    brand.setAttribute('role', 'button'); brand.tabIndex = 0;
    brand.title = 'Visa startsidan';
    brand.classList.add('wl-brandbtn');
    brand.addEventListener('click', wlShow);
    brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wlShow(); } });
  }
  if (!wlSeen()) wlShow();
}
