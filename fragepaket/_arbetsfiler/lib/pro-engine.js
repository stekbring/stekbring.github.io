
/* =====================================================================
   Egna10 Pro – motor: layout, fria element, vattenstämpel, typsnitt.
   Allt mäts i millimeter på kortet (110 × 110), origo uppe till vänster.
   ===================================================================== */
const PRO_DEF = {
  rBig: 35, rSmall: 4.5,
  cDx: 0, cDy: 0, discR: 33, discHide: false,
  ringR: 16.2, ringW: 0.8, ringHide: false,
  qDx: 0, qDy: 0, qR: 14.6, qMax: 12, qMin: 6, qLines: 7, qFont: 'serif', qColor: '',
  altR: 24.5, altBox: 1, altMax: 7.7, altMin: 5, altImgD: 13.6, altFont: 'serif', altColor: '',
  lineW: 0.25, lineColor: '', spokesHide: false,
  aDx: 0, aDy: 0, ansR: 45, iconD: 7.4, ansBox: 1, ansMax: 7.7, ansMin: 4.5, ansImgD: 13, ansFont: 'serif', ansColor: '',
  tabX: 83, tabH: 10, labelMax: 10.5, labelFont: 'sans', tabHide: false,
  numX: 105.2, numY: 105.3, numPt: 6.2, numFont: 'serif', numColor: '',
};
const PRO_FONT_KEYS = ['qFont', 'altFont', 'ansFont', 'labelFont', 'numFont'];
let proD = PRO_DEF;
const G0 = Object.assign({}, G);

function proCleanDesign(d) {
  const out = {};
  if (!d || typeof d !== 'object') return out;
  for (const k of Object.keys(PRO_DEF)) {
    if (d[k] === undefined) continue;
    const def = PRO_DEF[k];
    if (typeof def === 'number') { const v = Number(d[k]); if (isFinite(v)) out[k] = v; }
    else if (typeof def === 'boolean') out[k] = !!d[k];
    else out[k] = String(d[k]);
  }
  if (d.style && typeof d.style === 'object') {
    const st = {};
    for (const k of Object.keys(DEFAULT_STYLE)) if (typeof d.style[k] === 'string' && d.style[k]) st[k] = d.style[k];
    if (Object.keys(st).length) out.style = st;
  }
  return out;
}
const PRO_ITEM_TYPES = ['text', 'img', 'rect', 'ellipse', 'line'];
function proCleanItem(it) {
  if (!it || !PRO_ITEM_TYPES.includes(it.type)) return null;
  const n = (v, d) => { v = Number(v); return isFinite(v) ? v : d; };
  return {
    id: String(it.id || uid()), type: it.type,
    x: n(it.x, 55), y: n(it.y, 55), w: n(it.w, 30), h: n(it.h, 20), rot: n(it.rot, 0), op: Math.max(0, Math.min(1, n(it.op, 1))),
    layer: it.layer === 'under' ? 'under' : 'over', on: ['side', 'all', 'front', 'back'].includes(it.on) ? it.on : 'side',
    text: String(it.text || ''), font: String(it.font || 'serif'), pt: n(it.pt, 10), color: String(it.color || '#262523'),
    align: ['left', 'center', 'right'].includes(it.align) ? it.align : 'center', lh: n(it.lh, 1.2),
    src: String(it.src || ''), fit: it.fit === 'contain' ? 'contain' : 'cover', rad: n(it.rad, 0),
    fill: String(it.fill === undefined ? '#ffffff' : it.fill), stroke: String(it.stroke === undefined ? '#262523' : it.stroke), sw: n(it.sw, 0.5),
  };
}
function proCleanWm(w) {
  w = w && typeof w === 'object' ? w : {};
  const n = (v, d) => { v = Number(v); return isFinite(v) ? v : d; };
  return {
    on: !!w.on, kind: w.kind === 'img' ? 'img' : 'text', text: w.text === undefined ? 'EGNA10' : String(w.text), img: String(w.img || ''),
    font: String(w.font || 'sans'), color: String(w.color || '#000000'), op: Math.max(0, Math.min(1, n(w.op, 0.12))),
    size: n(w.size, 16), rot: n(w.rot, -30), pos: ['center', 'tl', 'tr', 'bl', 'br', 'tile'].includes(w.pos) ? w.pos : 'center',
    sides: ['both', 'front', 'back'].includes(w.sides) ? w.sides : 'both', layer: w.layer === 'under' ? 'under' : 'over',
  };
}
function proCleanDeck(p) {
  p = p && typeof p === 'object' ? p : {};
  const out = {
    design: proCleanDesign(p.design),
    items: (Array.isArray(p.items) ? p.items : []).map(proCleanItem).filter(Boolean).map(it => { if (it.on === 'side') it.on = 'all'; return it; }),
    wm: proCleanWm(p.wm),
    fonts: (Array.isArray(p.fonts) ? p.fonts : []).filter(f => f && f.id && f.b64 && f.widths).map(f => ({
      id: String(f.id), name: String(f.name || f.id), b64: String(f.b64), widths: f.widths,
      top: Number(f.top) || 0.75, bottom: Number(f.bottom) || 0.22, mid: Number(f.mid) || 0.33, src: f.src ? String(f.src) : '',
    })),
  };
  out.fonts.forEach(proRegisterFont);
  return out;
}
function proCleanSide(p) {
  if (!p || typeof p !== 'object') return undefined;
  const out = { design: proCleanDesign(p.design), items: (Array.isArray(p.items) ? p.items : []).map(proCleanItem).filter(Boolean).map(it => { it.on = 'side'; return it; }) };
  if (p.noWm) out.noWm = true;
  if (!Object.keys(out.design).length && !out.items.length && !out.noWm) return undefined;
  return out;
}

/* ---------- Typsnitt ---------- */
const PRO_FONT_LOADED = new Set();
function proFontKey(id) { return 'f_' + id; }
function proRegisterFont(f) {
  const key = proFontKey(f.id);
  if (!FONTS[key]) {
    FONTS[key] = { family: 'PF' + f.id, file: 'pf' + f.id + '.ttf', b64: () => f.b64, top: f.top, bottom: f.bottom, mid: f.mid, name: f.name };
    WIDTHS[key] = f.widths;
  }
  if (!PRO_FONT_LOADED.has(key) && typeof FontFace !== 'undefined') {
    PRO_FONT_LOADED.add(key);
    try {
      const bin = atob(f.b64), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const ff = new FontFace(FONTS[key].family, u.buffer);
      ff.load().then(() => { document.fonts.add(ff); if (state && state.deck && typeof renderPreview === 'function') { renderPreview(); if (typeof proRefreshFontsUI === 'function') proRefreshFontsUI(); } }).catch(() => {});
    } catch (e) { /* trasigt typsnitt – reservtypsnitt används */ }
  }
  return key;
}
function proFontName(key) {
  if (key === 'serif') return 'EB Garamond';
  if (key === 'sans') return 'Montserrat ExtraBold';
  return (FONTS[key] && FONTS[key].name) || key;
}
function proFontOK(k) { return FONTS[k] ? k : 'serif'; }

/* ---------- Var på kortet (för en viss sida) ---------- */
function proSideIndex(q, deck, opt) {
  if (opt && (opt.si === 0 || opt.si === 1)) return opt.si;
  for (const c of deck.cards || []) { if (c.sides[0] === q) return 0; if (c.sides[1] === q) return 1; }
  return 0;
}
function proDesign(deck, q) {
  const gd = (deck.pro && deck.pro.design) || {}, sd = (q && q.pro && q.pro.design) || {};
  const D = Object.assign({}, PRO_DEF, gd, sd);
  D.style = Object.assign({}, gd.style || {}, sd.style || {});
  for (const k of PRO_FONT_KEYS) D[k] = FONTS[D[k]] ? D[k] : PRO_DEF[k];
  return D;
}
function atAns(i) { const [ux, uy] = spoke(i); return [55 + proD.aDx + ux * G.ANS_R, 55 + proD.aDy + uy * G.ANS_R]; }
function atBox(i, r) { const [ux, uy] = spoke(i); return [55 + ux * r, 55 + uy * r]; }
function proApplyG(D) {
  Object.assign(G, G0, {
    R_BIG: Math.max(0, Math.min(55, D.rBig)), R_SMALL: Math.max(0, Math.min(55, D.rSmall)),
    DISC_R: D.discR, RING_R: D.ringR, RING_W: D.ringW, Q_R: D.qR,
    ALT_R: D.altR, ALT_IMG_R: D.altR - 0.5, ALT_IMG_D: D.altImgD,
    ALT_BOX_W: G0.ALT_BOX_W * D.altBox, ALT_BOX_W_TB: G0.ALT_BOX_W_TB * D.altBox, ALT_BOX_H: G0.ALT_BOX_H * D.altBox, ALT_MAX_E: G0.ALT_MAX_E * D.altBox,
    TICK_A: D.ringR + D.ringW / 2, TICK_B: D.ringR + D.ringW / 2 + 3,
    SPOKE_A: D.altR + 4.7, SPOKE_B: Math.min(D.altR + 13.9, D.ansR - D.iconD / 2 - 2.9),
    LINE_W: D.lineW, ANS_R: D.ansR, ICON_D: D.iconD, SWATCH_D: D.iconD * 9.5 / 7.4, ANS_IMG_D: D.ansImgD, ANS_TEXT_R: G0.ANS_TEXT_R * D.ansBox,
    TAB_X: Math.min(D.tabX, 110 - G0.R_SMALL - 1), TAB_H: D.tabH, NUM_X: D.numX, NUM_Y: D.numY,
  });
}

/* ---------- Fria element → kortmotorns ritkommandon ---------- */
function proTextLines(it) {
  const font = proFontOK(it.font), pt = Math.max(1, it.pt), size = pt * PT, F = FONTS[font];
  const maxW = it.w > 0 ? it.w : Infinity, lines = [];
  for (const para of String(it.text || '').replace(/\r/g, '').split('\n')) {
    const words = para.split(/ +/);
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (cur && strW(t, font, pt) > maxW) { lines.push(cur); cur = w; } else cur = t;
    }
    lines.push(cur);
  }
  const L = (it.lh || 1.2) * size, n = lines.length;
  const ws = lines.map(s => strW(s, font, pt));
  const boxW = it.w > 0 ? it.w : Math.max(1, ...ws);
  const out = lines.map((s, i) => {
    const w = ws[i];
    const x = it.align === 'left' ? it.x - boxW / 2 : it.align === 'right' ? it.x + boxW / 2 - w : it.x - w / 2;
    return { s, w, x, y: it.y + (i - (n - 1) / 2) * L + F.mid * size };
  });
  return { font, pt, lines: out, w: boxW, h: Math.max(L * n, size), };
}
function proItemBox(it) {                               // ofärdig storlek för markering: bredd, höjd
  if (it.type === 'text') { const t = proTextLines(it); return { w: t.w + 1, h: t.h + 0.6 }; }
  if (it.type === 'line') return { w: Math.max(1, it.w), h: Math.max(1.5, it.sw + 1.2) };
  return { w: Math.max(0.5, it.w), h: Math.max(0.5, it.h) };
}
function proShapeD(it) {
  const x = it.x, y = it.y, hw = it.w / 2, hh = it.h / 2;
  const T = (px, py) => rotPt(x + px, y + py, x, y, it.rot);
  const tc = segs => segs.map(c => c[0] === 'C' ? ['C', ...T(c[1], c[2]), ...T(c[3], c[4]), ...T(c[5], c[6])] : c[0] === 'Z' ? c : [c[0], ...T(c[1], c[2])]);
  if (it.type === 'ellipse') {
    const segs = arcBez(0, 0, 1, 0, 360).map(c => ['C', c[1] * hw, c[2] * hh, c[3] * hw, c[4] * hh, c[5] * hw, c[6] * hh]);
    return tc([['M', hw, 0], ...segs, ['Z']]);
  }
  if (it.type === 'line') return tc([['M', -hw, 0], ['L', hw, 0]]);
  const r = Math.max(0, Math.min(it.rad || 0, hw, hh));
  if (!r) return tc([['M', -hw, -hh], ['L', hw, -hh], ['L', hw, hh], ['L', -hw, hh], ['Z']]);
  return tc([['M', -hw + r, -hh], ['L', hw - r, -hh], ...arcBez(hw - r, -hh + r, r, -90, 0), ['L', hw, hh - r], ...arcBez(hw - r, hh - r, r, 0, 90),
    ['L', -hw + r, hh], ...arcBez(-hw + r, hh - r, r, 90, 180), ['L', -hw, -hh + r], ...arcBez(-hw + r, -hh + r, r, 180, 270), ['Z']]);
}
function proItemPrims(it) {
  const op = it.op < 1 ? it.op : undefined;
  switch (it.type) {
    case 'text': {
      if (!String(it.text || '').trim()) return [];
      const t = proTextLines(it);
      return [{ k: 'text', font: t.font, pt: t.pt, color: it.color, lines: t.lines, rot: it.rot || 0, ox: it.x, oy: it.y, op }];
    }
    case 'img':
      if (!it.src) return [];
      return [{ k: 'rimg', src: it.src, cx: it.x, cy: it.y, w: Math.max(0.5, it.w), h: Math.max(0.5, it.h), rot: it.rot || 0, op, fit: it.fit, rad: it.rad || 0 }];
    case 'line':
      return [{ k: 'path', d: proShapeD(it), stroke: it.stroke || it.color || '#262523', sw: Math.max(0.05, it.sw), round: true, op }];
    default: {
      const fill = it.fill && it.fill !== 'none' ? it.fill : null, stroke = it.stroke && it.stroke !== 'none' && it.sw > 0 ? it.stroke : null;
      if (!fill && !stroke) return [];
      return [{ k: 'path', d: proShapeD(it), fill, stroke, sw: it.sw, op }];
    }
  }
}
function proItemsFor(deck, q, si) {
  const g = ((deck.pro && deck.pro.items) || []).filter(it => it.on === 'all' || (it.on === 'front' && si === 0) || (it.on === 'back' && si === 1));
  const s = (q && q.pro && q.pro.items) || [];
  return g.concat(s);
}
function proWatermarkItems(deck, q, si) {
  const w = deck.pro && deck.pro.wm;
  if (!w || !w.on || (q && q.pro && q.pro.noWm)) return [];
  if ((w.sides === 'front' && si !== 0) || (w.sides === 'back' && si !== 1)) return [];
  const base = w.kind === 'img'
    ? (w.img ? { type: 'img', src: w.img, w: w.size, h: w.size * (w.ratio || 1), fit: 'contain', rot: w.rot, op: w.op } : null)
    : (w.text.trim() ? { type: 'text', text: w.text, font: w.font, pt: w.size, color: w.color, align: 'center', lh: 1.15, w: 0, rot: w.rot, op: w.op } : null);
  if (!base) return [];
  const it = Object.assign(proCleanItem(Object.assign({ x: 55, y: 55 }, base)), { op: w.op });
  if (w.pos === 'tile') {
    const bx = proItemBox(it), a = Math.abs((w.rot || 0) * Math.PI / 180);
    const ew = Math.abs(bx.w * Math.cos(a)) + Math.abs(bx.h * Math.sin(a)), eh = Math.abs(bx.w * Math.sin(a)) + Math.abs(bx.h * Math.cos(a));
    const sx = Math.max(8, ew + 6), sy = Math.max(8, eh + 6), out = [];
    let row = 0;
    for (let y = sy / 2 - 2; y < 112 + sy; y += sy, row++) for (let x = (row % 2 ? 0 : sx / 2); x < 112 + sx; x += sx) out.push(Object.assign({}, it, { x, y }));
    return out.slice(0, 400);
  }
  const P = { center: [55, 55], tl: [24, 22], tr: [86, 24], bl: [24, 88], br: [86, 88] }[w.pos] || [55, 55];
  return [Object.assign(it, { x: P[0], y: P[1] })];
}
function proDecorate(sc, q, deck, opt, D, si) {
  const items = proItemsFor(deck, q, si);
  const wm = proWatermarkItems(deck, q, si), wmLayer = (deck.pro && deck.pro.wm && deck.pro.wm.layer) || 'over';
  const under = [], over = [];
  for (const it of items) (it.layer === 'under' ? under : over).push(...proItemPrims(it));
  const wmP = wm.flatMap(proItemPrims);
  (wmLayer === 'under' ? under : over).push(...wmP);
  const clip = cardPath(opt.bleed || 0);
  if (under.length) sc.prims.splice(D.tabHide ? 1 : 2, 0, { k: 'g', clip, prims: under });
  if (over.length) insertBeforeOverlays(sc.prims, [{ k: 'g', clip, prims: over }]);
}

/* ---------- buildSide med Pro-inställningar ---------- */
const _proBaseBuildSide = buildSide;
buildSide = function (q, deck, opt = {}) {
  const D = proDesign(deck, q), si = proSideIndex(q, deck, opt);
  const d2 = Object.keys(D.style).length ? Object.assign({}, deck, { style: Object.assign({}, deck.style || {}, D.style) }) : deck;
  proApplyG(D); CX = 55 + D.cDx; CY = 55 + D.cDy; proD = D;
  try {
    const sc = _proBaseBuildSide(q, d2, opt);
    sc.cut = cardPath(0);
    proDecorate(sc, q, d2, opt, D, si);
    return sc;
  } finally { Object.assign(G, G0); CX = 55; CY = 55; proD = PRO_DEF; }
};

/* ---------- Fria bilder i PDF: ritas färdiga (vridna, genomskinliga) som PNG ---------- */
const PRO_RASTER = new Map();
function proRasterKey(p, flip) { return [hash(p.src), n3(p.w), n3(p.h), n3(p.rot || 0), n3(p.op == null ? 1 : p.op), p.fit, n3(p.rad || 0), flip ? 1 : 0].join('|'); }
function proRasterGet(p, flip) { return PRO_RASTER.get(proRasterKey(p, flip)) || null; }
function proCollectRimg(prims, out) { for (const p of prims) { if (p.k === 'rimg') out.push(p); else if (p.k === 'g') proCollectRimg(p.prims, out); } return out; }
async function proRaster(p, flip) {
  const key = proRasterKey(p, flip);
  if (PRO_RASTER.has(key)) return;
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = p.src; });
  const rot = ((p.rot || 0) + (flip ? 180 : 0)) * Math.PI / 180;
  const bw = Math.abs(p.w * Math.cos(rot)) + Math.abs(p.h * Math.sin(rot)), bh = Math.abs(p.w * Math.sin(rot)) + Math.abs(p.h * Math.cos(rot));
  const ppm = Math.min(12, 2400 / Math.max(bw, bh));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bw * ppm)); c.height = Math.max(1, Math.round(bh * ppm));
  const x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(rot); x.scale(ppm, ppm);
  x.globalAlpha = p.op == null ? 1 : p.op;
  const w = p.w, h = p.h, r = Math.min(p.rad || 0, w / 2, h / 2);
  x.beginPath();
  if (r > 0 && x.roundRect) x.roundRect(-w / 2, -h / 2, w, h, r); else x.rect(-w / 2, -h / 2, w, h);
  x.clip();
  const ir = im.naturalWidth / im.naturalHeight, br = w / h;
  let dw = w, dh = h;
  if ((p.fit === 'contain') === (ir > br)) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  x.drawImage(im, -dw / 2, -dh / 2, dw, dh);
  PRO_RASTER.set(key, { data: c.toDataURL('image/png'), bw, bh, alias: 'pr' + hash(key) });
}
async function proPrepareRasters(idx) {
  const deck = state.deck, list = [];
  for (const ci of idx) for (let si = 0; si < 2; si++) proCollectRimg(buildSide(deck.cards[ci].sides[si], deck, { si }).prims, list);
  for (const p of list) { try { await proRaster(p, false); await proRaster(p, true); } catch (e) { /* bilden kunde inte läsas */ } }
}

/* ---------- Flytt av data från den gamla gemensamma lagringen ---------- */
async function proMigrate(db) {
  const old = await new Promise((res, rej) => { const r = indexedDB.open('egna10', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const get = k => new Promise(res => { try { const q = old.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); } catch (e) { res(undefined); } });
  const vals = {};
  for (const k of ['deck', 'file', 'library']) vals[k] = await get(k);
  old.close();
  await new Promise(res => {
    const tx = db.transaction('kv', 'readwrite'), st = tx.objectStore('kv');
    for (const [k, v] of Object.entries(vals)) if (v !== undefined) { try { st.put(v, k); } catch (e) { if (k === 'file') st.put({ name: v.name, dirty: v.dirty }, k); } }
    tx.oncomplete = res; tx.onerror = res; tx.onabort = res;
  });
}
