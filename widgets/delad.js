// =====================================================================
//  Widgets – delad kod
//  Samma funktioner används både i webbverktyget (förhandsvisningen) och i
//  skriptet i Scriptable, så att värden och text blir exakt likadana.
//  Inga plattformsfunktioner här: bara räkning och text.
// =====================================================================

var DYGN = 864e5, TIMME = 3600e3

function num(v) { return typeof v === 'number' && isFinite(v) }
function pad2(n) { return String(n).padStart(2, '0') }

// 6.5 → "6,5", −0.04 → "0,0", minus som riktigt minustecken
function komma(v, d) {
  if (d === undefined) d = 1
  if (!num(v)) return '–'
  var s = v.toFixed(d)
  if (/^-0(\.0+)?$/.test(s)) s = s.slice(1)
  return s.replace('.', ',').replace('-', '−')
}
function klocka(t) { if (!num(t) || !t) return '–'; var d = new Date(t); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) }
var MANADER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
var VECKODAGAR = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
function datum(t) { var d = new Date(t); return d.getDate() + ' ' + MANADER[d.getMonth()] }
function midnatt(t) { var d = new Date(t === undefined ? Date.now() : t); d.setHours(0, 0, 0, 0); return d.getTime() }
function vecka(ms) {
  var d = new Date(ms === undefined ? Date.now() : ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  var v1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - v1) / DYGN - 3 + (v1.getDay() + 6) % 7) / 7)
}
function lista(o) { return o && typeof o === 'object' ? Object.keys(o).map(function (k) { var v = o[k]; v = Object.assign({ id: k }, v); return v }) : [] }

// Batterikurvan (vilospänning → procent), samma som webbsidan
var BAT_V = [3.20, 3.40, 3.55, 3.65, 3.70, 3.75, 3.80, 3.85, 3.92, 4.00, 4.10, 4.20]
var BAT_P = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
function batPct(v) {
  if (!num(v) || v < 2.5) return null
  if (v <= BAT_V[0]) return 0
  for (var i = 1; i < BAT_V.length; i++) if (v <= BAT_V[i]) return BAT_P[i - 1] + (BAT_P[i] - BAT_P[i - 1]) * (v - BAT_V[i - 1]) / (BAT_V[i] - BAT_V[i - 1])
  return 100
}

// Soluppgång och solnedgång (NOAA:s förenklade formel, några minuters noggrannhet)
function solTider(dagMs, lat, lon) {
  var d = new Date(dagMs); d.setHours(12, 0, 0, 0)
  var rad = Math.PI / 180
  var J = d.getTime() / 864e5 + 2440587.5
  var n = Math.round(J - 2451545.0 + 0.0008)
  var Js = n - lon / 360
  var M = ((357.5291 + 0.98560028 * Js) % 360 + 360) % 360
  var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad)
  var L = (M + C + 180 + 102.9372) % 360
  var Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad)
  var sd = Math.sin(L * rad) * Math.sin(23.4397 * rad), cd = Math.cos(Math.asin(sd))
  var cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sd) / (Math.cos(lat * rad) * cd)
  if (cw > 1 || cw < -1) return { upp: null, ned: null }
  var w = Math.acos(cw) / rad
  var tillMs = function (j) { return (j - 2440587.5) * 864e5 }
  return { upp: tillMs(Jt - w / 360), ned: tillMs(Jt + w / 360) }
}
var RIKTNINGAR = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSV', 'SV', 'VSV', 'V', 'VNV', 'NV', 'NNV']

// SMHI:s svar (snow1g eller pmp3g) → [{t, T, ws, wd, pm}]
function smhiSerie(j) {
  return ((j && j.timeSeries) || []).map(function (p) {
    var d = p.data || {}
    var par = function (n) { var x = p.parameters && p.parameters.find(function (y) { return y.name === n }); return x && x.values ? x.values[0] : undefined }
    var ok = function (x) { return num(x) && x !== 9999 ? x : null }
    var pmKey = Object.keys(d).find(function (k) { return /precipitation_amount|precipitation_mean/.test(k) })
    return {
      t: new Date(p.time || p.validTime).getTime(),
      T: ok(d.air_temperature !== undefined ? d.air_temperature : par('t')),
      ws: ok(d.wind_speed !== undefined ? d.wind_speed : par('ws')),
      wd: ok(d.wind_from_direction !== undefined ? d.wind_from_direction : par('wd')),
      pm: ok(pmKey ? d[pmKey] : par('pmean')),
    }
  }).filter(function (p) { return num(p.t) }).slice(0, 48)
}

// ---------------------------------------------------------------------
//  Alla värden som widgetarna kan visa, ur rådata.
//  in = { latest, larm, timmar: [...], vader: {plats, ts}, json, nu }
// ---------------------------------------------------------------------
function harledVarden(inn) {
  var nu = inn.nu || Date.now()
  var L = inn.latest || {}
  var V = {}
  // --- jordkällaren ---
  V.ti = L.ti; V.rh = L.rh; V.tu = L.tu; V.rs = L.rs; V.bv = L.bv
  V.bp = num(L.bp) ? L.bp : batPct(L.bv)
  V.usb = !!L.usb
  V.matt = L.at || null
  V.upp = L.uppAt || L.at || null
  V.nasta = num(L.nastaUpp) ? (L.usb && num(L.matS) ? Math.max(L.nastaUpp, L.at + L.matS * 1000) : L.nastaUpp) : (L.at ? L.at + TIMME : null)
  V.tyst = !!L.at && num(V.nasta) && nu > V.nasta + Math.max(3 * 60e3, (V.nasta - V.upp) * 0.25)
  var bits = num(L.larm) ? L.larm : 0, start = 0
  lista(inn.larm && inn.larm.aktiva).forEach(function (a) { if (num(a.start) && a.start > start) start = a.start })
  var kv = inn.larm && inn.larm.kvitterad && inn.larm.kvitterad.at
  V.larmBits = bits
  V.larm = bits !== 0 && !(num(kv) && kv > start)
  V.larmKvitterat = bits !== 0 && !V.larm
  V.larmText = [bits & 1 ? 'för kallt' : '', bits & 2 ? 'för varmt' : '', bits & 4 ? 'för fuktigt' : ''].filter(Boolean).join(', ')
  V.larmStart = start || null
  V.minSedan = V.upp ? Math.round((nu - V.upp) / 60e3) : null
  V.minTill = V.nasta ? Math.round((V.nasta - nu) / 60e3) : null
  // dagens min och max, trend och dygnsserier
  var T = (inn.timmar || []).slice().sort(function (a, b) { return a.at - b.at })
  var idag = T.filter(function (h) { return h.at >= midnatt(nu) })
  ;['ti', 'rh', 'tu'].forEach(function (k) {
    var lo = idag.map(function (h) { return num(h[k + 'Min']) ? h[k + 'Min'] : h[k] }).concat([L[k]]).filter(num)
    var hi = idag.map(function (h) { return num(h[k + 'Max']) ? h[k + 'Max'] : h[k] }).concat([L[k]]).filter(num)
    V[k + 'Min'] = lo.length ? Math.min.apply(null, lo) : null
    V[k + 'Max'] = hi.length ? Math.max.apply(null, hi) : null
  })
  var forra = T.filter(function (h) { return h.at <= (L.at || nu) - TIMME }).pop()
  V.trend = num(L.ti) && forra && num(forra.ti) ? L.ti - forra.ti : null
  V.serier = {}
  ;['ti', 'rh', 'tu', 'bp'].forEach(function (k) {
    var s = T.filter(function (h) { return num(k === 'bp' ? batPct(h.bv) : h[k]) }).map(function (h) { return [h.at + TIMME / 2, k === 'bp' ? batPct(h.bv) : h[k]] })
    if (num(V[k]) && L.at) s.push([L.at, V[k]])
    V.serier[k] = s
  })
  // potatisbetyget (andel timmar i idealzonen senaste 7 dygnen)
  var z = inn.zon || { tiLo: 3, tiHi: 6, rhLo: 85, rhHi: 95 }
  var b7 = T.filter(function (h) { return h.at >= nu - 7 * DYGN })
  var andel = function (a, f) { return a.length ? a.filter(f).length / a.length : null }
  var tiIn = andel(b7.filter(function (h) { return num(h.ti) }), function (h) { return h.ti >= z.tiLo && h.ti <= z.tiHi })
  var rhIn = andel(b7.filter(function (h) { return num(h.rh) }), function (h) { return h.rh >= z.rhLo && h.rh <= z.rhHi })
  var delar = [tiIn, rhIn].filter(num)
  V.betyg = delar.length ? Math.round(delar.reduce(function (a, b) { return a + b }, 0) / delar.length * 100) : null

  // --- väder (SMHI + solen) ---
  var vd = inn.vader || {}, pl = vd.plats || { lat: 57.1686, lon: 15.3497 }
  var ts = vd.ts || []
  var just = ts.filter(function (p) { return p.t >= nu - TIMME }).sort(function (a, b) { return Math.abs(a.t - nu) - Math.abs(b.t - nu) })[0]
  var dag = ts.filter(function (p) { return p.t >= midnatt(nu) && p.t < midnatt(nu) + DYGN && num(p.T) }).map(function (p) { return p.T })
  if (just && num(just.T)) dag.push(just.T)
  var sol = solTider(nu, pl.lat, pl.lon)
  V.T = just ? just.T : null
  V.H = dag.length ? Math.max.apply(null, dag) : null
  V.L = dag.length ? Math.min.apply(null, dag) : null
  V.ws = just ? just.ws : null
  V.wd = just ? just.wd : null
  V.riktn = just && num(just.wd) ? RIKTNINGAR[Math.round(just.wd / 22.5) % 16] : ''
  V.solUpp = sol.upp; V.solNed = sol.ned
  var forsta = ts.slice(0, 13).find(function (p) { return num(p.pm) && p.pm >= 0.1 })
  V.regnOm = forsta ? Math.max(0, Math.round((forsta.t - nu) / 60e3)) : null

  // --- tid ---
  V.nu = nu; V.vecka = vecka(nu); V.veckodag = VECKODAGAR[new Date(nu).getDay()]
  // --- egen JSON ---
  V.json = inn.json || null
  return V
}

// Hämtar ett värde: "ti", "serier.ti", "json.a.b"
function hamtaVarde(V, namn) {
  var delar = String(namn).split('.'), x = V
  for (var i = 0; i < delar.length; i++) { if (x === null || x === undefined) return undefined; x = x[delar[i]] }
  return x
}

// Text med platshållare: {ti:1}° · {rh:1} % · {upp:tid}
//   {x}       som det är (tal får en decimal)
//   {x:0}     antal decimaler
//   {x:tid}   klockslag 15:30      {x:datum}  7 nov
//   {x:min}   "om 23 min"/"23 min sedan"
//   {x:pil}   pil för trend (↑ ↓ →)
//   {x:ja/nej}  text om sant / falskt, t.ex. {larm:LARM/}
function fyllText(mall, V) {
  return String(mall || '').replace(/\{([a-zA-Z0-9_.]+)(?::([^}]*))?\}/g, function (_, namn, fmt) {
    var v = hamtaVarde(V, namn)
    if (fmt !== undefined && fmt.indexOf('/') >= 0) { var p = fmt.split('/'); return v ? p[0] : (p[1] || '') }
    if (fmt === 'tid') return klocka(v)
    if (fmt === 'datum') return num(v) ? datum(v) : '–'
    if (fmt === 'min') { if (!num(v)) return '–'; var m = Math.round((v - Date.now()) / 60e3); return m >= 0 ? 'om ' + m + ' min' : (-m) + ' min sedan' }
    if (fmt === 'pil') return !num(v) || Math.abs(v) < 0.05 ? '→' : v > 0 ? '↑' : '↓'
    if (fmt !== undefined && /^\d$/.test(fmt)) return komma(v, +fmt)
    if (num(v)) return Number.isInteger(v) ? String(v) : komma(v, 1)
    if (v === undefined || v === null || v === '') return '–'
    if (typeof v === 'boolean') return v ? 'ja' : 'nej'
    return String(v)
  })
}

// Ett tal ur en mall/ett värdenamn (för mätare): "bp", "{ti}", "42"
function talFran(uttr, V) {
  if (num(uttr)) return uttr
  var s = String(uttr || '').trim()
  if (/^\{.*\}$/.test(s)) s = s.slice(1, -1).split(':')[0]
  var v = hamtaVarde(V, s)
  if (num(v)) return v
  var f = parseFloat(s.replace(',', '.'))
  return num(f) ? f : null
}

// Ska elementet visas? (villkor)
function syns(el, V) {
  switch (el.visa || '') {
    case 'larm': return !!V.larm
    case 'ejlarm': return !V.larm
    case 'tyst': return !!V.tyst
    case 'ejtyst': return !V.tyst
    case 'usb': return !!V.usb
    case 'ejusb': return !V.usb
    default: return true
  }
}

// Färg på ett element: vanlig, eller larmfärg när larmet är på
function elFarg(el, V) { return (V.larm && el.fargLarm) ? el.fargLarm : (el.farg || '#ffffff') }

// Geometri för bågar (delas mellan SVG och DrawContext)
// Mätarstilar: 'bage' = 270° öppen nedåt (Apples), 'ring' = hel ring, 'prick' = båge med prick
function matareGeo(stil) { return stil === 'ring' ? { a0: -90, span: 360 } : { a0: 135, span: 270 } }

// Pilens vinkel i grader medurs från norr, eller null om värdet saknas.
// Vind anges som varifrån den blåser; vand = true vänder pilen så att den pekar dit vinden blåser.
function pilVinkel(el, V) {
  var g = talFran(el.vinkel === undefined ? '{wd}' : el.vinkel, V)
  if (!num(g)) return null
  return ((g + (el.vand === false ? 0 : 180)) % 360 + 360) % 360
}
