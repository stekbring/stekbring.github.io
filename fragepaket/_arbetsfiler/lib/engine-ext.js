
/* =====================================================================
   Tillägg till kortmotorn (båda apparna): genomskinlighet, grupper med
   urklipp och vridning, fri text och fria bilder – i SVG, PDF och
   PDF-förhandsvisningen. Samt Olle-loggan.
   ===================================================================== */
const OLLE_D = 'M59.67 99.82C58.5 99.6 57.76 99.2 57.04 98.38C55.83 97 55.82 95.46 57 90.64C58 86.54 58.68 80.27 58.75 74.38C58.77 72.9 58.86 71 58.95 70.15C59.04 69.31 59.16 62.74 59.21 55.57C59.27 48.39 59.36 42.21 59.42 41.84C59.6 40.69 59.5 16.91 59.3 14.68C58.99 10.99 58.42 8.8 57.17 6.46C55.74 3.79 55.43 3.06 55.54 2.61C55.7 1.98 56.37 1.19 57.05 0.84C58.27 0.21 66.64 -0.13 68.66 0.36C69.43 0.55 69.83 0.8 70.43 1.45C71.42 2.53 71.44 3.18 70.55 5.38C69.27 8.52 69.14 9.95 69.01 21.59C68.93 29.08 68.82 32.76 68.59 34.84C68.38 36.88 68.33 38.3 68.43 39.73C68.77 44.43 68.52 55.19 68.02 57.68C67.62 59.67 67.59 62.48 67.81 76.45C67.98 86.9 68.05 87.34 69.99 89.04C71.5 90.38 72.45 90.55 78.98 90.67C85.23 90.78 85.75 90.87 87.02 92.09C88.83 93.82 88.91 95.87 87.26 97.83C85.92 99.42 84.71 99.58 73.13 99.7C68.22 99.75 63.38 99.83 62.38 99.88C61.38 99.94 60.16 99.91 59.67 99.82ZM99.33 98.75C98.35 98.4 97.02 97.01 96.76 96.05C96.47 95.02 96.5 93.23 96.84 90.5C97.03 88.93 97.08 87.47 97 85.89C96.93 84.63 96.98 81.69 97.1 79.37C97.3 75.74 97.29 74.74 97.02 72.26C96.69 69.1 96.45 55.95 96.56 46.55C96.69 36.24 96.61 29.91 96.35 28.02C96.18 26.81 96.09 23.81 96.07 19.1C96.04 11.12 95.88 9.78 94.52 6.31C93.63 4.04 93.65 3.48 94.63 2.42C95.71 1.24 96.5 1.06 100.4 1.06C104.1 1.06 107.6 1.4 108.4 1.82C108.7 1.98 109.2 2.41 109.5 2.79C110.2 3.67 110.1 4.36 108.9 6.32C107.4 9.01 106.7 10.98 106.2 14.6C106 16.75 105.8 41.59 106 42.02C106.6 42.91 106.4 52.53 105.8 58.64C105.5 60.88 105.5 65.42 105.8 68.81C105.9 70.29 106 74.31 106 77.74C106.1 83.68 106.1 84.03 106.5 84.94C107 86.13 107.7 86.89 108.7 87.35C109.9 87.89 115.9 87.87 118.4 87.32C123.8 86.16 124.8 85.98 126.6 85.86C129 85.71 129.9 86 131 87.16C132.5 88.78 132.4 90.46 130.9 92.2C129.7 93.62 127.2 94.53 123.3 95.08C122.2 95.24 120.2 95.63 119 95.95C117.7 96.27 115.8 96.62 114.7 96.73C113.6 96.83 110.5 97.39 107.8 97.98C102.5 99.11 100.8 99.26 99.33 98.75ZM140 80.61C138.9 79.55 138.6 78.47 138.4 74.28C138.3 72.43 138.2 70.49 138.1 69.96C138.1 69.43 138 65.72 137.9 61.71C137.8 56.07 137.7 54.1 137.5 53.03C137.1 51.32 137.2 46.3 137.7 43.57C137.8 42.57 138 40.59 138 39.16C138 37.73 138.2 35.7 138.3 34.64C138.5 33.44 138.5 31.98 138.5 30.71C138.4 29.33 138.5 28.01 138.7 26.53C138.8 25.34 139 23.63 139 22.73C139 20.88 139.2 20.13 140.1 19.29C141.3 18.19 144.6 18.44 149.1 19.99C150 20.3 153.6 21.11 157 21.8C163.7 23.15 164.3 23.31 165.2 24.24C166.9 25.79 166.7 28.13 165 29.48C164.3 30 164.1 30.04 162.7 30.01C160.9 29.98 155.1 28.6 152.4 27.55C150 26.63 147.9 26.07 147.1 26.14C145.9 26.24 145.7 26.84 145.5 30.55C145.4 32.28 145.2 34.37 145.1 35.2C144.9 36.92 145 41.31 145.3 42.61C145.7 44.01 146.2 44.63 147.3 45.11C148.2 45.52 148.4 45.54 151.2 45.43C153 45.37 155.2 45.14 156.5 44.91C159.9 44.3 161.2 44.54 163.5 46.25C165.2 47.5 165.8 50.18 164.6 51.42C164.3 51.71 163.4 52.24 162.5 52.61C161 53.25 160.9 53.26 158.8 53.18C157.7 53.14 154.4 53.09 151.5 53.09L146.3 53.07L145.8 53.57C145.3 53.99 145.2 54.35 145.1 55.69C144.7 59.01 144.9 67.38 145.5 69.5C145.8 70.48 146.4 71.39 147.3 72.04C148 72.54 148.3 72.6 149.5 72.59C152.2 72.56 155.9 71.49 161.4 69.22C164.7 67.87 165.5 67.81 166.6 68.81C167.9 70.05 167.8 71.48 166.1 73.32C164.9 74.63 163.4 75.46 160.7 76.27C159.8 76.54 158.4 77.03 157.6 77.36C156.8 77.68 155.5 78.11 154.7 78.3C151.7 79.04 148.6 79.88 147.2 80.33C145.2 80.97 143.2 81.38 141.9 81.38C141 81.38 140.8 81.31 140 80.61ZM19.19 71.4C15.99 71.03 13.92 70.33 11.19 68.68C7.37 66.39 4.67 63.32 2.3 58.6C0.51 55.02 -0.29 50.05 0.15 45.17C0.41 42.28 1.74 37.05 2.8 34.76C6.85 26 16.1 21 26.31 22.04C29.72 22.39 32.31 23.52 35.86 26.2C40.89 29.99 43.52 34.25 44.85 40.79C45.39 43.42 45.34 49.91 44.76 53.17C44.03 57.25 43.3 58.89 40.38 62.9C36.79 67.84 33.54 70 28.02 71.12C25.82 71.57 21.8 71.69 19.19 71.4ZM26.5 60.42C29.08 59.15 31.86 56.45 33.16 53.97C38.28 44.21 30.87 31.43 21.15 33.27C16.83 34.09 13.35 37.7 11.49 43.29C10.7 45.67 10.63 48.04 11.28 50.69C12.38 55.15 14.33 57.41 19.31 59.98C21.53 61.12 21.89 61.22 23.62 61.17C24.86 61.14 25.28 61.03 26.5 60.42Z';
const OLLE_W = 167.56, OLLE_H = 100;           // loggans mått i OLLE_D
function olleCmds(x, y, h) {                    // loggan som banor i kortmotorns format, (x, y) = övre vänstra hörnet
  const k = h / OLLE_H, out = [];
  for (const m of OLLE_D.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    if (m[1] === 'Z') { out.push(['Z']); continue; }
    const v = m[2].trim().split(/[\s,]+/).map(Number);
    out.push([m[1], ...v.map((n, i) => i % 2 ? y + n * k : x + n * k)]);
  }
  return out;
}
function olleSVG(cls) { return `<svg class="${cls || ''}" viewBox="0 0 ${OLLE_W} ${OLLE_H}" role="img" aria-label="Olle"><path d="${OLLE_D}"/></svg>`; }
// Svart Olle-logga nere till höger på PDF-sidan (utanför korten)
function ollePageMark(doc, W, H) {
  if (typeof OLLE_PDF_LOGO !== 'undefined' && !OLLE_PDF_LOGO) return;
  const h = 7.2, w = h * OLLE_W / OLLE_H;
  pdfScene(doc, [{ k: 'path', d: olleCmds(W - 10 - w, H - 6.6 - h, h), fill: '#161614' }], { cx: CX, cy: CY, s: 1, rot: false }, null);
}
// lägg prims före förhandsvisningens hjälplinjer och klickytor
function insertBeforeOverlays(P, add) {
  let i = P.findIndex(p => p.overlay || p.k === 'hit');
  if (i < 0) i = P.length;
  P.splice(i, 0, ...add);
}

/* ---------- SVG ---------- */
function rotPt(x, y, ox, oy, deg) {
  if (!deg) return [x, y];
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), dx = x - ox, dy = y - oy;
  return [ox + dx * c - dy * s, oy + dx * s + dy * c];
}
function primsToSVG(prims, ctx) {
  let body = '';
  for (const p of prims) {
    const op = p.op != null && p.op < 1 ? ` opacity="${n3(p.op)}"` : '';
    switch (p.k) {
      case 'path':
        body += `<path d="${pathD(p.d)}" fill="${p.fill || 'none'}"${p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.sw}"` : ''}${p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : ''}${p.round ? ' stroke-linecap="round" stroke-linejoin="round"' : ''}${op}/>`; break;
      case 'circle':
        body += `<circle cx="${n3(p.cx)}" cy="${n3(p.cy)}" r="${n3(p.r)}" fill="${p.fill || 'none'}"${p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.sw}"` : ''}${p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : ''}${op}/>`; break;
      case 'line':
        body += `<line x1="${n3(p.x1)}" y1="${n3(p.y1)}" x2="${n3(p.x2)}" y2="${n3(p.y2)}" stroke="${p.stroke}" stroke-width="${p.sw}"${op}/>`; break;
      case 'poly':
        body += `<polyline points="${p.pts.map(q => n3(q[0]) + ',' + n3(q[1])).join(' ')}" fill="none" stroke="${p.stroke}" stroke-width="${p.sw}" stroke-linecap="round" stroke-linejoin="round"${op}/>`; break;
      case 'text': {
        const F = FONTS[p.font] || FONTS.serif;
        const tf = p.rot ? ` transform="rotate(${n3(p.rot)} ${n3(p.ox)} ${n3(p.oy)})"` : '';
        if (tf || op) body += `<g${tf}${op}>`;
        for (const l of p.lines) body += `<text x="${n3(l.x)}" y="${n3(l.y)}" font-family="${F.family}" font-size="${n3(p.pt * PT)}" fill="${p.color}" style="font-kerning:none;white-space:pre">${esc(l.s)}</text>`;
        if (tf || op) body += '</g>';
        break;
      }
      case 'img': {
        const cid = `${ctx.id}c${ctx.n++}`;
        ctx.defs += `<clipPath id="${cid}"><circle cx="${n3(p.cx)}" cy="${n3(p.cy)}" r="${n3(p.r)}"/></clipPath>`;
        body += `<image href="${p.src}" x="${n3(p.cx - p.r)}" y="${n3(p.cy - p.r)}" width="${n3(2 * p.r)}" height="${n3(2 * p.r)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"/>`;
        break;
      }
      case 'rimg': {                                  // fri bild: rektangel (x, y, w, h) runt mitten, vriden rot grader
        const cid = `${ctx.id}c${ctx.n++}`, x0 = p.cx - p.w / 2, y0 = p.cy - p.h / 2;
        ctx.defs += `<clipPath id="${cid}"><rect x="${n3(x0)}" y="${n3(y0)}" width="${n3(p.w)}" height="${n3(p.h)}" rx="${n3(p.rad || 0)}"/></clipPath>`;
        const tf = p.rot ? ` transform="rotate(${n3(p.rot)} ${n3(p.cx)} ${n3(p.cy)})"` : '';
        body += `<g${tf}${op}><image href="${p.src}" x="${n3(x0)}" y="${n3(y0)}" width="${n3(p.w)}" height="${n3(p.h)}" preserveAspectRatio="xMidYMid ${p.fit === 'contain' ? 'meet' : 'slice'}" clip-path="url(#${cid})"/></g>`;
        break;
      }
      case 'g': {
        let open = '<g' + op;
        if (p.clip) { const cid = `${ctx.id}c${ctx.n++}`; ctx.defs += `<clipPath id="${cid}"><path d="${pathD(p.clip)}"/></clipPath>`; open += ` clip-path="url(#${cid})"`; }
        body += open + '>' + primsToSVG(p.prims, ctx) + '</g>';
        break;
      }
      case 'hit':
        body += `<circle class="hit" data-kind="${p.kind}" data-pos="${p.pos}" cx="${n3(p.cx)}" cy="${n3(p.cy)}" r="${n3(p.r)}"/>`; break;
    }
  }
  return body;
}
sceneToSVG = function (scene, o = {}) {
  const ctx = { id: 'k' + (++svgSeq), defs: '', n: 0 };
  const pad = o.pad || 0;
  const body = primsToSVG(scene.prims, ctx);
  const w = CARD + 2 * pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w} ${w}"${o.cssSize ? ` style="width:${o.cssSize}"` : ''}>${ctx.defs ? `<defs>${ctx.defs}</defs>` : ''}${body}${o.overlay || ''}</svg>`;
};

/* ---------- PDF ---------- */
function pdfOpacity(doc, op) {
  if (op == null || op >= 1) return false;
  try {
    const GS = doc.GState || (window.jspdf && window.jspdf.GState);
    doc.saveGraphicsState(); doc.setGState(new GS({ opacity: op, 'stroke-opacity': op })); return true;
  } catch (e) { return false; }
}
const _corePdfScene = pdfScene;
pdfScene = function (doc, prims, T, images) {
  const tr = pdfTr(T);
  for (const p of prims) {
    if (p.overlay || p.k === 'hit') continue;
    if (p.k === 'g') {
      doc.saveGraphicsState();
      if (p.clip) { pdfPath(doc, p.clip, tr); doc.clip(); doc.discardPath(); }
      const o = pdfOpacity(doc, p.op);
      pdfScene(doc, p.prims, T, images);
      if (o) doc.restoreGraphicsState();
      doc.restoreGraphicsState();
      continue;
    }
    if (p.k === 'rimg') {                          // fri bild: färdigritad (vriden, genomskinlig) PNG från proRaster
      const r = typeof proRasterGet === 'function' ? proRasterGet(p, T.rot) : null;
      if (!r) continue;
      const [x, y] = tr(p.cx, p.cy), w = r.bw * T.s, h = r.bh * T.s;
      doc.addImage(r.data, 'PNG', x - w / 2, y - h / 2, w, h, r.alias, 'NONE');
      continue;
    }
    if (p.k === 'text' && p.rot) {
      const o = pdfOpacity(doc, p.op);
      doc.setFont((FONTS[p.font] || FONTS.serif).family, 'normal'); doc.setFontSize(p.pt * T.s); doc.setTextColor(p.color);
      for (const l of p.lines) {
        const [rx, ry] = rotPt(l.x, l.y, p.ox, p.oy, p.rot), [x, y] = tr(rx, ry);
        doc.text(l.s, x, y, { angle: -p.rot + (T.rot ? 180 : 0) });
      }
      if (o) doc.restoreGraphicsState();
      continue;
    }
    const o = pdfOpacity(doc, p.op);
    if (p.k === 'path' && p.round && p.stroke && !p.fill) {
      doc.setLineCap('round'); doc.setLineJoin('round');
      _corePdfScene(doc, [p], T, images);
      doc.setLineCap('butt'); doc.setLineJoin('miter');
    } else _corePdfScene(doc, [p], T, images);
    if (o) doc.restoreGraphicsState();
  }
};
// PDF-förhandsvisningen ritar med en låtsas-PDF (SvgDoc) – lär den genomskinlighet.
function patchSvgDoc() {
  if (typeof SvgDoc === 'undefined' || SvgDoc.prototype.setGState) return;
  SvgDoc.prototype.GState = function (o) { Object.assign(this, o); };
  SvgDoc.prototype.setGState = function (g) { this.emit(`<g opacity="${n3(g.opacity)}">`); this.open++; };
}

/* ---------- Olle-vattenstämpel på korten (styrs av OLLE_WATERMARK) ---------- */
function olleWatermarkPrims(st) {
  const h = 5.2, w = h * OLLE_W / OLLE_H, cx = 98.6, cy = 93;
  return [{ k: 'path', d: olleCmds(cx - w / 2, cy - h / 2, h), fill: st.text, op: 0.13 }];
}
const _olleBaseBuildSide = buildSide;
buildSide = function (q, deck, opt = {}) {
  const sc = _olleBaseBuildSide(q, deck, opt);
  if (typeof OLLE_WATERMARK !== 'undefined' && OLLE_WATERMARK) insertBeforeOverlays(sc.prims, olleWatermarkPrims(styleOf(deck)));
  return sc;
};

/* ---------- ”skapad av Olle” längst ner ---------- */
function bindCredit() {
  const mk = cls => { const d = document.createElement('div'); d.className = 'credit ' + cls; d.innerHTML = `<span>skapad av</span>${olleSVG('credit-logo')}`; return d; };
  const main = document.querySelector('main.layout');
  if (main) main.after(mk('cr-desk'));
  const pc = $('#pCards'); if (pc) pc.appendChild(mk('cr-mob'));
  const wl = $('#welcome .wl-page'); if (wl) wl.appendChild(mk('cr-wl'));
  const ws = $('#welcome .wl-sheet'); if (ws) ws.appendChild(mk('cr-wls'));
}
