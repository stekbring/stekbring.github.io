// ===== RADMOTOR START =====
// Låsskärmens hela rad (8 + 9): vad som står på varje rad och hur stort/luftigt det blir.
// Samma kod finns i Jordkallaren.js och i Widgets (stekbring.github.io/widgets).
// Kräver num, komma och klocka.
var RM_EM = { ' ': 0.17, ' ': 0.27, ',': 0.27, '.': 0.27, ':': 0.29, '·': 0.29, '°': 0.42, '%': 0.9, '(': 0.36, ')': 0.36, '/': 0.4, '–': 0.6, '−': 0.62, '-': 0.4 }
function rmEm(s) { return Array.from(String(s)).reduce(function (a, c) { return a + (RM_EM[c] !== undefined ? RM_EM[c] : (/\d/.test(c) ? 0.63 : /[A-ZÅÄÖ]/.test(c) ? 0.7 : /[mw]/.test(c) ? 0.9 : /[iljtf]/.test(c) ? 0.33 : 0.58)) }, 0) * 0.95 }
function rmBat(v) { return v.usb ? 'battery.100.bolt' : !num(v.bp) ? 'battery.0' : v.bp >= 88 ? 'battery.100' : v.bp >= 63 ? 'battery.75' : v.bp >= 38 ? 'battery.50' : v.bp >= 13 ? 'battery.25' : 'battery.0' }

// Raderna. Mellanrum: ['luft', textbredder, namn] är fast, ['fluft', minst, högst, namn] får växa
// så att raderna blir lika breda. Namnet gör att varje mellanrum kan ändras för sig (RADER).
var RM_NAMN = { sol: 'Sol upp/ned', termo: 'Ute (SMHI)', vind: 'Vind', hus: 'Jordkällaren', bat: 'Batteri och wifi', moln: 'Uppladdning' }
var RM_LUFT = { mitt: 'Luft i mitten', efterT: 'Luft efter temperaturen', H: 'Luft efter H:', HL: 'Luft mellan H och L', L: 'Luft efter L:', mellan: 'Luft mellan värdena', fore: 'Luft före pilen', efter: 'Luft efter pilen' }
function rmRader(v, k) {
  var x = v.vader || {}, TS = ' '
  return {
    v: [
      { id: 'sol', s: k ? [['ikon', 'sunrise.fill'], ['t', klocka(x.upp) + '–' + klocka(x.ned)]]
        : [['ikon', 'sunrise.fill'], ['t', klocka(x.upp)], ['fluft', 0.4, 1.2, 'mitt'], ['sym', 'sunset.fill'], ['t', klocka(x.ned)]] },
      { id: 'termo', s: x.harData ? [['ikon', 'thermometer.medium'], ['stor', komma(x.T, 0) + '°'], ['fluft', 0.4, 1.0, 'efterT'], ['ljus', 'H:'], ['fluft', 0.17, 0.3, 'H'], ['t', komma(x.hi, 0) + '°'], ['fluft', 0.3, 0.8, 'HL'], ['ljus', 'L:'], ['fluft', 0.17, 0.3, 'L'], ['t', komma(x.lo, 0) + '°']]
        : [['ikon', 'thermometer.medium'], ['t', 'SMHI –']] },
      { id: 'vind', s: [['ikon', 'wind'], ['t', x.riktn || ''], ['pil', x.wd], ['t', num(x.ws) ? komma(x.ws, 0) + ' m/s' : '–']] },
    ],
    h: [
      { id: 'hus', s: k ? [['ikon', v.larmOppet ? 'exclamationmark.triangle.fill' : 'house.fill'], ['t', komma(v.ti) + '°'], ['luft', 0.45, 'mellan'], ['t', komma(v.rh) + '%'], ['luft', 0.45, 'mellan'], ['t', komma(v.tu) + '°']]
        : [['ikon', v.larmOppet ? 'exclamationmark.triangle.fill' : 'house.fill'], ['t', komma(v.ti) + '°'], ['punkt'], ['t', komma(v.rh) + '%'], ['punkt'], ['t', komma(v.tu) + '°']] },
      { id: 'bat', s: [['ikon', rmBat(v)], ['t', v.usb ? 'Laddar' : (num(v.bp) ? Math.round(v.bp) : '–') + '%'], ['fluft', 0.3, 1.0, 'mitt'], ['sym', 'wifi'], ['t', num(v.rs) ? komma(v.rs, 0) + (k ? '' : TS + 'dBm') : '–']] },
      { id: 'moln', s: v.tyst ? [['ikon', 'exclamationmark.icloud'], ['t', 'tyst ' + klocka(v.upp)]]
        : k ? [['ikon', 'icloud.and.arrow.up'], ['t', klocka(v.upp)], ['luft', 0.2, 'fore'], ['sym', 'arrow.right'], ['t', klocka(v.nasta)]]
        : [['ikon', 'icloud.and.arrow.up'], ['t', klocka(v.upp)], ['fluft', 0.2, 0.6, 'fore'], ['sym', 'arrow.right'], ['fluft', 0, 0.45, 'efter'], ['t', klocka(v.nasta)]] },
    ],
  }
}

// Inställningarna för en rad: FIN för alla rader, ändrat av RADER[id] för just den raden
function rmInst(id, FIN, RADER) {
  var G = {}, k
  for (k in FIN) G[k] = FIN[k]
  G.storlek = 1; G.fyll = true
  var R = (RADER && RADER[id]) || {}
  for (k in R) if (R[k] !== null && R[k] !== undefined) G[k] = R[k]
  return G
}
// Raden med radens egna mellanrum insatta (punkter, namngivna mellanrum, fyll av/på)
function rmTillampa(s, G) {
  var ut = []
  s.forEach(function (p) {
    if (p[0] === 'punkt') { var P = Math.max(0, G.punkt || 0); if (P) ut.push(['luft', P]); ut.push(['t', '·']); if (P) ut.push(['luft', P]); return }
    if (p[0] === 'luft' || p[0] === 'fluft') {
      var egen = G['luft_' + p[p.length - 1]], lo = num(egen) ? Math.max(0, egen) : p[1]
      if (p[0] === 'luft' || !G.fyll) ut.push(['luft', lo])
      else ut.push(['fluft', lo, Math.max(lo, p[2])])
      return
    }
    ut.push(p)
  })
  return ut
}
function rmRadEm(r, G) {
  return r.reduce(function (a, p) {
    var typ = p[0], x = p[1]
    return a + (typ === 't' ? rmEm(x) : typ === 'stor' ? rmEm(x) * G.ute : typ === 'ljus' ? rmEm(x) * G.hl : typ === 'sym' ? 1 + G.symLuft : typ === 'pil' ? (num(x) ? 1 + 2 * G.pilLuft : 0) : typ === 'luft' || typ === 'fluft' ? x : 0)
  }, 0)
}
function rmFyll(r, extra) {
  var ut = r.map(function (p) { return p[0] === 'fluft' ? ['luft', p[1]] : p })
  for (var varv = 0; varv < 4 && extra > 0.01; varv++) {
    var kvar = ut.map(function (p, i) { return r[i][0] === 'fluft' && p[1] < r[i][2] - 0.001 ? i : -1 }).filter(function (i) { return i >= 0 })
    if (!kvar.length) break
    var del = extra / kvar.length
    kvar.forEach(function (i) { var ok = Math.min(del, r[i][2] - ut[i][1]); ut[i] = ['luft', ut[i][1] + ok]; extra -= ok })
  }
  return ut
}
// Räknar ut allt. egen = vald textstorlek (eller null), plats = bredd för texten i pt.
// Svar: { fs, passar, v: [rad], h: [rad] } där rad = { id, fs, d: [delar i pt] }
//   ['ikon', namn, ikonstorlek, kolumnbredd, luft efter] ['text', text, storlek, synlighet]
//   ['luft', pt] ['sym', namn, storlek] ['pil', vindriktning, storlek]
function rmLayout(v, k, FIN, RADER, egen, plats, rundad) {
  var alla = rmRader(v, k), lista = alla.v.concat(alla.h)
  lista.forEach(function (r) {
    r.G = rmInst(r.id, FIN, RADER); r.r = rmTillampa(r.s, r.G); r.em = rmRadEm(r.r, r.G)
    r.tot = (r.em + r.G.ikonKolumn + r.G.ikonLuft) * r.G.storlek
  })
  var mal = Math.max.apply(null, lista.map(function (r) { return r.tot }))
  var fs = num(egen) ? egen : Math.max(9, Math.min(rundad ? 17 : 19, Math.floor(plats / mal * 2) / 2))
  var gor = function (r) {
    var G = r.G, f = fs * G.storlek, d = []
    rmFyll(r.r, Math.max(0, (mal - r.tot) / G.storlek)).forEach(function (p) {
      var typ = p[0], x = p[1]
      if (typ === 'ikon') d.push(['ikon', x, f + G.ikon, Math.round(f * G.ikonKolumn), Math.round(f * G.ikonLuft)])
      else if (typ === 't') d.push(['text', x, f, 1])
      else if (typ === 'stor') d.push(['text', x, f * G.ute, 1])
      else if (typ === 'ljus') d.push(['text', x, f * G.hl, G.hlSynlig])
      else if (typ === 'luft') d.push(['luft', f * x])
      else if (typ === 'sym') { d.push(['sym', x, f + G.sym]); d.push(['luft', f * G.symLuft]) }
      else if (typ === 'pil' && num(x)) { d.push(['luft', f * G.pilLuft]); d.push(['pil', x, f + G.pil]); d.push(['luft', f * G.pilLuft]) }
    })
    // text som står direkt efter varandra med samma storlek blir en text (som förut)
    var ihop = []
    d.forEach(function (x) { var y = ihop[ihop.length - 1]; if (y && x[0] === 'text' && y[0] === 'text' && y[2] === x[2] && y[3] === x[3]) y[1] += x[1]; else ihop.push(x.slice()) })
    return { id: r.id, fs: f, d: ihop }
  }
  return { fs: fs, passar: mal * fs <= plats + 0.5, v: alla.v.map(gor), h: alla.h.map(gor) }
}
// Vilka inställningar som gäller en rad (för Widgets)
function rmNycklar(id, k) {
  var r = rmRader({ vader: { harData: true, wd: 0, ws: 1 }, bp: 50, rs: -60 }, k)
  var rad = r.v.concat(r.h).filter(function (x) { return x.id === id })[0]
  var n = ['storlek', 'ikon', 'ikonKolumn', 'ikonLuft'], luft = [], harF = false
  rad.s.forEach(function (p) {
    if (p[0] === 'sym' && n.indexOf('sym') < 0) n.push('sym', 'symLuft')
    if (p[0] === 'pil') n.push('pil', 'pilLuft')
    if (p[0] === 'stor') n.push('ute')
    if (p[0] === 'ljus' && n.indexOf('hl') < 0) n.push('hl', 'hlSynlig')
    if (p[0] === 'punkt' && n.indexOf('punkt') < 0) n.push('punkt')
    if ((p[0] === 'luft' || p[0] === 'fluft') && luft.indexOf('luft_' + p[p.length - 1]) < 0) luft.push('luft_' + p[p.length - 1])
    if (p[0] === 'fluft') harF = true
  })
  return n.concat(luft).concat(harF ? ['fyll'] : [])
}
// ===== RADMOTOR SLUT =====
