
/* =====================================================================
   Egna10 Pro – gränssnitt: flikar i redigeringsrutan, markering och
   dragning direkt på korten, fria element, vattenstämpel och typsnitt.
   ===================================================================== */
const proUI = { tab: 'content', scope: 'all', sel: null, drag: null, suppressClick: false };
const PRO_GROUPS = [
  { id: 'card', title: 'Kortets form', ctl: [['rBig', 'Stora hörnen (vänster)', 0, 55, 0.5, 'mm'], ['rSmall', 'Små hörnen (höger)', 0, 30, 0.5, 'mm']] },
  { id: 'center', title: 'Mittcirkeln', hint: 'Dra i mittcirkeln på kortet för att flytta den – frågan, alternativen och linjerna följer med.', ctl: [['cDx', 'Flytta åt höger', -40, 40, 0.5, 'mm'], ['cDy', 'Flytta nedåt', -40, 40, 0.5, 'mm'], ['discR', 'Radie', 10, 55, 0.5, 'mm'], ['discHide', 'Dölj den ljusa cirkeln', 'bool']] },
  { id: 'ring', title: 'Frågeringen', ctl: [['ringR', 'Radie', 4, 35, 0.2, 'mm'], ['ringW', 'Linjebredd', 0, 4, 0.1, 'mm'], ['ringHide', 'Dölj ringen', 'bool']] },
  { id: 'q', title: 'Frågetexten', hint: 'Dra i frågan på kortet för att flytta den.', ctl: [['qDx', 'Flytta åt höger', -40, 40, 0.5, 'mm'], ['qDy', 'Flytta nedåt', -40, 40, 0.5, 'mm'], ['qR', 'Textytans radie', 4, 40, 0.2, 'mm'], ['qMax', 'Största textstorlek', 4, 36, 0.25, 'pt'], ['qMin', 'Minsta textstorlek', 3, 24, 0.25, 'pt'], ['qLines', 'Högst antal rader', 1, 12, 1, ''], ['qFont', 'Typsnitt', 'font'], ['qColor', 'Färg', 'color']] },
  { id: 'alts', title: 'Alternativen', ctl: [['altR', 'Avstånd från mitten', 8, 50, 0.2, 'mm'], ['altBox', 'Textytans storlek', 0.4, 2.5, 0.05, '×'], ['altMax', 'Största textstorlek', 3, 20, 0.25, 'pt'], ['altMin', 'Minsta textstorlek', 3, 14, 0.25, 'pt'], ['altImgD', 'Bildernas storlek', 4, 30, 0.2, 'mm'], ['altFont', 'Typsnitt', 'font'], ['altColor', 'Färg', 'color']] },
  { id: 'lines', title: 'Linjerna', ctl: [['lineW', 'Linjebredd', 0.05, 2, 0.05, 'mm'], ['lineColor', 'Färg', 'color'], ['spokesHide', 'Dölj linjerna', 'bool']] },
  { id: 'ans', title: 'Facit', hint: 'Facit ska ligga under boxens hål – slå på ”Visa boxens hål” i förhandsvisningen för att se dem. Dra i facit på kortet för att flytta alla tio.', ctl: [['aDx', 'Flytta åt höger', -20, 20, 0.2, 'mm'], ['aDy', 'Flytta nedåt', -20, 20, 0.2, 'mm'], ['ansR', 'Avstånd från mitten', 25, 60, 0.2, 'mm'], ['iconD', 'Storlek på ✓ ✗ och färgprickar', 2, 16, 0.2, 'mm'], ['ansBox', 'Textytans storlek', 0.4, 2.5, 0.05, '×'], ['ansMax', 'Största textstorlek', 3, 20, 0.25, 'pt'], ['ansMin', 'Minsta textstorlek', 3, 14, 0.25, 'pt'], ['ansImgD', 'Bildernas storlek', 4, 30, 0.2, 'mm'], ['ansFont', 'Typsnitt', 'font'], ['ansColor', 'Färg', 'color']] },
  { id: 'tab', title: 'Etiketten uppe till höger', ctl: [['tabX', 'Börjar vid (från vänster)', 30, 104, 0.5, 'mm'], ['tabH', 'Höjd', 3, 40, 0.5, 'mm'], ['labelMax', 'Största textstorlek', 3, 30, 0.25, 'pt'], ['labelFont', 'Typsnitt', 'font'], ['tabHide', 'Dölj etiketten', 'bool']] },
  { id: 'num', title: 'Numret', hint: 'Dra i numret på kortet för att flytta det.', ctl: [['numX', 'Högerkant', 5, 110, 0.5, 'mm'], ['numY', 'Baslinje (uppifrån)', 3, 110, 0.5, 'mm'], ['numPt', 'Textstorlek', 3, 24, 0.25, 'pt'], ['numFont', 'Typsnitt', 'font'], ['numColor', 'Färg', 'color']] },
  { id: 'colors', title: 'Färger', hint: 'Samma färger som under Utseende – men här kan de också gälla bara den här sidan.', ctl: () => Object.keys(DEFAULT_STYLE).map(k => ['style.' + k, STYLE_LABELS[k], 'color']) },
];
const PRO_GOOGLE = [
  ['Bebas Neue', 'ofl/bebasneue/BebasNeue-Regular.ttf', 'Rubrik, smal'],
  ['Anton', 'ofl/anton/Anton-Regular.ttf', 'Rubrik, kraftig'],
  ['Archivo Black', 'ofl/archivoblack/ArchivoBlack-Regular.ttf', 'Rubrik, fet'],
  ['Alfa Slab One', 'ofl/alfaslabone/AlfaSlabOne-Regular.ttf', 'Rubrik, slab'],
  ['Abril Fatface', 'ofl/abrilfatface/AbrilFatface-Regular.ttf', 'Rubrik, elegant'],
  ['Righteous', 'ofl/righteous/Righteous-Regular.ttf', 'Rund, retro'],
  ['Bangers', 'ofl/bangers/Bangers-Regular.ttf', 'Serietidning'],
  ['Luckiest Guy', 'apache/luckiestguy/LuckiestGuy-Regular.ttf', 'Lekfull'],
  ['Chewy', 'apache/chewy/Chewy-Regular.ttf', 'Lekfull'],
  ['Poppins', 'ofl/poppins/Poppins-Regular.ttf', 'Modern, normal'],
  ['Poppins Bold', 'ofl/poppins/Poppins-Bold.ttf', 'Modern, fet'],
  ['Poppins Black', 'ofl/poppins/Poppins-Black.ttf', 'Modern, extra fet'],
  ['PT Sans', 'ofl/ptsans/PT_Sans-Web-Regular.ttf', 'Lättläst, normal'],
  ['PT Sans Bold', 'ofl/ptsans/PT_Sans-Web-Bold.ttf', 'Lättläst, fet'],
  ['PT Serif', 'ofl/ptserif/PT_Serif-Web-Regular.ttf', 'Klassisk serif'],
  ['Comic Neue', 'ofl/comicneue/ComicNeue-Regular.ttf', 'Avslappnad'],
  ['Comic Neue Bold', 'ofl/comicneue/ComicNeue-Bold.ttf', 'Avslappnad, fet'],
  ['Special Elite', 'apache/specialelite/SpecialElite-Regular.ttf', 'Skrivmaskin'],
  ['Permanent Marker', 'apache/permanentmarker/PermanentMarker-Regular.ttf', 'Tuschpenna'],
  ['Patrick Hand', 'ofl/patrickhand/PatrickHand-Regular.ttf', 'Handskrift'],
  ['Indie Flower', 'ofl/indieflower/IndieFlower-Regular.ttf', 'Handskrift'],
  ['Shadows Into Light', 'ofl/shadowsintolight/ShadowsIntoLight.ttf', 'Handskrift, tunn'],
  ['Amatic SC', 'ofl/amaticsc/AmaticSC-Bold.ttf', 'Handskrift, smal'],
  ['Lobster', 'ofl/lobster/Lobster-Regular.ttf', 'Skrivstil'],
  ['Pacifico', 'ofl/pacifico/Pacifico-Regular.ttf', 'Skrivstil, rund'],
  ['Great Vibes', 'ofl/greatvibes/GreatVibes-Regular.ttf', 'Skrivstil, elegant'],
  ['VT323', 'ofl/vt323/VT323-Regular.ttf', 'Datorskärm'],
  ['Press Start 2P', 'ofl/pressstart2p/PressStart2P-Regular.ttf', 'TV-spel'],
];
const PRO_CHARSET = (() => { let s = ''; for (let i = 32; i < 127; i++) s += String.fromCharCode(i); return s + 'ÅÄÖåäöÉéÈèÊêËëÜüÁáÀàÂâÍíÌìÎîÏïÓóÒòÔôÚúÙùÛûÑñÇçÆæØøßŒœÿ–—‘’‚“”„…•·×÷€£$§°±²³½¼¾«»¡¿©®™✓✗'; })();

/* ---------- Data ---------- */
function proDeckP() { if (!state.deck.pro) state.deck.pro = proCleanDeck({}); return state.deck.pro; }
function proSideP(create) {
  const q = curQ();
  if (!q.pro && create) q.pro = { design: {}, items: [] };
  if (q.pro) { q.pro.design = q.pro.design || {}; q.pro.items = q.pro.items || []; }
  return q.pro || null;
}
function proTidySide() { const q = curQ(); if (q.pro && !Object.keys(q.pro.design || {}).length && !(q.pro.items || []).length && !q.pro.noWm) delete q.pro; }
function proRawGet(d, k) { if (!d) return undefined; if (k.startsWith('style.')) return d.style ? d.style[k.slice(6)] : undefined; return d[k]; }
function proRawSet(d, k, v) {
  if (k.startsWith('style.')) { const s = k.slice(6); d.style = d.style || {}; if (v === undefined) delete d.style[s]; else d.style[s] = v; if (!Object.keys(d.style).length) delete d.style; }
  else if (v === undefined) delete d[k]; else d[k] = v;
}
function proBaseVal(k) {                      // värdet om inget är ändrat i den valda räckvidden
  if (k.startsWith('style.')) return styleOf(state.deck)[k.slice(6)];
  return PRO_DEF[k];
}
function proGet(k, scope = proUI.scope) {
  const g = proRawGet(proDeckP().design, k), sp = proSideP(false), s = sp ? proRawGet(sp.design, k) : undefined;
  if (scope === 'side' && s !== undefined) return s;
  return g !== undefined ? g : proBaseVal(k);
}
function proIsSideOverride(k) { const sp = proSideP(false); return !!sp && proRawGet(sp.design, k) !== undefined; }
function proSet(k, v, noRender) {
  if (proUI.scope === 'side') {
    const sp = proSideP(true), base = proGet(k, 'all');
    proRawSet(sp.design, k, v === base ? undefined : v);
    proTidySide();
  } else {
    const d = proDeckP().design, base = proBaseVal(k);
    proRawSet(d, k, v === base || v === '' && k.endsWith('Color') ? undefined : v);
  }
  proChanged(noRender);
}
let proListT = 0;
function proChanged(noRender) {
  state.status.clear();
  if (!noRender) renderPreview();
  refreshListItem();
  clearTimeout(proListT); proListT = setTimeout(() => { renderList(); if (typeof csRender === 'function') csRender(); }, 500);
  scheduleSave();
}

/* ---------- Flikar ---------- */
function proSetTab(t) {
  proUI.tab = t;
  $$('#proTabs [data-pt]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pt === t)));
  $('#pEditor .form').hidden = t !== 'content';
  $$('#proPanes > .pro-pane').forEach(p => { p.hidden = p.dataset.pt !== t; });
  document.body.classList.toggle('pro-design', t !== 'content');
  if (t === 'content' || (t !== 'layout' && proUI.sel && proUI.sel.kind === 'grp') || (t !== 'items' && t !== 'layout' && proUI.sel)) proUI.sel = null;
  proRenderPane();
  renderPreview();
}

/* ---------- Kontroller ---------- */
function proFontOptions(sel) {
  return Object.keys(FONTS).map(k => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(proFontName(k))}</option>`).join('');
}
function proCtlHTML(c, val, mark) {
  const [k, label, a, b, step, unit] = c;
  const m = mark ? '<span class="pro-mark" title="Ändrad för den här sidan">•</span>' : '';
  if (a === 'bool') return `<label class="pf pf-bool" data-k="${k}"><input type="checkbox"${val ? ' checked' : ''}> ${label}${m}</label>`;
  if (a === 'font') return `<label class="pf" data-k="${k}"><span>${label}${m}</span><select>${proFontOptions(val)}</select></label>`;
  if (a === 'color') {
    const v = val || (k === 'qColor' || k === 'altColor' || k === 'ansColor' || k === 'numColor' ? styleOf(state.deck).text : k === 'lineColor' ? styleOf(state.deck).line : '#000000');
    return `<label class="pf" data-k="${k}"><span>${label}${m}</span><span class="pf-col"><input type="color" value="${esc(v)}"><button type="button" class="pf-def" title="Använd standardfärgen">Standard</button></span></label>`;
  }
  return `<label class="pf" data-k="${k}"><span>${label}${m}</span><span class="pf-num"><input type="range" min="${a}" max="${b}" step="${step}" value="${val}"><input type="number" min="${a}" max="${b}" step="${step}" value="${val}"><small>${unit}</small></span></label>`;
}
function proLayoutHTML() {
  const sp = proSideP(false), hasSide = !!(sp && (Object.keys(sp.design || {}).length));
  let h = `<div class="pro-scope" role="radiogroup" aria-label="Ändringarna gäller">
    <span>Ändringar gäller:</span>
    <label><input type="radio" name="proScope" value="all"${proUI.scope === 'all' ? ' checked' : ''}> alla kort</label>
    <label><input type="radio" name="proScope" value="side"${proUI.scope === 'side' ? ' checked' : ''}> bara den här sidan</label>
  </div>`;
  if (hasSide) h += `<p class="pro-note">Den här sidan har egna layoutinställningar (märkta med •). <button type="button" data-act="clearSide">Ta bort sidans egna</button></p>`;
  h += `<p class="help">Klicka på en del av kortet i förhandsvisningen för att hoppa till dess inställningar. Frågan, mittcirkeln, facit och numret kan dras dit du vill.</p>`;
  for (const g of PRO_GROUPS) {
    const ctl = typeof g.ctl === 'function' ? g.ctl() : g.ctl;
    const open = proUI.sel && proUI.sel.kind === 'grp' && proUI.sel.id === g.id;
    h += `<details class="pro-grp${open ? ' sel' : ''}" data-g="${g.id}"${open ? ' open' : ''}><summary>${g.title}</summary>`;
    if (g.hint) h += `<p class="help">${g.hint}</p>`;
    h += ctl.map(c => proCtlHTML(c, proGet(c[0]), proUI.scope === 'side' && proIsSideOverride(c[0]))).join('');
    h += `<div class="pro-grp-foot"><button type="button" data-act="resetGrp" data-g="${g.id}">Återställ ${g.title.toLowerCase()}</button></div></details>`;
  }
  h += `<div class="pro-grp-foot"><button type="button" data-act="resetAll">Återställ hela layouten</button></div>`;
  return h;
}

/* ---------- Fria element ---------- */
const PRO_TYPE_NAME = { text: 'Text', img: 'Bild', rect: 'Ruta', ellipse: 'Cirkel', line: 'Linje' };
function proSideItems() {                       // [{ it, global }]
  const si = state.side, q = curQ(), out = [];
  for (const it of proDeckP().items) if (it.on === 'all' || (it.on === 'front' && si === 0) || (it.on === 'back' && si === 1)) out.push({ it, global: true });
  for (const it of ((q.pro && q.pro.items) || [])) out.push({ it, global: false });
  return out;
}
function proFindItem(id) {
  const g = proDeckP().items.find(i => i.id === id); if (g) return { it: g, list: proDeckP().items, global: true };
  const sp = proSideP(false); const s = sp && sp.items.find(i => i.id === id);
  return s ? { it: s, list: sp.items, global: false } : null;
}
function proItemLabel(it) {
  if (it.type === 'text') return 'Text: ' + (it.text.trim().split('\n')[0].slice(0, 28) || '(tom)');
  return PRO_TYPE_NAME[it.type];
}
function proItemsHTML() {
  const list = proSideItems();
  const selId = proUI.sel && proUI.sel.kind === 'item' ? proUI.sel.id : null;
  let h = `<div class="pro-add" role="group" aria-label="Lägg till på kortet">
    <button type="button" data-add="text">+ Text</button><button type="button" data-add="img">+ Bild…</button>
    <button type="button" data-add="rect">+ Ruta</button><button type="button" data-add="ellipse">+ Cirkel</button><button type="button" data-add="line">+ Linje</button>
  </div>`;
  h += `<p class="help">Det du lägger till hamnar på ${state.side ? 'baksidan' : 'framsidan'} av kort ${state.cur + 1}. Under ”Visas på” kan du låta det synas på alla kort. Dra i elementet på kortet för att flytta det, i hörnet för att ändra storlek och i den runda knoppen för att vrida.</p>`;
  if (!list.length) h += `<p class="pro-empty">Inga egna element på den här sidan än.</p>`;
  else h += `<ul class="pro-items">${list.map(({ it, global }) => `<li data-id="${esc(it.id)}"${it.id === selId ? ' class="sel"' : ''}><button type="button" class="pro-it">${esc(proItemLabel(it))}${global ? ' <small>(' + ({ all: 'alla sidor', front: 'alla framsidor', back: 'alla baksidor' })[it.on] + ')</small>' : ''}</button></li>`).join('')}</ul>`;
  const f = selId && proFindItem(selId);
  if (f) h += proItemFormHTML(f.it);
  return h;
}
function proNum(k, label, v, a, b, step, unit) {
  return `<label class="pf" data-ik="${k}"><span>${label}</span><span class="pf-num"><input type="range" min="${a}" max="${b}" step="${step}" value="${v}"><input type="number" min="${a}" max="${b}" step="${step}" value="${Math.round(v * 100) / 100}"><small>${unit}</small></span></label>`;
}
function proItemFormHTML(it) {
  let h = `<fieldset class="pro-form" data-id="${esc(it.id)}"><legend>${PRO_TYPE_NAME[it.type]}</legend>`;
  if (it.type === 'text') {
    h += `<label class="pf pf-block" data-ik="text"><span>Text</span><textarea rows="3">${esc(it.text)}</textarea></label>`;
    h += `<label class="pf" data-ik="font"><span>Typsnitt</span><select>${proFontOptions(proFontOK(it.font))}</select></label>`;
    h += proNum('pt', 'Textstorlek', it.pt, 3, 72, 0.5, 'pt');
    h += `<label class="pf" data-ik="color"><span>Färg</span><span class="pf-col"><input type="color" value="${esc(it.color)}"></span></label>`;
    h += `<label class="pf" data-ik="align"><span>Justering</span><select><option value="left"${it.align === 'left' ? ' selected' : ''}>Vänster</option><option value="center"${it.align === 'center' ? ' selected' : ''}>Mitten</option><option value="right"${it.align === 'right' ? ' selected' : ''}>Höger</option></select></label>`;
    h += proNum('w', 'Radbredd (0 = ingen radbrytning)', it.w, 0, 110, 0.5, 'mm');
    h += proNum('lh', 'Radavstånd', it.lh, 0.7, 3, 0.05, '×');
  } else if (it.type === 'img') {
    h += `<div class="pf"><span>Bild</span><span><button type="button" data-act="itemImg">Byt bild…</button> <button type="button" data-act="itemRatio" title="Gör höjden rätt i förhållande till bildens form">Bildens egna proportioner</button></span></div>`;
    h += `<label class="pf" data-ik="fit"><span>Passning</span><select><option value="cover"${it.fit === 'cover' ? ' selected' : ''}>Fyll rutan (beskär)</option><option value="contain"${it.fit === 'contain' ? ' selected' : ''}>Hela bilden syns</option></select></label>`;
    h += proNum('w', 'Bredd', it.w, 1, 150, 0.5, 'mm') + proNum('h', 'Höjd', it.h, 1, 150, 0.5, 'mm') + proNum('rad', 'Rundade hörn', it.rad, 0, 50, 0.5, 'mm');
  } else if (it.type === 'line') {
    h += `<label class="pf" data-ik="stroke"><span>Färg</span><span class="pf-col"><input type="color" value="${esc(it.stroke && it.stroke !== 'none' ? it.stroke : '#262523')}"></span></label>`;
    h += proNum('w', 'Längd', it.w, 1, 160, 0.5, 'mm') + proNum('sw', 'Tjocklek', it.sw, 0.05, 10, 0.05, 'mm');
  } else {
    const noFill = !it.fill || it.fill === 'none', noStroke = !it.stroke || it.stroke === 'none';
    h += `<label class="pf" data-ik="fill"><span>Fyllning</span><span class="pf-col"><input type="color" value="${esc(noFill ? '#ffffff' : it.fill)}"${noFill ? ' disabled' : ''}><label class="pf-none"><input type="checkbox" data-none="fill"${noFill ? ' checked' : ''}> ingen</label></span></label>`;
    h += `<label class="pf" data-ik="stroke"><span>Kant</span><span class="pf-col"><input type="color" value="${esc(noStroke ? '#262523' : it.stroke)}"${noStroke ? ' disabled' : ''}><label class="pf-none"><input type="checkbox" data-none="stroke"${noStroke ? ' checked' : ''}> ingen</label></span></label>`;
    h += proNum('sw', 'Kantens tjocklek', it.sw, 0, 10, 0.05, 'mm');
    h += proNum('w', 'Bredd', it.w, 0.5, 150, 0.5, 'mm') + proNum('h', 'Höjd', it.h, 0.5, 150, 0.5, 'mm');
    if (it.type === 'rect') h += proNum('rad', 'Rundade hörn', it.rad, 0, 50, 0.5, 'mm');
  }
  h += proNum('x', 'Mitten, från vänster', it.x, -20, 130, 0.5, 'mm') + proNum('y', 'Mitten, uppifrån', it.y, -20, 130, 0.5, 'mm');
  h += proNum('rot', 'Vridning', it.rot, -180, 180, 1, '°') + proNum('opp', 'Synlighet', Math.round(it.op * 100), 0, 100, 1, '%');
  const f = proFindItem(it.id), on = f && f.global ? it.on : 'side';
  h += `<label class="pf" data-ik="on"><span>Visas på</span><select>
    <option value="side"${on === 'side' ? ' selected' : ''}>Bara den här sidan</option><option value="all"${on === 'all' ? ' selected' : ''}>Alla sidor på alla kort</option>
    <option value="front"${on === 'front' ? ' selected' : ''}>Alla framsidor</option><option value="back"${on === 'back' ? ' selected' : ''}>Alla baksidor</option></select></label>`;
  h += `<label class="pf" data-ik="layer"><span>Lager</span><select><option value="over"${it.layer === 'over' ? ' selected' : ''}>Ovanpå kortets innehåll</option><option value="under"${it.layer === 'under' ? ' selected' : ''}>Under (som bakgrund)</option></select></label>`;
  h += `<div class="pro-btns"><button type="button" data-act="itemUp" title="Längre fram">Framåt</button><button type="button" data-act="itemDown" title="Längre bak">Bakåt</button><button type="button" data-act="itemDup">Duplicera</button><button type="button" data-act="itemCenter">Centrera</button><button type="button" data-act="itemDel">Ta bort</button></div>`;
  return h + '</fieldset>';
}
function proNewItem(type, extra) {
  const base = { id: uid(), type, x: 55, y: 55, on: 'side' };
  const t = {
    text: { text: 'Text', font: 'serif', pt: 14, color: styleOf(state.deck).text, w: 0 },
    img: { w: 30, h: 30, fit: 'cover' },
    rect: { w: 30, h: 18, fill: '#ffffff', stroke: '#262523', sw: 0.4, rad: 2 },
    ellipse: { w: 22, h: 22, fill: '#ffffff', stroke: '#262523', sw: 0.4 },
    line: { w: 40, h: 1, stroke: '#262523', sw: 0.6, fill: 'none' },
  }[type];
  return proCleanItem(Object.assign(base, t, extra || {}));
}
function proAddItem(type, extra) {
  const it = proNewItem(type, extra);
  proSideP(true).items.push(it);
  proUI.sel = { kind: 'item', id: it.id, side: state.side };
  if (proUI.tab !== 'items') proSetTab('items'); else proRenderPane();
  proChanged();
  if (type === 'text') { const ta = $('#proPanes .pro-form textarea'); if (ta) { ta.focus(); ta.select(); } }
}
function proItemSet(id, k, v) {
  const f = proFindItem(id); if (!f) return;
  const it = f.it;
  if (k === 'on') {
    f.list.splice(f.list.indexOf(it), 1);
    if (v === 'side') { it.on = 'side'; proSideP(true).items.push(it); }
    else { it.on = v; proDeckP().items.push(it); }
    proTidySide();
    proChanged(); proRenderPane(); return;
  }
  if (k === 'opp') { it.op = Math.max(0, Math.min(1, v / 100)); }
  else it[k] = v;
  proChanged();
}
function proItemAct(act) {
  const f = proUI.sel && proUI.sel.kind === 'item' && proFindItem(proUI.sel.id); if (!f) return;
  const { it, list } = f, i = list.indexOf(it);
  if (act === 'itemDel') { list.splice(i, 1); proUI.sel = null; proTidySide(); }
  else if (act === 'itemDup') { const c = proCleanItem(Object.assign({}, it, { id: uid(), x: it.x + 4, y: it.y + 4 })); c.on = it.on; list.splice(i + 1, 0, c); proUI.sel = { kind: 'item', id: c.id, side: state.side }; }
  else if (act === 'itemUp' && i < list.length - 1) { list.splice(i, 1); list.splice(i + 1, 0, it); }
  else if (act === 'itemDown' && i > 0) { list.splice(i, 1); list.splice(i - 1, 0, it); }
  else if (act === 'itemCenter') { it.x = 55; it.y = 55; }
  else if (act === 'itemImg') { proPickImage(src => { it.src = src; proChanged(); }); return; }
  else if (act === 'itemRatio') { proImgRatio(it.src).then(r => { if (r) { it.h = Math.round(it.w / r * 10) / 10; proChanged(); proRenderPane(); } }); return; }
  proChanged(); proRenderPane();
}
function proImgRatio(src) { return new Promise(res => { if (!src) return res(0); const i = new Image(); i.onload = () => res(i.naturalWidth / i.naturalHeight); i.onerror = () => res(0); i.src = src; }); }
function proPickImage(cb) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const src = await proShrinkImage(f);
    cb(src);
  };
  inp.click();
}
// Stora bilder krymps (längsta sida 1600 px) så att kortleken inte blir enorm. PNG behåller genomskinlighet.
function proShrinkImage(file) {
  return new Promise((res, rej) => {
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const max = 1600, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        if (k >= 1 && rd.result.length < 1.5e6) return res(rd.result);
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(/png|gif|webp|svg/i.test(file.type) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9));
      };
      im.onerror = rej; im.src = rd.result;
    };
    rd.onerror = rej; rd.readAsDataURL(file);
  });
}

/* ---------- Vattenstämpel ---------- */
function proWmHTML() {
  const w = proDeckP().wm, q = curQ();
  const sel = (k, opts) => `<label class="pf" data-wk="${k}"><span>${opts.label}</span><select>${opts.o.map(([v, t]) => `<option value="${v}"${String(w[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
  const num = (k, label, v, a, b, st, u) => `<label class="pf" data-wk="${k}"><span>${label}</span><span class="pf-num"><input type="range" min="${a}" max="${b}" step="${st}" value="${v}"><input type="number" min="${a}" max="${b}" step="${st}" value="${v}"><small>${u}</small></span></label>`;
  let h = `<label class="pf pf-bool pro-wm-on" data-wk="on"><input type="checkbox"${w.on ? ' checked' : ''}> Visa vattenstämpel på korten</label>`;
  h += `<p class="help">Vattenstämpeln hamnar på korten i förhandsvisningen och i PDF:en. Den klipps vid kortets kant.</p>`;
  h += `<div class="pro-wm${w.on ? '' : ' off'}">`;
  h += sel('kind', { label: 'Typ', o: [['text', 'Text'], ['img', 'Bild (t.ex. din logga)']] });
  if (w.kind === 'text') {
    h += `<label class="pf" data-wk="text"><span>Text</span><input type="text" value="${esc(w.text)}"></label>`;
    h += `<label class="pf" data-wk="font"><span>Typsnitt</span><select>${proFontOptions(proFontOK(w.font))}</select></label>`;
    h += `<label class="pf" data-wk="color"><span>Färg</span><span class="pf-col"><input type="color" value="${esc(w.color)}"></span></label>`;
    h += num('size', 'Textstorlek', w.size, 4, 120, 0.5, 'pt');
  } else {
    h += `<div class="pf"><span>Bild</span><span><button type="button" data-act="wmImg">${w.img ? 'Byt bild…' : 'Välj bild…'}</button>${w.img ? ` <img class="pro-thumb" src="${w.img}" alt="">` : ''}</span></div>`;
    h += num('size', 'Bredd', w.size, 3, 150, 0.5, 'mm');
  }
  h += num('opp', 'Synlighet', Math.round(w.op * 100), 1, 100, 1, '%');
  h += num('rot', 'Vridning', w.rot, -180, 180, 1, '°');
  h += sel('pos', { label: 'Placering', o: [['center', 'Mitt på kortet'], ['tl', 'Uppe till vänster'], ['tr', 'Uppe till höger'], ['bl', 'Nere till vänster'], ['br', 'Nere till höger'], ['tile', 'Mönster över hela kortet']] });
  h += sel('sides', { label: 'Visas på', o: [['both', 'Fram- och baksidor'], ['front', 'Bara framsidor'], ['back', 'Bara baksidor']] });
  h += sel('layer', { label: 'Lager', o: [['over', 'Ovanpå kortets innehåll'], ['under', 'Under (som bakgrund)']] });
  h += `<label class="pf pf-bool" data-wk="noWm"><input type="checkbox"${q.pro && q.pro.noWm ? ' checked' : ''}> Ingen vattenstämpel på den här sidan (${state.side ? 'baksidan' : 'framsidan'} av kort ${state.cur + 1})</label>`;
  return h + '</div>';
}
function proWmSet(k, v) {
  const w = proDeckP().wm;
  if (k === 'noWm') { const q = curQ(); if (v) { proSideP(true).noWm = true; } else if (q.pro) { delete q.pro.noWm; proTidySide(); } }
  else if (k === 'opp') w.op = Math.max(0.01, Math.min(1, v / 100));
  else w[k] = v;
  proChanged();
  if (k === 'on' || k === 'kind') proRenderPane();
}

/* ---------- Typsnitt ---------- */
function proFontsHTML() {
  const fonts = proDeckP().fonts;
  const have = new Set(fonts.map(f => f.src).filter(Boolean));
  let h = `<p class="help">Typsnitten sparas i kortleken (och i .egna10-filen), så PDF:en blir rätt även utan internet. Välj sedan typsnitt under Layout eller på dina egna texter.</p>`;
  h += `<fieldset><legend>I kortleken</legend><ul class="pro-fonts">`;
  h += `<li><span style="font-family:KortSerif">EB Garamond</span> <small>inbyggt – frågor och svar</small></li>`;
  h += `<li><span style="font-family:KortSans">Montserrat ExtraBold</span> <small>inbyggt – etiketten</small></li>`;
  for (const f of fonts) h += `<li><span style="font-family:'PF${esc(f.id)}'">${esc(f.name)}</span> <button type="button" data-act="fontDel" data-id="${esc(f.id)}">Ta bort</button></li>`;
  h += `</ul></fieldset>`;
  h += `<fieldset><legend>Lägg till</legend><div class="pro-btns"><button type="button" data-act="fontUpload">Eget typsnitt (.ttf)…</button></div>`;
  h += `<p class="help">Gratis typsnitt från Google Fonts (hämtas en gång):</p><ul class="pro-gfonts">`;
  for (const [name, path, desc] of PRO_GOOGLE) h += `<li><span><b>${esc(name)}</b> <small>${esc(desc)}</small></span>${have.has(path) ? '<span class="pro-ok">✓ tillagt</span>' : `<button type="button" data-act="fontGoogle" data-path="${esc(path)}" data-name="${esc(name)}">Lägg till</button>`}</li>`;
  h += `</ul><p class="pro-fontstatus" id="proFontStatus" role="status"></p></fieldset>`;
  return h;
}
function proB64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
async function proAddFont(buf, name, src) {
  const id = uid(), fam = 'PF' + id;
  const ff = new FontFace(fam, buf); await ff.load(); document.fonts.add(ff);
  const c = document.createElement('canvas').getContext('2d'); c.font = `1000px "${fam}"`;
  const widths = {};
  for (const ch of PRO_CHARSET) widths[ch] = Math.round(c.measureText(ch).width);
  const m = s => c.measureText(s);
  const top = Math.max(m('ÅÄÖdhlkbf').actualBoundingBoxAscent, 1) / 1000, bottom = Math.max(m('gjpqy').actualBoundingBoxDescent, 1) / 1000;
  const cap = Math.max(m('H').actualBoundingBoxAscent, 1) / 1000;
  const f = { id, name, b64: proB64(buf), widths, top: Math.min(1.3, top), bottom: Math.min(0.6, bottom), mid: cap * 0.47, src: src || '' };
  PRO_FONT_LOADED.add(proFontKey(id));
  proRegisterFont(f);
  proDeckP().fonts.push(f);
  scheduleSave();
  return proFontKey(id);
}
function proFontStatus(s) { const el = $('#proFontStatus'); if (el) el.textContent = s; }
async function proFontAct(act, el) {
  if (act === 'fontGoogle') {
    proFontStatus(`Hämtar ${el.dataset.name} …`); el.disabled = true;
    try {
      const r = await fetch('https://raw.githubusercontent.com/google/fonts/main/' + el.dataset.path);
      if (!r.ok) throw new Error(r.status);
      await proAddFont(await r.arrayBuffer(), el.dataset.name, el.dataset.path);
      proRenderPane(); proFontStatus(`${el.dataset.name} är tillagt.`);
    } catch (e) { el.disabled = false; proFontStatus('Kunde inte hämta typsnittet. Kontrollera internetanslutningen och försök igen.'); }
  } else if (act === 'fontUpload') {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.ttf,font/ttf';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (!/\.ttf$/i.test(f.name)) { alert('Välj en .ttf-fil. (OTF- och WOFF-filer fungerar inte i PDF:en.)'); return; }
      try { await proAddFont(await f.arrayBuffer(), f.name.replace(/\.ttf$/i, '').replace(/[-_]+/g, ' '), ''); proRenderPane(); proFontStatus('Typsnittet är tillagt.'); }
      catch (e) { alert('Filen kunde inte läsas som ett typsnitt.'); }
    };
    inp.click();
  } else if (act === 'fontDel') {
    const p = proDeckP(), f = p.fonts.find(x => x.id === el.dataset.id); if (!f) return;
    if (!confirm(`Ta bort ${f.name}? Texter som använder det får EB Garamond i stället.`)) return;
    p.fonts.splice(p.fonts.indexOf(f), 1);
    proRenderPane(); proChanged();
  }
}
function proRefreshFontsUI() { if (proUI.tab === 'fonts') proRenderPane(); }

/* ---------- Ritning av rutan ---------- */
function proRenderPane() {
  const box = $('#proPanes'); if (!box) return;
  const t = proUI.tab;
  let pane = box.querySelector(`.pro-pane[data-pt="${t}"]`);
  if (t === 'content') return;
  const html = t === 'layout' ? proLayoutHTML() : t === 'items' ? proItemsHTML() : t === 'wm' ? proWmHTML() : proFontsHTML();
  const focus = document.activeElement && pane && pane.contains(document.activeElement) ? document.activeElement : null;
  if (focus && (focus.tagName === 'TEXTAREA' || (focus.tagName === 'INPUT' && !/checkbox|radio|button/.test(focus.type)))) { proSyncValues(pane); return; }
  const scroll = pane ? pane.scrollTop : 0;
  const openG = pane ? [...pane.querySelectorAll('details[open]')].map(d => d.dataset.g) : [];
  pane.innerHTML = html;
  pane.querySelectorAll('details').forEach(d => { if (openG.includes(d.dataset.g)) d.open = true; });
  pane.scrollTop = scroll;
}
// uppdatera värden utan att rita om (när man skriver i ett fält)
function proSyncValues(pane) {
  if (proUI.tab === 'items' && proUI.sel && proUI.sel.kind === 'item') {
    const f = proFindItem(proUI.sel.id); if (!f) return;
    pane.querySelectorAll('[data-ik]').forEach(l => {
      const k = l.dataset.ik, v = k === 'opp' ? Math.round(f.it.op * 100) : f.it[k];
      l.querySelectorAll('input[type=range],input[type=number]').forEach(i => { if (i !== document.activeElement) i.value = Math.round(v * 100) / 100; });
    });
  }
}

/* ---------- Händelser i rutan ---------- */
function proReadInput(lbl, el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'range' || el.type === 'number') { const v = Number(el.value); return isFinite(v) ? v : null; }
  return el.value;
}
function bindProPanes() {
  const box = $('#proPanes');
  box.innerHTML = ['layout', 'items', 'wm', 'fonts'].map(t => `<div class="pro-pane" data-pt="${t}" hidden></div>`).join('');
  const onInput = e => {
    const el = e.target;
    if (el.name === 'proScope') { proUI.scope = el.value; proRenderPane(); return; }
    const lk = el.closest('[data-k]'), ik = el.closest('[data-ik]'), wk = el.closest('[data-wk]');
    if (el.dataset.none) {                       // ”ingen” fyllning/kant
      const f = proUI.sel && proFindItem(proUI.sel.id); if (!f) return;
      const k = el.dataset.none, col = el.closest('.pf-col').querySelector('input[type=color]');
      col.disabled = el.checked; proItemSet(f.it.id, k, el.checked ? 'none' : col.value); return;
    }
    const v = proReadInput(null, el); if (v === null) return;
    const twin = el.closest('.pf-num'); if (twin) twin.querySelectorAll('input').forEach(i => { if (i !== el) i.value = v; });
    if (lk) proSet(lk.dataset.k, v);
    else if (ik) proItemSet(el.closest('.pro-form').dataset.id, ik.dataset.ik, v);
    else if (wk) proWmSet(wk.dataset.wk, v);
  };
  box.addEventListener('input', onInput);
  box.addEventListener('change', e => { if (e.target.closest('[data-k]') && proUI.scope === 'side') proRenderPane(); });
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('pf-def')) { const k = b.closest('[data-k]').dataset.k; proSet(k, proUI.scope === 'side' ? proGet(k, 'all') : k.startsWith('style.') ? proBaseValAll(k) : ''); proRenderPane(); return; }
    if (b.dataset.add) { if (b.dataset.add === 'img') proPickImage(async src => { const r = await proImgRatio(src); proAddItem('img', { src, w: 40, h: Math.round(40 / (r || 1) * 10) / 10, fit: 'contain' }); }); else proAddItem(b.dataset.add); return; }
    if (b.classList.contains('pro-it')) { proUI.sel = { kind: 'item', id: b.closest('li').dataset.id, side: state.side }; proRenderPane(); renderPreview(); return; }
    const act = b.dataset.act; if (!act) return;
    if (act === 'clearSide') { const q = curQ(); if (q.pro) { q.pro.design = {}; proTidySide(); } proChanged(); proRenderPane(); }
    else if (act === 'resetGrp') { const g = PRO_GROUPS.find(x => x.id === b.dataset.g); const ctl = typeof g.ctl === 'function' ? g.ctl() : g.ctl; const d = proUI.scope === 'side' ? proSideP(false) && proSideP(false).design : proDeckP().design; if (d) ctl.forEach(c => proRawSet(d, c[0], undefined)); proTidySide(); proChanged(); proRenderPane(); }
    else if (act === 'resetAll') { if (!confirm(proUI.scope === 'side' ? 'Ta bort alla layoutändringar för den här sidan?' : 'Återställ layouten för alla kort? (Sidor med egna inställningar behåller dem.)')) return; if (proUI.scope === 'side') { const q = curQ(); if (q.pro) q.pro.design = {}; proTidySide(); } else proDeckP().design = {}; proChanged(); proRenderPane(); }
    else if (act.startsWith('item')) proItemAct(act);
    else if (act === 'wmImg') proPickImage(async src => { const w = proDeckP().wm; w.img = src; w.ratio = 1 / ((await proImgRatio(src)) || 1); proChanged(); proRenderPane(); });
    else if (act.startsWith('font')) proFontAct(act, b);
  });
  box.addEventListener('toggle', e => { const d = e.target; if (d.tagName === 'DETAILS' && d.open && proUI.sel && proUI.sel.kind === 'grp' && proUI.sel.id !== d.dataset.g) { proUI.sel = null; renderPreview(); } }, true);
}
function proBaseValAll(k) { return styleOf(state.deck)[k.slice(6)]; }

/* ---------- Markering och dragning på korten ---------- */
function proSvgPt(svg, e) {
  const m = svg.getScreenCTM(); if (!m) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
function proItemHit(it, x, y) {
  const b = proItemBox(it), [lx, ly] = rotPt(x, y, it.x, it.y, -(it.rot || 0));
  const pad = 1.2;
  return Math.abs(lx - it.x) <= b.w / 2 + pad && Math.abs(ly - it.y) <= b.h / 2 + pad;
}
function proGroupHit(q, si, x, y) {
  const D = proDesign(state.deck, q), cx = 55 + D.cDx, cy = 55 + D.cDy;
  const dist = (a, b) => Math.hypot(x - a, y - b);
  if (state.deck.numbering.show) { const s = `${state.deck.numbering.prefix || ''} ${sideNumber(state.cur, si)}`.trim(), w = strW(s, proFontOK(D.numFont), D.numPt) + 1, hh = D.numPt * PT; if (x >= D.numX - w && x <= D.numX + 1 && y >= D.numY - hh - 1 && y <= D.numY + 1.5) return 'num'; }
  if (!D.tabHide && x >= D.tabX && y <= D.tabH) return 'tab';
  const ax = 55 + D.aDx, ay = 55 + D.aDy, ar = dist(ax, ay);
  if (ar >= D.ansR - D.iconD / 2 - 2 && ar <= D.ansR + D.iconD / 2 + 3) return 'ans';
  if (dist(cx + D.qDx, cy + D.qDy) <= D.qR) return 'q';
  const r = dist(cx, cy);
  if (Math.abs(r - D.ringR) <= Math.max(1.4, D.ringW)) return 'ring';
  if (r <= D.discR) return r > D.ringR ? 'alts' : 'center';
  return 'card';
}
const PRO_DRAG_KEYS = { q: ['qDx', 'qDy'], center: ['cDx', 'cDy'], alts: ['cDx', 'cDy'], ring: ['cDx', 'cDy'], ans: ['aDx', 'aDy'], num: ['numX', 'numY'] };
function proPointerDown(e) {
  const cv = e.target.closest('.pro-cv'); if (!cv) return;
  const svg = cv.querySelector('svg'); if (!svg || e.button > 0) return;
  const si = Number(cv.dataset.side), q = curCard().sides[si];
  const pt = proSvgPt(svg, e); if (!pt) return;
  const [x, y] = pt, h = e.target.closest('[data-h]');
  let target = null;
  if (h && proUI.sel && proUI.sel.kind === 'item') { const f = proFindItem(proUI.sel.id); if (f) target = { kind: 'handle', h: h.dataset.h, it: f.it }; }
  if (!target) {
    const items = [];
    for (const it of proItemsFor(state.deck, q, si)) items.push(it);
    const ordered = items.filter(i => i.layer === 'over').reverse().concat(items.filter(i => i.layer === 'under').reverse());
    const hit = ordered.find(it => proItemHit(it, x, y));
    if (hit) target = { kind: 'item', it: hit };
  }
  if (!target && proUI.tab === 'layout') target = { kind: 'grp', id: proGroupHit(q, si, x, y) };
  if (!target) return;                       // vanligt klick (hoppa till fältet) i Innehåll-fliken
  e.preventDefault();
  if (si !== state.side) { state.side = si; renderEditor(); }
  if (target.kind === 'item') {
    proUI.sel = { kind: 'item', id: target.it.id, side: si };
    if (proUI.tab !== 'items' && proUI.tab !== 'layout') proSetTab('items'); else proRenderPane();
  } else if (target.kind === 'grp') {
    proUI.sel = { kind: 'grp', id: target.id, side: si };
    const det = $(`#proPanes details[data-g="${target.id === 'center' ? 'center' : target.id}"]`);
    $$('#proPanes details.pro-grp').forEach(d => d.classList.toggle('sel', d === det));
    if (det) {
      det.open = true;
      const pane = $('#pEditor');
      if (isMobile()) det.scrollIntoView({ block: 'nearest' });
      else { const r = det.getBoundingClientRect(), pr = pane.getBoundingClientRect(); if (r.top < pr.top || r.bottom > pr.bottom) pane.scrollTop += r.top - pr.top - 40; }
    }
  }
  renderPreview();
  const it = target.it, keys = target.kind === 'grp' ? PRO_DRAG_KEYS[target.id] : null;
  const start = { x, y, ix: it ? it.x : 0, iy: it ? it.y : 0, w: it ? it.w : 0, h: it ? it.h : 0, rot: it ? it.rot : 0,
    k0: keys ? proGet(keys[0]) : 0, k1: keys ? proGet(keys[1]) : 0, ratio: it && it.w && it.h ? it.w / it.h : 1 };
  proUI.drag = { target, start, moved: false, cv, pid: e.pointerId, keys, cx0: e.clientX, cy0: e.clientY, fresh: true };
  try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ }
}
function proPointerMove(e) {
  const d = proUI.drag; if (!d || e.pointerId !== d.pid) return;
  const svg = d.cv.querySelector('svg'); if (!svg || !svg.isConnected) return;
  const pt = proSvgPt(svg, e); if (!pt) return;
  // flyttning räknas i skärmpunkter (sidan kan hoppa lite när statusraden ändras)
  const ppm = (svg.getBoundingClientRect().width || 110) / 110;
  const [x, y] = pt, s = d.start, dx = (e.clientX - d.cx0) / ppm, dy = (e.clientY - d.cy0) / ppm;
  if (!d.moved && Math.hypot(dx, dy) < 0.6) return;
  d.moved = true;
  const r1 = v => Math.round(v * 10) / 10;
  const t = d.target;
  if (t.kind === 'item') { t.it.x = r1(s.ix + dx); t.it.y = r1(s.iy + dy); }
  else if (t.kind === 'handle' && t.h === 'size') {
    const it = t.it, [lx, ly] = rotPt(x, y, it.x, it.y, -(it.rot || 0));
    let w = Math.max(1, Math.abs(lx - it.x) * 2), h = Math.max(1, Math.abs(ly - it.y) * 2);
    if (it.type === 'text' || it.type === 'line') it.w = r1(w);
    else { if ((it.type === 'img') !== e.shiftKey) { if (w / h > s.ratio) h = w / s.ratio; else w = h * s.ratio; } it.w = r1(w); it.h = r1(h); }
  } else if (t.kind === 'handle' && t.h === 'rot') {
    const it = t.it; let a = Math.atan2(y - it.y, x - it.x) * 180 / Math.PI + 90;
    if (a > 180) a -= 360;
    if (e.shiftKey) a = Math.round(a / 15) * 15; else for (const m of [-180, -90, 0, 90, 180]) if (Math.abs(a - m) < 3) a = m;
    it.rot = Math.round(a);
  } else if (t.kind === 'grp' && d.keys) {
    const [k0, k1] = d.keys;
    proSet(k0, r1(s.k0 + dx), true); proSet(k1, r1(s.k1 + dy), true);
  }
  renderPreview();
}
function proPointerUp(e) {
  const d = proUI.drag; if (!d || e.pointerId !== d.pid) return;
  proUI.drag = null;
  if (d.moved) { proUI.suppressClick = true; setTimeout(() => { proUI.suppressClick = false; }, 50); proChanged(true); proRenderPane(); }
  else if (proUI.tab !== 'content') proUI.suppressClick = true, setTimeout(() => { proUI.suppressClick = false; }, 50);
}
function proOverlay(si, scale) {
  const s = proUI.sel; if (!s || s.side !== si || proUI.tab === 'content') return '';
  const blue = '#1d5fa8', sw = 1.2 / scale, hr = Math.max(1.3, 7 / scale);
  if (s.kind === 'item') {
    const f = proFindItem(s.id); if (!f) return '';
    const it = f.it, b = proItemBox(it), pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => rotPt(it.x + a * b.w / 2, it.y + c * b.h / 2, it.x, it.y, it.rot || 0));
    const [rx, ry] = rotPt(it.x, it.y - b.h / 2 - Math.max(5, 22 / scale), it.x, it.y, it.rot || 0), [tx, ty] = rotPt(it.x, it.y - b.h / 2, it.x, it.y, it.rot || 0);
    return `<g class="pro-ov"><polygon points="${pts.map(p => n3(p[0]) + ',' + n3(p[1])).join(' ')}" fill="none" stroke="${blue}" stroke-width="${n3(sw)}" stroke-dasharray="${n3(3 / scale)} ${n3(2 / scale)}"/>`
      + `<line x1="${n3(tx)}" y1="${n3(ty)}" x2="${n3(rx)}" y2="${n3(ry)}" stroke="${blue}" stroke-width="${n3(sw)}"/>`
      + `<circle data-h="rot" cx="${n3(rx)}" cy="${n3(ry)}" r="${n3(hr)}" fill="#fff" stroke="${blue}" stroke-width="${n3(sw * 1.5)}"><title>Dra för att vrida (Skift = steg om 15°)</title></circle>`
      + `<rect data-h="size" x="${n3(pts[2][0] - hr)}" y="${n3(pts[2][1] - hr)}" width="${n3(2 * hr)}" height="${n3(2 * hr)}" fill="${blue}" stroke="#fff" stroke-width="${n3(sw)}"><title>Dra för att ändra storlek</title></rect></g>`;
  }
  const q = curCard().sides[si], D = proDesign(state.deck, q), cx = 55 + D.cDx, cy = 55 + D.cDy;
  const dash = `fill="none" stroke="${blue}" stroke-width="${n3(sw)}" stroke-dasharray="${n3(3 / scale)} ${n3(2 / scale)}"`;
  const c = (x, y, r) => `<circle cx="${n3(x)}" cy="${n3(y)}" r="${n3(r)}" ${dash}/>`;
  switch (s.id) {
    case 'q': return `<g class="pro-ov">${c(cx + D.qDx, cy + D.qDy, D.qR)}</g>`;
    case 'center': case 'alts': return `<g class="pro-ov">${c(cx, cy, D.discR)}</g>`;
    case 'ring': return `<g class="pro-ov">${c(cx, cy, D.ringR)}</g>`;
    case 'ans': return `<g class="pro-ov">${c(55 + D.aDx, 55 + D.aDy, D.ansR - D.iconD / 2 - 1)}${c(55 + D.aDx, 55 + D.aDy, D.ansR + D.iconD / 2 + 1)}</g>`;
    case 'num': return `<g class="pro-ov"><rect x="${n3(D.numX - 14)}" y="${n3(D.numY - D.numPt * PT - 1)}" width="15" height="${n3(D.numPt * PT + 2.5)}" ${dash}/></g>`;
    case 'tab': return `<g class="pro-ov"><rect x="${n3(D.tabX)}" y="0.3" width="${n3(109.7 - D.tabX)}" height="${n3(D.tabH)}" ${dash}/></g>`;
    case 'card': return `<g class="pro-ov"><path d="${pathD((() => { proApplyG(D); const p = cardPath(0); Object.assign(G, G0); return p; })())}" ${dash}/></g>`;
  }
  return '';
}
let proOvRaf = 0;
function proAfterPreview() {
  cancelAnimationFrame(proOvRaf);
  proOvRaf = requestAnimationFrame(() => {
    for (const el of [$('#pvFront'), $('#pvBack')]) {
      if (!el) continue;
      el.classList.add('pro-cv');
      const svg = el.querySelector('svg'); if (!svg) continue;
      const scale = svg.getBoundingClientRect().width / 110 || 3;
      const ov = proOverlay(Number(el.dataset.side), scale);
      if (ov) svg.insertAdjacentHTML('beforeend', ov);
    }
    const mini = $('#proMini');
    if (mini && proUI.tab !== 'content' && isMobile()) {
      const c = curCard(), si = state.side;
      const sc = buildSide(c.sides[si], state.deck, { number: sideNumber(state.cur, si), preview: true, holes: state.holes, si });
      mini.dataset.side = si;
      mini.innerHTML = sceneToSVG(sc);
      const svg = mini.querySelector('svg');
      const scale = (svg.getBoundingClientRect().width || 300) / 110;
      const ov = proOverlay(si, scale); if (ov) svg.insertAdjacentHTML('beforeend', ov);
    }
  });
}

/* ---------- Igång ---------- */
function bindPro() {
  bindProPanes();
  $('#proTabs').addEventListener('click', e => { const b = e.target.closest('[data-pt]'); if (b) proSetTab(b.dataset.pt); });
  const _rp = renderPreview;
  renderPreview = function () { _rp(); proAfterPreview(); };
  const _re = renderEditor;
  renderEditor = function () { _re(); if (proUI.sel && proUI.sel.side !== state.side && proUI.sel.kind === 'grp') proUI.sel = null; proRenderPane(); };
  document.addEventListener('pointerdown', proPointerDown);
  document.addEventListener('pointermove', proPointerMove);
  document.addEventListener('pointerup', proPointerUp);
  document.addEventListener('pointercancel', proPointerUp);
  // klick efter dragning eller i designflikarna ska inte hoppa till textfälten
  document.addEventListener('click', e => { if ((proUI.suppressClick || proUI.tab !== 'content') && e.target.closest('.pro-cv')) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('keydown', e => {
    if (proUI.tab === 'content' || !proUI.sel || proUI.sel.kind !== 'item') return;
    if (/input|textarea|select/i.test(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
    const f = proFindItem(proUI.sel.id); if (!f) return;
    const st = e.shiftKey ? 5 : 0.5, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv) { e.preventDefault(); f.it.x = Math.round((f.it.x + mv[0]) * 10) / 10; f.it.y = Math.round((f.it.y + mv[1]) * 10) / 10; proChanged(); proRenderPane(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); proItemAct('itemDel'); }
    else if (e.key === 'Escape') { proUI.sel = null; renderPreview(); proRenderPane(); }
  });
  const tb = $('.toolbar');
  if (tb && 'ResizeObserver' in window) new ResizeObserver(() => document.documentElement.style.setProperty('--tbh', tb.offsetHeight + 'px')).observe(tb);
  proDeckP();
  renderPreview();
}
