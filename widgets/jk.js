// =====================================================================
//  Jordkällaren-läget: förhandsvisning och finjustering av låsskärmens
//  hela rad (8 + 9) med exakt samma uträkning som Jordkallaren.js.
// =====================================================================

var FIN_STD = { ikon: 0, ikonKolumn: 1.2, ikonLuft: 0.2, sym: -1, symLuft: 0.15, pil: -2, pilLuft: 0.15, ute: 1.2, hl: 0.85, hlSynlig: 0.55, punkt: 0 }
var FIN_INFO = {
  ikon: ['Ikoner först på raden', 'pt större/mindre än texten', -4, 6, 0.5],
  ikonKolumn: ['Ikonkolumnens bredd', '× textstorleken', 0.8, 2, 0.05],
  ikonLuft: ['Luft mellan ikon och text', 'textbredder', 0, 1, 0.05],
  sym: ['Små ikoner mitt i raden', 'pt (solnedgång, wifi, pil)', -6, 4, 0.5],
  symLuft: ['Luft efter små ikoner', 'textbredder', 0, 0.8, 0.05],
  pil: ['Vindpilen', 'pt', -6, 4, 0.5],
  pilLuft: ['Luft runt vindpilen', 'textbredder', 0, 0.8, 0.05],
  ute: ['Ute-temperaturen (vänster)', '× textstorleken', 0.8, 1.6, 0.05],
  hl: ['H: och L:', '× textstorleken', 0.5, 1.2, 0.05],
  hlSynlig: ['H: och L: synlighet', '0–1', 0.1, 1, 0.05],
  punkt: ['Luft runt punkterna', 'textbredder (6,6°·93,9%·0,7°)', 0, 0.6, 0.02],
}

// Inställningar som bara finns per rad
var RAD_INFO = {
  storlek: ['Radens storlek', '× textstorleken (1 = som de andra)', 0.6, 1.6, 0.05],
  fyll: ['Bredda till den bredaste raden', 'mellanrummen får växa'],
}
function jkInfo(k) {
  if (FIN_INFO[k]) return FIN_INFO[k]
  if (RAD_INFO[k]) return RAD_INFO[k]
  if (k.indexOf('luft_') === 0) return [RM_LUFT[k.slice(5)] || 'Luft', 'textbredder (minst)', 0, 2, 0.02]
  return [k, '', 0, 1, 0.05]
}
// Standardvärdet för en inställning på en rad (det som gäller om raden inte ändrats)
function jkRadStd(id, k, inst) {
  if (k === 'storlek') return 1
  if (k === 'fyll') return true
  if (k.indexOf('luft_') === 0) {
    var alla = rmRader({ vader: { harData: true, wd: 0, ws: 1 }, bp: 50, rs: -60 }, inst.kompakt), namn = k.slice(5)
    var rad = alla.v.concat(alla.h).filter(function (x) { return x.id === id })[0]
    var p = rad.s.filter(function (x) { return (x[0] === 'luft' || x[0] === 'fluft') && x[x.length - 1] === namn })[0]
    return p ? p[1] : 0
  }
  return inst.FIN[k]
}

// V (från harledVarden) → det format Jordkallaren.js använder
function jkV(V) {
  return {
    ti: V.ti, rh: V.rh, tu: V.tu, bp: V.bp, rs: V.rs, usb: V.usb, upp: V.upp, nasta: V.nasta, tyst: V.tyst, larmOppet: V.larm,
    vader: { upp: V.solUpp, ned: V.solNed, T: V.T, hi: V.H, lo: V.L, harData: num(V.T), riktn: V.riktn, wd: V.wd, ws: V.ws },
  }
}
// Scriptets uppskattade rektangelbredd (samma som matFor i Jordkallaren.js)
function jkMatW(enhet) { return Math.round(Math.min(enhet.w, enhet.h) * 0.405) }

function jkPilSvg(wd, s) {
  var vrid = (wd + 180) % 360
  return '<svg width="' + s + '" height="' + s + '" viewBox="-10 -10 20 20" style="flex:none" aria-hidden="true"><g transform="rotate(' + vrid + ')"><path d="M0 -9.5 L5.9 0.5 L1.9 0.5 L1.9 9.5 L-1.9 9.5 L-1.9 0.5 L-5.9 0.5 Z" fill="#fff"/></g></svg>'
}

// Ritar en halva (8 eller 9). sida = 'v'/'h' (hörnen), vad = 'vader'/'kallare', vald = vald rad
function jkHalva(V, inst, enhet, vad, sida, vald) {
  var W = jkMatW(enhet), H = 72, plats = Math.round(W * 0.77)
  var L = rmLayout(jkV(V), inst.kompakt, inst.FIN, inst.RADER || {}, inst.kompakt ? inst.STORLEK_RAD_S : inst.STORLEK_RAD, W * 0.77 - (inst.rundad ? 18 : 0), inst.rundad)
  var box = document.createElement('div')
  box.className = 'jk-halva'
  box.style.cssText = 'position:relative;width:' + W + 'px;height:' + H + 'px;flex:none'
  var yta = document.createElement('div')
  var pad = inst.rundad ? [2, sida === 'h' ? 8 : 10, 2, sida === 'v' ? 8 : 10] : [0, 0, 0, 0]
  var st = 'position:absolute;top:0;bottom:0;left:' + ((W - plats) / 2) + 'px;width:' + plats + 'px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;box-sizing:border-box;padding:' + pad.join('px ') + 'px;'
  if (inst.rundad) st += 'background:rgba(255,255,255,.18);border-radius:' + (sida === 'v' ? '16px 0 0 16px' : '0 16px 16px 0') + ';'
  yta.style.cssText = st
  box.appendChild(yta)
  ;(vad === 'vader' ? L.v : L.h).forEach(function (rr) {
    var rad = document.createElement('div')
    rad.className = 'jk-text-rad' + (vald === rr.id ? ' vald' : '') + (inst.RADER && inst.RADER[rr.id] && Object.keys(inst.RADER[rr.id]).length ? ' andrad' : '')
    rad.dataset.rad = rr.id
    rad.title = RM_NAMN[rr.id] + ' – klicka för att ändra bara den här raden'
    rad.style.cssText = 'display:flex;align-items:center;white-space:nowrap;overflow:hidden;min-width:0;font-family:' + TYPSNITT.rundad + ';font-weight:600;color:#fff;line-height:1.2;cursor:pointer'
    rr.d.forEach(function (d) {
      var el = document.createElement('span')
      if (d[0] === 'ikon') { el.style.cssText = 'flex:none;display:flex;justify-content:center;width:' + d[3] + 'px;margin-right:' + d[4] + 'px'; el.innerHTML = sfSvg(d[1], d[2], '#fff') }
      else if (d[0] === 'text') { el.textContent = d[1]; el.style.cssText = 'font-size:' + d[2] + 'px;' + (d[3] < 1 ? 'color:rgba(255,255,255,' + d[3] + ');' : '') + 'overflow:hidden;text-overflow:ellipsis;min-width:0' }
      else if (d[0] === 'luft') el.style.cssText = 'flex:none;width:' + Math.max(0, d[1]) + 'px'
      else if (d[0] === 'sym') { el.style.cssText = 'flex:none;display:flex'; el.innerHTML = sfSvg(d[1], d[2], '#fff') }
      else if (d[0] === 'pil') { el.style.cssText = 'flex:none;display:flex'; el.innerHTML = jkPilSvg(d[1], d[2]) }
      rad.appendChild(el)
    })
    yta.appendChild(rad)
  })
  box.dataset.fs = L.fs
  box.dataset.passar = L.passar ? '1' : ''
  return box
}

// Webbläsarens typsnitt kan vara bredare än iPhonens (t.ex. utan SF Rounded).
// Om skriptets uträkning säger att raden får plats trycks den ihop i sidled här,
// i stället för att visa "…" som inte syns på telefonen.
function jkAnpassa(box) {
  if (!box.dataset.passar) return
  box.querySelectorAll('.jk-text-rad').forEach(function (rad) {
    rad.style.transform = ''; rad.style.width = ''
    var tillg = rad.parentNode.clientWidth - parseFloat(getComputedStyle(rad.parentNode).paddingLeft) - parseFloat(getComputedStyle(rad.parentNode).paddingRight)
    if (tillg <= 0) return
    rad.style.width = 'max-content'
    var bred = rad.scrollWidth
    if (bred > tillg) { rad.style.transformOrigin = 'left center'; rad.style.transform = 'scaleX(' + (tillg / bred).toFixed(4) + ')' }
    else rad.style.width = ''
  })
}

// Raderna att klistra in i Jordkallaren.js (ersätter STORLEK_RAD … RADER)
function jkFinText(inst) {
  var F = inst.FIN, c = function (k) { return String(F[k]) }, R = inst.RADER || {}
  var rader = Object.keys(R).filter(function (id) { return Object.keys(R[id]).length }).map(function (id) {
    return '  ' + id + ': { ' + Object.keys(R[id]).map(function (k) { return k + ': ' + JSON.stringify(R[id][k]) }).join(', ') + ' },   // ' + RM_NAMN[id]
  })
  return 'let STORLEK_RAD = ' + (num(inst.STORLEK_RAD) ? inst.STORLEK_RAD : 'null') + '            // 8 och 9\n' +
    'let STORLEK_RAD_S = ' + (num(inst.STORLEK_RAD_S) ? inst.STORLEK_RAD_S : 'null') + '          // 8S och 9S (kortare rader)\n\n' +
    'const FIN = {\n' + Object.keys(FIN_STD).map(function (k) { return '  ' + k + ': ' + c(k) + ',' + ' '.repeat(Math.max(1, 14 - k.length - c(k).length)) + '// ' + FIN_INFO[k][0] }).join('\n') + '\n}\n' +
    'let RADER = {' + (rader.length ? '\n' + rader.join('\n') + '\n' : '') + '}\n'
}
