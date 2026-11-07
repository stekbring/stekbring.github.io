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

// ---- samma tabell och regler som i Jordkallaren.js ----
var JK_EM = { ' ': 0.17, ' ': 0.27, ',': 0.27, '.': 0.27, ':': 0.29, '·': 0.29, '°': 0.42, '%': 0.9, '(': 0.36, ')': 0.36, '/': 0.4, '–': 0.6, '−': 0.62, '-': 0.4 }
function jkEm(s) { return Array.from(String(s)).reduce(function (a, c) { return a + (JK_EM[c] !== undefined ? JK_EM[c] : (/\d/.test(c) ? 0.63 : /[A-ZÅÄÖ]/.test(c) ? 0.7 : /[mw]/.test(c) ? 0.9 : /[iljtf]/.test(c) ? 0.33 : 0.58)) }, 0) * 0.95 }
var TS = ' '

function jkBatSymbol(v) { return v.usb ? 'battery.100.bolt' : !num(v.bp) ? 'battery.0' : v.bp >= 88 ? 'battery.100' : v.bp >= 63 ? 'battery.75' : v.bp >= 38 ? 'battery.50' : v.bp >= 13 ? 'battery.25' : 'battery.0' }

// V (från harledVarden) → det format Jordkallaren.js använder
function jkV(V) {
  return {
    ti: V.ti, rh: V.rh, tu: V.tu, bp: V.bp, rs: V.rs, usb: V.usb, upp: V.upp, nasta: V.nasta, tyst: V.tyst, larmOppet: V.larm,
    vader: { upp: V.solUpp, ned: V.solNed, T: V.T, hi: V.H, lo: V.L, harData: num(V.T), riktn: V.riktn, wd: V.wd, ws: V.ws },
  }
}

function jkPunktRad(delar, F) {
  var P = Math.max(0, (F && F.punkt) || 0), ut = []
  delar.forEach(function (d, i) { if (i) { if (P) ut.push(['luft', P]); ut.push(['t', '·']); if (P) ut.push(['luft', P]) } ut.push(['t', d]) })
  return ut
}
function jkRadText(v, k, F) {
  var x = v.vader || {}
  return {
    v: [
      k ? [['ikon', 'sunrise.fill'], ['t', klocka(x.upp) + '–' + klocka(x.ned)]]
        : [['ikon', 'sunrise.fill'], ['t', klocka(x.upp)], ['fluft', 0.4, 1.2], ['sym', 'sunset.fill'], ['t', klocka(x.ned)]],
      x.harData ? [['ikon', 'thermometer.medium'], ['stor', komma(x.T, 0) + '°'], ['fluft', 0.4, 1.0], ['ljus', 'H:'], ['fluft', 0.17, 0.3], ['t', komma(x.hi, 0) + '°'], ['fluft', 0.3, 0.8], ['ljus', 'L:'], ['fluft', 0.17, 0.3], ['t', komma(x.lo, 0) + '°']]
        : [['ikon', 'thermometer.medium'], ['t', 'SMHI –']],
      [['ikon', 'wind'], ['t', x.riktn || ''], ['pil', x.wd], ['t', num(x.ws) ? komma(x.ws, 0) + ' m/s' : '–']],
    ],
    h: [
      k ? [['ikon', v.larmOppet ? 'exclamationmark.triangle.fill' : 'house.fill'], ['t', komma(v.ti) + '°'], ['luft', 0.45], ['t', komma(v.rh) + '%'], ['luft', 0.45], ['t', komma(v.tu) + '°']]
        : [['ikon', v.larmOppet ? 'exclamationmark.triangle.fill' : 'house.fill']].concat(jkPunktRad([komma(v.ti) + '°', komma(v.rh) + '%', komma(v.tu) + '°'], F)),
      [['ikon', jkBatSymbol(v)], ['t', v.usb ? 'Laddar' : (num(v.bp) ? Math.round(v.bp) : '–') + '%'], ['fluft', 0.3, 1.0], ['sym', 'wifi'], ['t', num(v.rs) ? komma(v.rs, 0) + (k ? '' : TS + 'dBm') : '–']],
      v.tyst ? [['ikon', 'exclamationmark.icloud'], ['t', 'tyst ' + klocka(v.upp)]]
        : [['ikon', 'icloud.and.arrow.up'], ['t', klocka(v.upp)], ['fluft', 0.2, 0.6], ['sym', 'arrow.right'], ['fluft', 0, 0.45], ['t', klocka(v.nasta)]],
    ],
  }
}
function jkRadEm(rad, F) {
  return rad.reduce(function (a, p) {
    var typ = p[0], x = p[1]
    return a + (typ === 't' ? jkEm(x) : typ === 'stor' ? jkEm(x) * F.ute : typ === 'ljus' ? jkEm(x) * F.hl : typ === 'sym' ? 1 + F.symLuft : typ === 'pil' ? (x === undefined || x === null ? 0 : 1 + 2 * F.pilLuft) : typ === 'luft' || typ === 'fluft' ? x : 0)
  }, 0)
}
function jkValj(r, mal, F) {
  var flex = r.filter(function (p) { return p[0] === 'fluft' })
  if (!flex.length) return r
  var extra = Math.max(0, mal - jkRadEm(r, F))
  var ut = r.map(function (p) { return p[0] === 'fluft' ? ['luft', p[1]] : p })
  for (var varv = 0; varv < 4 && extra > 0.01; varv++) {
    var kvar = ut.map(function (p, i) { return r[i][0] === 'fluft' && p[1] < r[i][2] - 0.001 ? i : -1 }).filter(function (i) { return i >= 0 })
    if (!kvar.length) break
    var del = extra / kvar.length
    kvar.forEach(function (i) { var ok = Math.min(del, r[i][2] - ut[i][1]); ut[i] = ['luft', ut[i][1] + ok]; extra -= ok })
  }
  return ut
}
// Scriptets uppskattade rektangelbredd (samma som matFor i Jordkallaren.js)
function jkMatW(enhet) { return Math.round(Math.min(enhet.w, enhet.h) * 0.405) }
function jkPassa(radEm, inst, enhet) {
  var F = inst.FIN, egen = inst.kompakt ? inst.STORLEK_RAD_S : inst.STORLEK_RAD
  if (num(egen)) return egen
  var plats = jkMatW(enhet) * 0.77 - (inst.rundad ? 18 : 0)
  var fs = Math.floor(plats / (Math.max.apply(null, radEm) + F.ikonKolumn + F.ikonLuft) * 2) / 2
  return Math.max(9, Math.min(inst.rundad ? 17 : 19, fs))
}

function jkPilSvg(wd, s) {
  var vrid = (wd + 180) % 360
  return '<svg width="' + s + '" height="' + s + '" viewBox="-10 -10 20 20" style="flex:none" aria-hidden="true"><g transform="rotate(' + vrid + ')"><path d="M0 -9.5 L5.9 0.5 L1.9 0.5 L1.9 9.5 L-1.9 9.5 L-1.9 0.5 L-5.9 0.5 Z" fill="#fff"/></g></svg>'
}

// Ritar en halva (8 eller 9). sida = 'v'/'h' (hörnen), vad = 'vader'/'kallare'
function jkHalva(V, inst, enhet, vad, sida) {
  var F = inst.FIN, v = jkV(V), alla = jkRadText(v, inst.kompakt, F)
  var tata = alla.v.concat(alla.h)
  var em = tata.map(function (r) { return jkRadEm(r, F) })
  var fs = jkPassa(em, inst, enhet), mal = Math.max.apply(null, em)
  var W = jkMatW(enhet), H = 72, plats = Math.round(W * 0.77)
  var box = document.createElement('div')
  box.className = 'jk-halva'
  box.style.cssText = 'position:relative;width:' + W + 'px;height:' + H + 'px;flex:none'
  var yta = document.createElement('div')
  var pad = inst.rundad ? [2, sida === 'h' ? 8 : 10, 2, sida === 'v' ? 8 : 10] : [0, 0, 0, 0]
  var st = 'position:absolute;top:0;bottom:0;left:' + ((W - plats) / 2) + 'px;width:' + plats + 'px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;box-sizing:border-box;padding:' + pad.join('px ') + 'px;'
  if (inst.rundad) st += 'background:rgba(255,255,255,.18);border-radius:' + (sida === 'v' ? '16px 0 0 16px' : '0 16px 16px 0') + ';'
  yta.style.cssText = st
  box.appendChild(yta)
  ;(vad === 'vader' ? alla.v : alla.h).forEach(function (r1) {
    var r0 = jkValj(r1, mal, F)
    var rad = document.createElement('div')
    rad.className = 'jk-text-rad'
    rad.style.cssText = 'display:flex;align-items:center;white-space:nowrap;overflow:hidden;min-width:0;font-family:' + TYPSNITT.rundad + ';font-weight:600;color:#fff;line-height:1.2'
    r0.forEach(function (p) {
      var typ = p[0], x = p[1], el
      if (typ === 'ikon') {
        el = document.createElement('span'); el.style.cssText = 'flex:none;display:flex;justify-content:center;width:' + Math.round(fs * F.ikonKolumn) + 'px;margin-right:' + Math.round(fs * F.ikonLuft) + 'px'
        el.innerHTML = sfSvg(x, fs + F.ikon, '#fff')
      } else if (typ === 't' || typ === 'stor' || typ === 'ljus') {
        el = document.createElement('span'); el.textContent = x
        el.style.cssText = 'font-size:' + (fs * (typ === 'stor' ? F.ute : typ === 'ljus' ? F.hl : 1)) + 'px;' + (typ === 'ljus' ? 'color:rgba(255,255,255,' + F.hlSynlig + ');' : '') + 'overflow:hidden;text-overflow:ellipsis;min-width:0'
      } else if (typ === 'luft') {
        el = document.createElement('span'); el.style.cssText = 'flex:none;width:' + (fs * x) + 'px'
      } else if (typ === 'sym') {
        el = document.createElement('span'); el.style.cssText = 'flex:none;display:flex;margin-right:' + (fs * F.symLuft) + 'px'; el.innerHTML = sfSvg(x, fs + F.sym, '#fff')
      } else if (typ === 'pil' && num(x)) {
        el = document.createElement('span'); el.style.cssText = 'flex:none;display:flex;margin:0 ' + (fs * F.pilLuft) + 'px'; el.innerHTML = jkPilSvg(x, fs + F.pil)
      }
      if (el) rad.appendChild(el)
    })
    yta.appendChild(rad)
  })
  box.dataset.fs = fs
  box.dataset.passar = (mal + F.ikonKolumn + F.ikonLuft) * fs <= plats - pad[1] - pad[3] + 0.5 ? '1' : ''
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

// FIN-blocket att klistra in i Jordkallaren.js
function jkFinText(inst) {
  var F = inst.FIN, c = function (k) { return String(F[k]) }
  return 'const STORLEK_RAD = ' + (num(inst.STORLEK_RAD) ? inst.STORLEK_RAD : 'null') + '          // 8 och 9\n' +
    'const STORLEK_RAD_S = ' + (num(inst.STORLEK_RAD_S) ? inst.STORLEK_RAD_S : 'null') + '        // 8S och 9S (kortare rader)\n\n' +
    'const FIN = {\n' + Object.keys(FIN_STD).map(function (k) { return '  ' + k + ': ' + c(k) + ',' + ' '.repeat(Math.max(1, 14 - k.length - c(k).length)) + '// ' + FIN_INFO[k][0] }).join('\n') + '\n}\n'
}
