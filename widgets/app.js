// =====================================================================
//  Widgets – gränssnittet
// =====================================================================
(function () {
'use strict'
var $ = function (id) { return document.getElementById(id) }
var esc = function (s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
var lsGet = function (k, std) { try { var v = localStorage.getItem(k); return v === null ? std : JSON.parse(v) } catch (e) { return std } }
var lsSet = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }
var uid = function () { return 'e' + Math.random().toString(36).slice(2, 9) }
var klon = function (o) { return JSON.parse(JSON.stringify(o)) }
function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('syns'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('syns') }, 2600) }

// ---------------------------------------------------------------------
//  Mallar
// ---------------------------------------------------------------------
function T(text, o) { return Object.assign({ id: uid(), typ: 'text', text: text, storlek: 14, vikt: 'semibold', typsnitt: 'rundad', farg: '#ffffff', rader: 1, minSkala: 1 }, o || {}) }
function I(namn, o) { return Object.assign({ id: uid(), typ: 'ikon', namn: namn, storlek: 14, farg: '#ffffff' }, o || {}) }
function S(riktning, barn, o) { return Object.assign({ id: uid(), typ: 'stack', riktning: riktning, mellan: 0, padding: [0, 0, 0, 0], justera: riktning === 'h' ? 'center' : 'start', barn: barn || [] }, o || {}) }
function P(o) { return Object.assign({ id: uid(), typ: 'pil', vinkel: '{wd}', vand: true, storlek: 14, farg: '#ffffff' }, o || {}) }
function L(langd) { return { id: uid(), typ: 'luft', langd: langd === undefined ? null : langd } }
function M(varde, o, barn) { return Object.assign({ id: uid(), typ: 'matare', varde: varde, min: 0, max: 100, storlek: 64, bredd: 5, stil: 'bage', farg: '#ffffff', spar: 0.25, barn: barn || [] }, o || {}) }
function G(serie, o) { return Object.assign({ id: uid(), typ: 'graf', serie: serie, timmar: 24, bredd: 130, hojd: 40, farg: '#f5a742', linje: 2, minSpann: 0.5 }, o || {}) }
function spec(namn, familj, barn, o) {
  return Object.assign({ namn: namn, familj: familj, bakgrund: /^accessory/.test(familj) ? { typ: 'ingen' } : { typ: 'farg', farg: '#1c2026', fargLarm: '#3a1f1f' }, padding: null, url: 'https://stekbring.github.io/jordkellare/', uppdatera: 15, kallor: { jk: true, smhi: false }, rot: { id: 'rot', typ: 'stack', riktning: 'v', barn: barn } }, o || {})
}
var MALLAR = [
  { namn: 'Tom liten widget', ny: function () { return spec('Ny widget', 'small', [T('Hej!', { storlek: 22 })], { kallor: { jk: false, smhi: false } }) } },
  { namn: 'Jordkällaren · siffror (liten)', ny: function () {
    return spec('Jordkällaren liten', 'small', [
      T('JORDKÄLLAREN', { storlek: 11, farg: '#a3acb6', visa: 'ejlarm' }), T('⚠ LARM', { storlek: 11, farg: '#ff8a7f', visa: 'larm' }), L(),
      T('{ti:1}°', { storlek: 44, farg: '#f5a742', fargLarm: '#ff8a7f', minSkala: 0.5 }), T('{rh:1} %', { storlek: 22, vikt: 'medium', farg: '#7cb8ff' }), L(),
      T('Ute {tu:1}° · {matt:tid}', { storlek: 12, vikt: 'regular', farg: '#a3acb6' }),
    ])
  } },
  { namn: 'Jordkällaren · översikt (mellan)', ny: function () {
    return spec('Jordkällaren mellan', 'medium', [S('h', [
      S('v', [T('JORDKÄLLAREN', { storlek: 11, farg: '#a3acb6' }), L(), T('{ti:1}°', { storlek: 44, farg: '#f5a742', fargLarm: '#ff8a7f' }), T('{rh:1} %', { storlek: 22, vikt: 'medium', farg: '#7cb8ff' })], { hojd: 130 }),
      L(16),
      S('v', [
        S('h', [T('Ute', { vikt: 'regular', farg: '#a3acb6' }), L(), T('{tu:1}°')], { bredd: 140 }),
        S('h', [T('Idag', { vikt: 'regular', farg: '#a3acb6' }), L(), T('{tiMin:1}–{tiMax:1}°')], { bredd: 140 }),
        S('h', [T('Batteri', { vikt: 'regular', farg: '#a3acb6' }), L(), T('{bp:0} %')], { bredd: 140 }),
        S('h', [T('Mätt', { vikt: 'regular', farg: '#a3acb6' }), L(), T('{matt:tid}')], { bredd: 140 }),
      ], { mellan: 9 }),
    ])])
  } },
  { namn: 'Jordkällaren · graf (liten)', ny: function () {
    return spec('Jordkällaren graf', 'small', [
      S('h', [T('{ti:1}°', { storlek: 30, farg: '#f5a742' }), L(), T('{trend:pil} {trend:1}', { storlek: 12, farg: '#7fd18b' })]),
      T('min {tiMin:1} · max {tiMax:1} · 24 h', { storlek: 11, vikt: 'regular', farg: '#a3acb6' }), L(),
      G('ti', { bredd: 126, hojd: 50 }),
    ])
  } },
  { namn: 'Låsskärm rund · batteri, wifi, tid', ny: function () {
    return spec('Sensorn rund', 'accessoryCircular', [M('{bp}', { storlek: 72, bredd: 4.5 }, [T('{bp:0}%', { storlek: 17 }), T('{rs:0}', { storlek: 9, vikt: 'medium' }), T('{upp:tid}', { storlek: 9, vikt: 'medium' })])], { bakgrund: { typ: 'las' } })
  } },
  { namn: 'Låsskärm rektangel · tre rader med ikoner', ny: function () {
    return spec('Sensorn rektangel', 'accessoryRectangular', [
      S('h', [I('house.fill', { storlek: 14 }), L(5), T('{ti:1}° · {rh:1} % · {tu:1}°', { storlek: 15 })]),
      S('h', [I('battery.75', { storlek: 14 }), L(5), T('{bp:0}%', { storlek: 15 }), L(8), I('wifi', { storlek: 13 }), L(3), T('{rs:0} dBm', { storlek: 15 })]),
      S('h', [I('icloud.and.arrow.up', { storlek: 14 }), L(5), T('{upp:tid}', { storlek: 15 }), L(4), I('arrow.right', { storlek: 12 }), L(4), T('{nasta:tid}', { storlek: 15 })]),
    ], { bakgrund: { typ: 'ingen' } })
  } },
  { namn: 'Låsskärm rektangel · väder', ny: function () {
    return spec('Väder', 'accessoryRectangular', [
      S('h', [I('sunrise.fill', { storlek: 14 }), L(5), T('{solUpp:tid}', { storlek: 15 }), L(10), I('sunset.fill', { storlek: 13 }), L(3), T('{solNed:tid}', { storlek: 15 })]),
      S('h', [I('thermometer.medium', { storlek: 14 }), L(5), T('{T:0}°', { storlek: 18 }), L(8), T('H:', { storlek: 13, alfa: 0.55 }), L(2), T('{H:0}°', { storlek: 15 }), L(6), T('L:', { storlek: 13, alfa: 0.55 }), L(2), T('{L:0}°', { storlek: 15 })]),
      S('h', [I('wind', { storlek: 14 }), L(5), T('{riktn}', { storlek: 15 }), L(4), P({ storlek: 12 }), L(4), T('{ws:0} m/s', { storlek: 15 })]),
    ], { bakgrund: { typ: 'ingen' }, kallor: { jk: false, smhi: true } })
  } },
  { namn: 'Jordkällaren + väder (mellan)', ny: function () {
    var rad = function (ikon, barn) { return S('h', [I(ikon, { storlek: 15, farg: '#a3acb6' }), L(6)].concat(barn)) }
    return spec('Jordkällaren och väder', 'medium', [S('h', [
      S('v', [T('JORDKÄLLAREN', { storlek: 11, farg: '#a3acb6' }), L(),
        rad('house.fill', [T('{ti:1}°', { storlek: 22, farg: '#f5a742', fargLarm: '#ff8a7f' })]),
        rad('drop.fill', [T('{rh:1} %', { storlek: 17, farg: '#7cb8ff' })]),
        rad('icloud.and.arrow.up', [T('{upp:tid}', { storlek: 13, vikt: 'medium', farg: '#a3acb6' })])], { mellan: 4 }),
      L(),
      S('v', [T('VÄDER', { storlek: 11, farg: '#a3acb6' }), L(),
        rad('thermometer.medium', [T('{T:0}°', { storlek: 22 }), L(6), T('H:{H:0}° L:{L:0}°', { storlek: 12, vikt: 'medium', farg: '#a3acb6' })]),
        rad('wind', [T('{riktn}', { storlek: 15 }), L(4), P({ storlek: 13 }), L(4), T('{ws:0} m/s', { storlek: 15 })]),
        rad('sunrise.fill', [T('{solUpp:tid} – {solNed:tid}', { storlek: 13, vikt: 'medium', farg: '#a3acb6' })])], { mellan: 4 }),
    ])], { kallor: { jk: true, smhi: true } })
  } },
  { namn: 'Låsskärm rad ovanför klockan', ny: function () { return spec('Raden', 'accessoryInline', [T('{ti:1}° · {rh:1} % · {tu:1}°')]) } },
  { namn: 'Egen data från en JSON-adress', ny: function () {
    return spec('Egen data', 'small', [T('EGEN DATA', { storlek: 11, farg: '#a3acb6' }), L(), T('{json.varde}', { storlek: 34 }), T('{json.text}', { storlek: 13, vikt: 'regular', farg: '#a3acb6', rader: 2 })],
      { kallor: { jk: false, smhi: false, json: { url: 'https://exempel.se/data.json', min: 15 } } })
  } },
]

// ---------------------------------------------------------------------
//  Läge och lagring
// ---------------------------------------------------------------------
var projekt = lsGet('wv-projekt', {})       // { id: { namn, spec, andrad } }
var aktivt = lsGet('wv-aktivt', null)
var S0 = null                               // aktuell spec
var valtId = 'rot'
var enhetId = lsGet('wv-enhet', 'i15')
var zoom = lsGet('wv-zoom', 2)
var dataLage = 'exempel'
var exempel = lsGet('wv-exempel', { ti: 6.6, rh: 93.9, tu: 0.7, bp: 78, rs: -63, usb: false, larm: false, tyst: false, minSedan: 12, T: 3, H: 5, L: -1, ws: 3, wd: 290, json: '{"varde": 42, "text": "Exempeltext"}' })
var riktig = null, riktigFel = null
var auth = lsGet('wv-auth', null), cfg = null

function enhet() { return ENHETER.find(function (e) { return e.id === enhetId }) || ENHETER[4] }
function sparaAktivt() {
  if (!aktivt) return
  projekt[aktivt] = { namn: S0.namn, spec: S0, andrad: Date.now(), synk: (projekt[aktivt] || {}).synk }
  lsSet('wv-projekt', projekt)
}
function nyttProjekt(sp) {
  aktivt = 'p' + Date.now().toString(36)
  S0 = sp; valtId = 'rot'
  lsSet('wv-aktivt', aktivt); sparaAktivt()
}
function oppna(id) {
  if (!projekt[id]) return
  aktivt = id; S0 = klon(projekt[id].spec); valtId = 'rot'
  lsSet('wv-aktivt', aktivt)
  ritaAllt()
}

// ---------------------------------------------------------------------
//  Data: exempel eller riktiga värden
// ---------------------------------------------------------------------
function exempelInn() {
  var nu = Date.now(), e = exempel
  var at = nu - (e.tyst ? 3 * 60 : e.minSedan) * 60e3
  var latest = { ti: e.ti, rh: e.rh, tu: e.tu, bp: e.bp, bv: 3.6 + 0.006 * e.bp, rs: e.rs, usb: !!e.usb, at: at, uppAt: at, nastaUpp: e.tyst ? at + 30 * 60e3 : at + 60 * 60e3, larm: e.larm ? 4 : 0 }
  var timmar = []
  for (var i = 7 * 24; i >= 1; i--) {
    var t = Math.floor((nu - i * TIMME) / TIMME) * TIMME, f = Math.sin(i / 5), g = Math.cos(i / 7)
    timmar.push({ at: t, ti: e.ti + f * 0.4, rh: e.rh + g * 1.5, tu: e.tu + Math.sin(i / 4) * 3, bv: 4.05, tiMin: e.ti + f * 0.4 - 0.1, tiMax: e.ti + f * 0.4 + 0.1 })
  }
  var ts = []
  for (var j = 0; j < 30; j++) ts.push({ t: Math.floor(nu / TIMME) * TIMME + j * TIMME, T: e.T + Math.sin(j / 4) * (e.H - e.L) / 2, ws: e.ws, wd: e.wd, pm: j > 5 && j < 9 ? 0.4 : 0 })
  // låt min/max idag bli H och L
  ts.push({ t: midnatt(nu) + 14 * TIMME, T: e.H, ws: e.ws, wd: e.wd }); ts.push({ t: midnatt(nu) + 23 * TIMME, T: e.L, ws: e.ws, wd: e.wd })
  var json = null; try { json = JSON.parse(e.json || 'null') } catch (x) {}
  return { nu: nu, latest: latest, larm: e.larm ? { aktiva: { rh: { start: nu - TIMME } } } : null, timmar: timmar, vader: { plats: { lat: 57.1686, lon: 15.3497 }, ts: ts }, json: json }
}
function varden() {
  var inn = dataLage === 'riktig' && riktig ? Object.assign({}, riktig, { nu: Date.now() }) : exempelInn()
  if (S0 && S0.zon) inn.zon = S0.zon
  return harledVarden(inn)
}

// ---- Firebase (samma konton som Jordkällarens webbsida) ----
async function hamtaCfg() {
  if (cfg) return cfg
  var s = await (await fetch('../jordkellare/firebase-config.js', { cache: 'no-cache' })).text()
  var f = function (re) { return (s.match(re) || [])[1] }
  cfg = { apiKey: f(/apiKey:\s*["']([^"']+)["']/), db: f(/databaseURL:\s*["']([^"']+)["']/), doman: f(/LOGIN_DOMAIN\s*=\s*["']([^"']+)["']/) }
  if (!cfg.apiKey) { cfg = null; throw new Error('Hittar inte ../jordkellare/firebase-config.js') }
  return cfg
}
async function loggaIn(anv, los) {
  var c = await hamtaCfg()
  var r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + c.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: anv + '@' + c.doman, password: los, returnSecureToken: true }) })
  var j = await r.json()
  if (!r.ok) throw new Error(/INVALID|NOT_FOUND/.test((j.error && j.error.message) || '') ? 'Fel användarnamn eller lösenord' : 'Inloggningen misslyckades')
  auth = { anv: anv, uid: j.localId, t: j.idToken, rt: j.refreshToken, till: Date.now() + (Number(j.expiresIn) - 120) * 1000 }
  lsSet('wv-auth', auth)
}
async function token() {
  if (!auth) throw new Error('Inte inloggad')
  if (auth.till > Date.now()) return auth.t
  var c = await hamtaCfg()
  var r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + c.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(auth.rt) })
  var j = await r.json()
  if (!r.ok) { auth = null; lsSet('wv-auth', null); visaLogin(); throw new Error('Inloggningen har gått ut') }
  auth.t = j.id_token; auth.rt = j.refresh_token; auth.till = Date.now() + (Number(j.expires_in) - 120) * 1000
  lsSet('wv-auth', auth)
  return auth.t
}
async function db(metod, vag, data, q) {
  var c = await hamtaCfg(), t = await token()
  var r = await fetch(c.db + '/jordkallare/' + vag + '.json?auth=' + t + (q || ''), { method: metod, body: data === undefined ? undefined : JSON.stringify(data) })
  if (!r.ok) throw new Error(r.status === 401 ? 'Saknar behörighet (' + (metod === 'GET' ? 'läsa' : 'skriva') + ' ' + vag + ')' : 'Fel ' + r.status)
  return r.json()
}
async function hamtaRiktig() {
  riktigFel = null
  try {
    var fran = '&orderBy=%22at%22&startAt=' + Math.floor(midnatt() - 7 * DYGN)
    var r = await Promise.all([db('GET', 'latest'), db('GET', 'larmstatus'), db('GET', 'timmar', undefined, fran), db('GET', 'plats').catch(function () { return null })])
    var plats = r[3] && num(r[3].lat) ? { lat: r[3].lat, lon: r[3].lon } : { lat: 57.1686, lon: 15.3497 }
    var vader = { plats: plats, ts: [] }
    try { var sm = await (await fetch('https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/' + plats.lon.toFixed(4) + '/lat/' + plats.lat.toFixed(4) + '/data.json')).json(); vader.ts = smhiSerie(sm) } catch (e) {}
    var json = null
    var ju = S0 && S0.kallor && S0.kallor.json && S0.kallor.json.url
    if (ju) { try { json = await (await fetch(ju)).json() } catch (e) { riktigFel = 'Kunde inte läsa JSON-adressen från webbläsaren (telefonen kan ändå klara det).' } }
    riktig = { latest: r[0], larm: r[1], timmar: lista(r[2]).filter(function (h) { return num(h.at) }), vader: vader, json: json }
  } catch (e) { riktig = null; riktigFel = e.message }
}

// ---------------------------------------------------------------------
//  Trädet
// ---------------------------------------------------------------------
function hitta(id, nod, foralder) {
  nod = nod || S0.rot
  if (nod.id === id) return { el: nod, foralder: foralder || null }
  var barn = nod.barn || []
  for (var i = 0; i < barn.length; i++) { var x = hitta(id, barn[i], nod); if (x) return x }
  return null
}
var TYPNAMN = { stack: 'Stack', text: 'Text', ikon: 'Ikon', pil: 'Vindpil', luft: 'Luft', matare: 'Mätare', graf: 'Graf', bild: 'Bild' }
function sammanfatta(el) {
  if (el.typ === 'stack') return (el.riktning === 'h' ? 'Rad ↔' : 'Kolumn ↕') + ' · ' + (el.barn || []).length + ' delar'
  if (el.typ === 'text') return el.text
  if (el.typ === 'ikon') return el.namn
  if (el.typ === 'pil') return (el.vinkel === undefined ? '{wd}' : el.vinkel) + (el.vand === false ? '' : ' (dit det blåser)')
  if (el.typ === 'luft') return num(el.langd) ? el.langd + ' pt' : 'växer'
  if (el.typ === 'matare') return el.varde + ' (' + el.stil + ')'
  if (el.typ === 'graf') return el.serie + ' · ' + el.timmar + ' h'
  if (el.typ === 'bild') return el.url || 'ingen adress'
  return ''
}
function ritaTrad() {
  var h = '<div class="nod' + (valtId === 'rot' ? ' vald' : '') + '" data-id="rot" role="treeitem"><span class="typ">Widget</span><span class="namn">' + esc(S0.namn || '') + '</span></div>'
  var nivå = function (barn, djup) {
    (barn || []).forEach(function (el) {
      h += '<div class="nod' + (valtId === el.id ? ' vald' : '') + '" draggable="true" data-id="' + el.id + '" role="treeitem" style="padding-left:' + (6 + djup * 14) + 'px">' +
        '<span class="typ">' + TYPNAMN[el.typ] + '</span><span class="namn' + (el.visa ? ' dold' : '') + '">' + esc(sammanfatta(el)) + (el.visa ? ' · villkor' : '') + '</span>' +
        '<span class="verktyg"><button data-gor="upp" title="Flytta upp">↑</button><button data-gor="ner" title="Flytta ner">↓</button><button data-gor="in" title="Flytta in i stacken ovanför">→</button><button data-gor="ut" title="Flytta ut ur stacken">←</button><button data-gor="dup" title="Duplicera">⧉</button><button data-gor="bort" title="Ta bort">✕</button></span></div>'
      if (el.barn) nivå(el.barn, djup + 1)
    })
  }
  nivå(S0.rot.barn, 1)
  $('trad').innerHTML = h
}
function gor(handling, id) {
  var x = hitta(id); if (!x || !x.foralder) return
  var lst = x.foralder.barn, i = lst.indexOf(x.el)
  if (handling === 'upp' && i > 0) { lst.splice(i, 1); lst.splice(i - 1, 0, x.el) }
  else if (handling === 'ner' && i < lst.length - 1) { lst.splice(i, 1); lst.splice(i + 1, 0, x.el) }
  else if (handling === 'dup') { var k = klon(x.el); var nyId = function (e) { e.id = uid(); (e.barn || []).forEach(nyId) }; nyId(k); lst.splice(i + 1, 0, k); valtId = k.id }
  else if (handling === 'bort') { lst.splice(i, 1); valtId = x.foralder.id }
  else if (handling === 'in') { var prev = lst[i - 1]; if (prev && prev.barn) { lst.splice(i, 1); prev.barn.push(x.el) } else toast('Det måste finnas en stack eller mätare ovanför') }
  else if (handling === 'ut') { var y = hitta(x.foralder.id); if (y && y.foralder) { lst.splice(i, 1); var pl = y.foralder.barn; pl.splice(pl.indexOf(x.foralder) + 1, 0, x.el) } }
  andrat()
}
function laggTill(typ) {
  var nytt = typ === 'stackH' ? S('h', []) : typ === 'stackV' ? S('v', []) : typ === 'text' ? T('Text') : typ === 'ikon' ? I('star.fill') : typ === 'pil' ? P() : typ === 'luft' ? L() : typ === 'matare' ? M('{bp}', {}, [T('{bp:0}', { storlek: 16 })]) : typ === 'graf' ? G('ti') : { id: uid(), typ: 'bild', url: '', bredd: 40, hojd: 40, radie: 8 }
  var x = hitta(valtId) || { el: S0.rot }
  if (x.el.barn) x.el.barn.push(nytt)
  else { var lst = x.foralder.barn; lst.splice(lst.indexOf(x.el) + 1, 0, nytt) }
  valtId = nytt.id
  andrat()
}

// ---------------------------------------------------------------------
//  Egenskaper
// ---------------------------------------------------------------------
var VILLKOR = [['', 'Alltid'], ['larm', 'Bara vid larm'], ['ejlarm', 'Bara utan larm'], ['tyst', 'Bara när sensorn är tyst'], ['ejtyst', 'Bara när sensorn hörs'], ['usb', 'Bara när den laddar'], ['ejusb', 'Bara när den inte laddar']]
function falt(nyckel, etikett, typ, opt) { return { k: nyckel, e: etikett, t: typ, o: opt || {} } }
var FALT = {
  text: [falt('text', 'Text (med {värden})', 'mall', { hel: 1 }), falt('storlek', 'Storlek (pt)', 'tal', { min: 4, max: 120, steg: 0.5 }), falt('vikt', 'Vikt', 'val', { val: [['light', 'Tunn'], ['regular', 'Normal'], ['medium', 'Medium'], ['semibold', 'Halvfet'], ['bold', 'Fet'], ['heavy', 'Extra fet']] }),
    falt('typsnitt', 'Typsnitt', 'val', { val: [['rundad', 'Rundad (som Apples widgets)'], ['standard', 'Standard (SF Pro)'], ['mono', 'Jämnbred'], ['serif', 'Serif (New York)']] }), falt('justeraText', 'Justering', 'val', { val: [['', 'Vänster'], ['center', 'Mitten'], ['right', 'Höger']] }),
    falt('farg', 'Färg', 'farg'), falt('fargLarm', 'Färg vid larm', 'fargval'), falt('rader', 'Max rader', 'tal', { min: 1, max: 10 }), falt('minSkala', 'Får krympa till', 'tal', { min: 0.3, max: 1, steg: 0.05, info: '1 = krymper aldrig' }), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  ikon: [falt('namn', 'SF Symbol-namn', 'ikon', { hel: 1 }), falt('storlek', 'Storlek (pt)', 'tal', { min: 4, max: 120, steg: 0.5 }), falt('farg', 'Färg', 'farg'), falt('fargLarm', 'Färg vid larm', 'fargval'), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  stack: [falt('riktning', 'Riktning', 'val', { val: [['h', 'Rad (sida vid sida)'], ['v', 'Kolumn (under varandra)']] }), falt('justera', 'Justera innehållet', 'val', { val: [['start', 'Början (vänster/upp)'], ['center', 'Mitten'], ['end', 'Slutet']] }),
    falt('mellan', 'Mellanrum (pt)', 'tal', { min: 0, max: 40, steg: 0.5 }), falt('padding', 'Inre luft (upp, vänster, ned, höger)', 'padding', { hel: 1 }),
    falt('bredd', 'Fast bredd (pt, tom = automatisk)', 'tal', { min: 0, max: 400, tom: 1 }), falt('hojd', 'Fast höjd', 'tal', { min: 0, max: 400, tom: 1 }),
    falt('bg', 'Bakgrund', 'fargval'), falt('radie', 'Rundade hörn', 'tal', { min: 0, max: 60 }), falt('kant', 'Kantlinje (pt)', 'tal', { min: 0, max: 6, steg: 0.5 }), falt('kantFarg', 'Kantfärg', 'farg'), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  pil: [falt('vinkel', 'Riktning i grader ({wd} = vinden från SMHI)', 'mall', { hel: 1 }), falt('vand', 'Peka dit vinden blåser (av = varifrån den kommer)', 'bool', { hel: 1 }),
    falt('storlek', 'Storlek (pt)', 'tal', { min: 4, max: 120, steg: 0.5 }), falt('farg', 'Färg', 'farg'), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  luft: [falt('langd', 'Längd i pt (tom = växer och fyller ut)', 'tal', { min: 0, max: 200, steg: 0.5, tom: 1, hel: 1 }), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  matare: [falt('varde', 'Värde (t.ex. {bp} eller {ti})', 'mall', { hel: 1 }), falt('min', 'Min', 'tal', {}), falt('max', 'Max', 'tal', {}), falt('stil', 'Stil', 'val', { val: [['bage', 'Båge (som Apple)'], ['ring', 'Hel ring'], ['prick', 'Båge med prick']] }),
    falt('storlek', 'Storlek (pt)', 'tal', { min: 20, max: 200 }), falt('bredd', 'Linjebredd', 'tal', { min: 1, max: 20, steg: 0.5 }), falt('inset', 'Avstånd till kanten', 'tal', { min: 0, max: 20, steg: 0.5 }),
    falt('farg', 'Färg', 'farg'), falt('fargLarm', 'Färg vid larm', 'fargval'), falt('spar', 'Spårets synlighet (0–1)', 'tal', { min: 0, max: 1, steg: 0.05 }), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  graf: [falt('serie', 'Vad', 'val', { val: [['ti', 'Källarens temperatur'], ['rh', 'Fukt'], ['tu', 'Ute (sensorn)'], ['bp', 'Batteri']] }), falt('timmar', 'Timmar bakåt', 'tal', { min: 2, max: 168 }),
    falt('bredd', 'Bredd (pt)', 'tal', { min: 20, max: 400 }), falt('hojd', 'Höjd (pt)', 'tal', { min: 10, max: 300 }), falt('farg', 'Linjefärg', 'farg'), falt('linje', 'Linjebredd', 'tal', { min: 0.5, max: 6, steg: 0.5 }),
    falt('minSpann', 'Minsta skala', 'tal', { min: 0.1, max: 20, steg: 0.1 }), falt('bakgrund', 'Bakgrund', 'fargval'), falt('prick', 'Prick på senaste värdet', 'bool'), falt('visa', 'Visas', 'val', { val: VILLKOR })],
  bild: [falt('url', 'Bildadress (https://…)', 'mall', { hel: 1 }), falt('bredd', 'Bredd', 'tal', { min: 4, max: 400 }), falt('hojd', 'Höjd', 'tal', { min: 4, max: 400 }), falt('radie', 'Rundade hörn', 'tal', { min: 0, max: 100 }), falt('visa', 'Visas', 'val', { val: VILLKOR })],
}

function faltHtml(f, el) {
  var v = el[f.k], id = 'f-' + f.k, o = f.o
  var lab = '<label class="' + (o.hel ? 'hel' : '') + '"><span>' + esc(f.e) + '</span>'
  if (f.t === 'mall') return lab + '<input type="text" id="' + id + '" data-k="' + f.k + '" value="' + esc(v) + '"></label>'
  if (f.t === 'tal') return lab + '<input type="number" id="' + id + '" data-k="' + f.k + '" data-typ="tal"' + (o.tom ? ' data-tom="1"' : '') + ' value="' + (num(v) ? v : '') + '"' + (num(o.min) ? ' min="' + o.min + '"' : '') + (num(o.max) ? ' max="' + o.max + '"' : '') + ' step="' + (o.steg || 1) + '">' + (o.info ? '<small class="help">' + esc(o.info) + '</small>' : '') + '</label>'
  if (f.t === 'val') return lab + '<select id="' + id + '" data-k="' + f.k + '">' + o.val.map(function (x) { return '<option value="' + x[0] + '"' + ((v || '') === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>' }).join('') + '</select></label>'
  if (f.t === 'bool') return '<label class="kryss ' + (o.hel ? 'hel' : '') + '"><input type="checkbox" data-k="' + f.k + '" data-typ="bool"' + (v !== false ? ' checked' : '') + '> ' + esc(f.e) + '</label>'
  if (f.t === 'farg') {
    var ak = f.k === 'farg' ? 'alfa' : f.k + 'Alfa'
    return lab + '<span class="fargfalt"><input type="color" data-k="' + f.k + '" value="' + (v || '#ffffff') + '"><input type="range" min="0" max="1" step="0.05" data-k="' + ak + '" data-typ="tal" value="' + (num(el[ak]) ? el[ak] : 1) + '" title="Synlighet"></span></label>'
  }
  if (f.t === 'fargval') {
    var ak2 = f.k === 'bg' ? 'bgAlfa' : f.k === 'bakgrund' ? 'bakgrundAlfa' : f.k + 'Alfa'
    return lab + '<span class="fargfalt"><input type="checkbox" data-pa="' + f.k + '"' + (v ? ' checked' : '') + ' title="Använd"><input type="color" data-k="' + f.k + '" value="' + (v || '#3a1f1f') + '"' + (v ? '' : ' disabled') + '><input type="range" min="0" max="1" step="0.05" data-k="' + ak2 + '" data-typ="tal" value="' + (num(el[ak2]) ? el[ak2] : 1) + '"' + (v ? '' : ' disabled') + ' title="Synlighet"></span></label>'
  }
  if (f.t === 'padding') { var p = v || [0, 0, 0, 0]; return lab + '<span class="fargfalt">' + [0, 1, 2, 3].map(function (i) { return '<input type="number" data-pad="' + i + '" value="' + p[i] + '" min="0" max="60" step="0.5" style="width:25%">' }).join('') + '</span></label>' }
  if (f.t === 'ikon') return lab + '<input type="text" id="' + id + '" data-k="' + f.k + '" value="' + esc(v) + '" list="sfLista"><div class="ikonval">' + SF_NAMN.map(function (n) { return '<button type="button" data-ikon="' + n + '" title="' + n + '">' + sfSvg(n, 18) + '</button>' }).join('') + '</div><small class="help">Alla namn finns i Apples gratisapp SF Symbols. Namn som inte finns i listan visas som ? här men rätt på telefonen.</small></label>'
  return ''
}

function ritaEgenskaper() {
  var box = $('egenskaper'), el = valtId === 'rot' ? null : (hitta(valtId) || {}).el
  if (!el) { valtId = 'rot'; return ritaWidgetEgenskaper() }
  $('egTitel').textContent = TYPNAMN[el.typ]
  var h = '<div class="eg-grid">' + FALT[el.typ].map(function (f) { return faltHtml(f, el) }).join('') + '</div>'
  if (el.typ === 'text' && num(el.minSkala) && el.minSkala < 1) h += '<div class="varning">På iPhone kan en text som får krympa bli mindre än nödvändigt när den står i en rad med växande luft. Sätt 1 om texten blir oväntat liten.</div>'
  if (el.typ === 'matare') h += '<p class="help">Det som ligger i mätaren i trädet ritas i mitten, en rad per del.</p>'
  box.innerHTML = h
  bindFalt(box, el)
}
function ritaWidgetEgenskaper() {
  $('egTitel').textContent = 'Widgeten'
  var s = S0, bg = s.bakgrund || { typ: 'ingen' }, k = s.kallor || {}
  var las = /^accessory/.test(s.familj)
  var h = '<div class="eg-grid">'
  h += '<label class="hel"><span>Bakgrund</span><select data-w="bgtyp">' + (las ? [['ingen', 'Ingen (genomskinlig)'], ['las', 'iOS frostade bakgrund']] : [['ingen', 'Ingen (iOS standard)'], ['farg', 'Färg'], ['gradient', 'Övergång mellan två färger']]).map(function (x) { return '<option value="' + x[0] + '"' + (bg.typ === x[0] ? ' selected' : '') + '>' + x[1] + '</option>' }).join('') + '</select></label>'
  if (bg.typ === 'farg' || bg.typ === 'gradient') {
    h += '<label><span>Färg</span><input type="color" data-w="bgfarg" value="' + (bg.farg || '#1c2026') + '"></label>'
    h += bg.typ === 'gradient' ? '<label><span>Färg 2</span><input type="color" data-w="bgfarg2" value="' + (bg.farg2 || '#000000') + '"></label><label><span>Vinkel</span><input type="number" data-w="bgvinkel" value="' + (bg.vinkel || 180) + '" min="0" max="360" step="15"></label>'
      : '<label><span>Färg vid larm</span><input type="color" data-w="bglarm" value="' + (bg.fargLarm || '#3a1f1f') + '"></label>'
  }
  var p = s.padding || standardPadding(s.familj)
  h += '<label class="hel"><span>Inre luft (upp, vänster, ned, höger)' + (s.padding ? '' : ' · iOS standard') + '</span><span class="fargfalt">' + [0, 1, 2, 3].map(function (i) { return '<input type="number" data-wpad="' + i + '" value="' + p[i] + '" min="0" max="40" step="0.5" style="width:25%">' }).join('') + '</span></label>'
  h += '<label><span>Mellanrum mellan delar</span><input type="number" data-w="mellan" value="' + (s.rot.mellan || 0) + '" min="0" max="40" step="0.5"></label>'
  h += '<label><span>Uppdatera (minuter)</span><input type="number" data-w="uppdatera" value="' + (s.uppdatera || 15) + '" min="5" max="240"></label>'
  h += '<label class="hel"><span>Öppna vid tryck (adress)</span><input type="text" data-w="url" value="' + esc(s.url || '') + '" placeholder="https://… eller shortcuts://…"></label>'
  h += '<label class="kryss hel"><input type="checkbox" data-w="jk"' + (k.jk ? ' checked' : '') + '> Jordkällarens värden (kräver inloggning i Scriptable)</label>'
  h += '<label class="kryss hel"><input type="checkbox" data-w="smhi"' + (k.smhi ? ' checked' : '') + '> Väder från SMHI och solens tider</label>'
  h += '<label class="hel"><span>Egen JSON-adress (värden blir {json.namn})</span><input type="text" data-w="json" value="' + esc((k.json && k.json.url) || '') + '" placeholder="https://…/data.json"></label>'
  h += '</div>'
  $('egenskaper').innerHTML = h
  $('egenskaper').querySelectorAll('[data-w],[data-wpad]').forEach(function (inp) {
    inp.addEventListener(inp.type === 'text' ? 'change' : 'input', function () {
      var w = inp.dataset.w, v = inp.type === 'checkbox' ? inp.checked : inp.value
      S0.bakgrund = S0.bakgrund || { typ: 'ingen' }; S0.kallor = S0.kallor || {}
      if (inp.dataset.wpad !== undefined) { S0.padding = (S0.padding || standardPadding(S0.familj)).slice(); S0.padding[+inp.dataset.wpad] = parseFloat(v) || 0 }
      else if (w === 'bgtyp') { S0.bakgrund.typ = v; andrat(); return }
      else if (w === 'bgfarg') S0.bakgrund.farg = v
      else if (w === 'bgfarg2') S0.bakgrund.farg2 = v
      else if (w === 'bgvinkel') S0.bakgrund.vinkel = parseFloat(v) || 0
      else if (w === 'bglarm') S0.bakgrund.fargLarm = v
      else if (w === 'mellan') S0.rot.mellan = parseFloat(v) || 0
      else if (w === 'uppdatera') S0.uppdatera = Math.max(5, parseInt(v, 10) || 15)
      else if (w === 'url') S0.url = v
      else if (w === 'jk' || w === 'smhi') S0.kallor[w] = v
      else if (w === 'json') S0.kallor.json = v ? { url: v.trim(), min: 15 } : null
      andrat(true)
    })
  })
}
function bindFalt(box, el) {
  box.querySelectorAll('[data-k]').forEach(function (inp) {
    var h = function () {
      var k = inp.dataset.k, v
      if (inp.dataset.typ === 'bool') v = inp.checked
      else if (inp.dataset.typ === 'tal' || inp.type === 'number') { v = inp.value === '' ? (inp.dataset.tom ? null : 0) : parseFloat(inp.value) }
      else v = inp.value
      el[k] = v
      andrat(true)
    }
    inp.addEventListener(inp.type === 'text' ? 'input' : 'input', h)
  })
  box.querySelectorAll('[data-pa]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var k = cb.dataset.pa, rad = cb.parentNode
      rad.querySelectorAll('input:not([type=checkbox])').forEach(function (x) { x.disabled = !cb.checked })
      el[k] = cb.checked ? rad.querySelector('input[type=color]').value : null
      andrat(true)
    })
  })
  box.querySelectorAll('[data-pad]').forEach(function (inp) {
    inp.addEventListener('input', function () { el.padding = (el.padding || [0, 0, 0, 0]).slice(); el.padding[+inp.dataset.pad] = parseFloat(inp.value) || 0; andrat(true) })
  })
  box.querySelectorAll('[data-ikon]').forEach(function (b) {
    b.addEventListener('click', function () { el.namn = b.dataset.ikon; box.querySelector('#f-namn').value = el.namn; andrat(true) })
  })
}

// ---------------------------------------------------------------------
//  Värdelistan
// ---------------------------------------------------------------------
var VARDEN = [
  ['ti:1', 'Källarens temperatur'], ['rh:1', 'Fukt'], ['tu:1', 'Ute (sensorn)'], ['bp:0', 'Batteri %'], ['bv:2', 'Batteri volt'], ['rs:0', 'Wifi dBm'],
  ['upp:tid', 'Senaste uppladdning'], ['nasta:tid', 'Nästa uppladdning'], ['matt:tid', 'Senaste mätning'], ['minSedan', 'Minuter sedan uppladdning'], ['minTill', 'Minuter till nästa'],
  ['tiMin:1', 'Källaren lägst idag'], ['tiMax:1', 'Källaren högst idag'], ['rhMin:1', 'Fukt lägst idag'], ['rhMax:1', 'Fukt högst idag'], ['tuMin:1', 'Ute lägst idag'], ['tuMax:1', 'Ute högst idag'],
  ['trend:pil', 'Pil för trend senaste timmen'], ['trend:1', 'Ändring senaste timmen'], ['betyg', 'Potatisbetyg'],
  ['larm:LARM/', 'Text bara vid larm'], ['larmText', 'Vad som larmar'], ['tyst:tyst/', 'Text bara när sensorn är tyst'], ['usb:⚡/', 'Blixt när den laddar'],
  ['T:0', 'Ute enligt SMHI'], ['H:0', 'Högst idag (SMHI)'], ['L:0', 'Lägst idag (SMHI)'], ['ws:0', 'Vind m/s'], ['riktn', 'Vindriktning (VNV)'], ['wd:0', 'Vindriktning grader'],
  ['solUpp:tid', 'Soluppgång'], ['solNed:tid', 'Solnedgång'], ['regnOm', 'Minuter till regn'],
  ['nu:tid', 'Klockan nu'], ['nu:datum', 'Datum'], ['veckodag', 'Veckodag'], ['vecka', 'Veckonummer'],
]
var visaAllaVarden = false
function ritaVarden(V) {
  var lst = visaAllaVarden ? VARDEN : VARDEN.slice(0, 12)
  if (V.json && typeof V.json === 'object') Object.keys(V.json).slice(0, 12).forEach(function (k) { lst = lst.concat([['json.' + k, 'Egen data']]) })
  $('vardeLista').innerHTML = lst.map(function (x) { return '<button type="button" data-v="{' + x[0] + '}" title="' + esc(x[1]) + '"><code>{' + esc(x[0]) + '}</code><span>' + esc(fyllText('{' + x[0] + '}', V)) + ' · ' + esc(x[1]) + '</span></button>' }).join('')
}

// ---------------------------------------------------------------------
//  Telefonen
// ---------------------------------------------------------------------
function ritaTelefon() {
  var e = enhet(), V = varden(), fam = S0.familj, las = /^accessory/.test(fam)
  var tel = $('telefon')
  tel.innerHTML = ''
  var sk = document.createElement('div')
  sk.className = 'skarm'
  sk.style.cssText = 'width:' + e.w + 'px;height:' + e.h + 'px'
  sk.innerHTML = '<div class="tapet" style="background:' + (las ? 'linear-gradient(165deg,#6b5141,#33281f 55%,#191310)' : 'linear-gradient(165deg,#3c5d78,#1f2d3d 55%,#10161e)') + '"></div>' + (e.di ? '<div class="di"></div>' : '')
  var m = widgetMatt(e, fam)
  var nu = new Date()
  if (las) {
    var kl = document.createElement('div'); kl.className = 'klocka'; kl.style.top = (e.h * 0.085) + 'px'
    var dagtext = VECKODAGAR[nu.getDay()] + ' ' + nu.getDate() + ' ' + MANADER[nu.getMonth()]
    kl.innerHTML = '<div class="dag">' + dagtext + (fam === 'accessoryInline' ? '&nbsp;&nbsp;<span id="inlineText"></span>' : '') + '</div><div class="tid">' + pad2(nu.getHours()) + ':' + pad2(nu.getMinutes()) + '</div>'
    sk.appendChild(kl)
    if (fam === 'accessoryInline') {
      var forsta = hittaForsta(S0.rot, 'text')
      kl.querySelector('#inlineText').textContent = (V.larm ? '⚠ ' : '') + (forsta ? fyllText(forsta.text, V) : '')
    } else {
      var y = e.h * 0.085 + 118, rutor = fam === 'accessoryCircular' ? 4 : 2
      var gap = 12, total = fam === 'accessoryCircular' ? 4 * m.w + 3 * gap : 2 * m.w + gap, x0 = (e.w - total) / 2
      for (var i = 0; i < rutor; i++) {
        var pr = document.createElement('div'); pr.className = 'platsruta' + (i ? ' mark' : '')
        pr.style.cssText = 'left:' + (x0 + i * (m.w + gap)) + 'px;top:' + y + 'px;width:' + m.w + 'px;height:' + m.h + 'px;border-radius:' + m.radie + 'px'
        if (i === 0) pr.appendChild(domWidget(S0, V, { enhet: e, valt: valtId }))
        sk.appendChild(pr)
      }
    }
  } else {
    var top = e.di ? 70 : 56, sx = (e.w - e.mellan) / 2
    var pw = document.createElement('div'); pw.className = 'platsruta'
    pw.style.cssText = 'left:' + sx + 'px;top:' + top + 'px;width:' + m.w + 'px;height:' + m.h + 'px'
    pw.appendChild(domWidget(S0, V, { enhet: e, valt: valtId }))
    sk.appendChild(pw)
    // appikoner runt omkring, så att storleken syns
    var ar = document.createElement('div'); ar.className = 'apprad'
    var ay = top + m.h + 28, kol = 4, ap = 62, ag = (e.mellan - kol * ap) / (kol - 1)
    ar.style.cssText = 'left:' + sx + 'px;top:' + ay + 'px;grid-template-columns:repeat(4,' + ap + 'px);column-gap:' + ag + 'px;row-gap:30px'
    ar.innerHTML = '<div class="app"></div>'.repeat(fam === 'small' ? 8 : 8)
    if (fam === 'small') { ar.style.left = (sx + m.w + ag) + 'px'; ar.style.top = top + 'px'; ar.style.gridTemplateColumns = 'repeat(2,' + ap + 'px)'; ar.innerHTML = '<div class="app"></div>'.repeat(4) }
    sk.appendChild(ar)
  }
  tel.appendChild(sk)
  var skala = zoom === 1 ? 0.6 : zoom === 2 ? 1 : 1.6
  tel.style.transform = 'scale(' + skala + ')'
  tel.style.width = e.w + 'px'; tel.style.height = e.h + 'px'
  tel.style.marginBottom = (e.h * (skala - 1)) + 'px'
  tel.parentNode.style.minHeight = (e.h * skala + 40) + 'px'
  anpassaText(tel)
  $('mattInfo').textContent = e.namn + ' · skärm ' + e.w + ' × ' + e.h + ' pt · widgeten ' + m.w + ' × ' + m.h + ' pt' + (dataLage === 'riktig' ? (riktig ? ' · riktiga värden' : riktigFel ? ' · ' + riktigFel : ' · hämtar …') : ' · exempeldata')
  ritaVarden(V)
}
function hittaForsta(nod, typ) { if (nod.typ === typ) return nod; for (var i = 0; i < (nod.barn || []).length; i++) { var x = hittaForsta(nod.barn[i], typ); if (x) return x } return null }

// ---------------------------------------------------------------------
//  Export
// ---------------------------------------------------------------------
var kodDelar = null
async function hamtaKodDelar() {
  if (kodDelar) return kodDelar
  var r = await Promise.all([fetch('delad.js').then(function (x) { return x.text() }), fetch('motor-scriptable.js').then(function (x) { return x.text() })])
  kodDelar = { delad: r[0], motor: r[1] }
  return kodDelar
}
function synkNamn() { return String(S0.namn || 'widget').toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'widget' }
async function byggKod() {
  var d = await hamtaKodDelar(), synk = $('synkPa').checked
  var rensad = klon(S0)
  return '// Variables used by Scriptable.\n// These must be at the very top of the file. Do not edit.\n// icon-color: orange; icon-glyph: magic;\n' +
    '// ' + (S0.namn || 'Widget') + ' – skapad i Widgets (stekbring.github.io/widgets) ' + new Date().toLocaleString('sv-SE') + '\n' +
    '// Ändra utseendet i verktyget och klistra in på nytt' + (synk ? ', eller tryck Publicera där (synk är på).' : '.') + '\n\n' +
    'var SYNK = ' + JSON.stringify(synk ? synkNamn() : '') + '\n' +
    'var SPEC = ' + JSON.stringify(rensad, null, 1) + '\n\n' + d.delad + '\n' + d.motor
}

// ---------------------------------------------------------------------
//  Rita allt / ändringar
// ---------------------------------------------------------------------
var sparTimer = null
function andrat(behallEgenskaper) {
  ritaTrad(); ritaTelefon()
  if (!behallEgenskaper) ritaEgenskaper()
  clearTimeout(sparTimer); sparTimer = setTimeout(sparaAktivt, 400)
}
function ritaAllt() {
  $('specNamn').value = S0.namn || ''
  $('specFamilj').value = S0.familj
  $('synkPa').checked = !!(projekt[aktivt] && projekt[aktivt].synk)
  $('btnPublicera').disabled = !$('synkPa').checked
  ritaTrad(); ritaEgenskaper(); ritaTelefon()
}

// ---------------------------------------------------------------------
//  Jordkällaren-läget
// ---------------------------------------------------------------------
var jkInst = lsGet('wv-jk', null) || { FIN: klon(FIN_STD), STORLEK_RAD: null, STORLEK_RAD_S: null, kompakt: false, rundad: false, byt: false, enhet: 'i15' }
jkInst.FIN = Object.assign(klon(FIN_STD), jkInst.FIN || {})
jkInst.RADER = jkInst.RADER || {}
var jkVald = null      // null = alla rader, annars sol/termo/vind/hus/bat/moln
function jkSpara() { lsSet('wv-jk', jkInst) }
function jkRita() {
  var e = ENHETER.find(function (x) { return x.id === jkInst.enhet }) || ENHETER[4]
  var V = varden(), rad = $('jkRad')
  rad.innerHTML = ''
  var vad = jkInst.byt ? ['kallare', 'vader'] : ['vader', 'kallare']
  var a = jkHalva(V, jkInst, e, vad[0], 'v', jkVald), b = jkHalva(V, jkInst, e, vad[1], 'h', jkVald)
  rad.appendChild(a); rad.appendChild(b)
  jkAnpassa(a); jkAnpassa(b)
  rad.style.transform = 'scale(2)'
  $('jkScen').style.minHeight = (72 * 2 + 60) + 'px'
  var par = jkInst.byt ? '9' + (jkInst.rundad ? 'RV' : '') + (jkInst.kompakt ? 'S' : '') + ' + 8' + (jkInst.rundad ? 'RH' : '') + (jkInst.kompakt ? 'S' : '') : '8' + (jkInst.rundad ? 'R' : '') + (jkInst.kompakt ? 'S' : '') + ' + 9' + (jkInst.rundad ? 'R' : '') + (jkInst.kompakt ? 'S' : '')
  $('jkInfo').innerHTML = 'Parametrar på telefonen: <b>' + par + '</b> · textstorlek <b>' + a.dataset.fs + ' pt</b>' + (num(jkInst.kompakt ? jkInst.STORLEK_RAD_S : jkInst.STORLEK_RAD) ? ' (egen)' : ' (automatisk)') + ' · ' + e.namn + ' · <b>Klicka på en rad</b> för att ändra bara den.'
}
function jkVal(id) { jkVald = id; jkReglage(); jkRita() }
function reglageRad(attr, k, i, v, andrad) {
  var ar = attr + '="' + k + '"'
  return '<label class="' + (andrad ? 'andrad' : '') + '"><span>' + i[0] + '<small>' + i[1] + '</small></span><input type="range" ' + ar + ' min="' + i[2] + '" max="' + i[3] + '" step="' + i[4] + '" value="' + v + '"><span class="jkvarde"><input type="number" ' + ar + ' min="' + i[2] + '" max="' + i[3] + '" step="' + i[4] + '" value="' + (Math.round(v * 1000) / 1000) + '">' +
    (andrad ? '<button type="button" class="liten jknoll" data-noll="' + k + '" title="Tillbaka till det som gäller alla rader">↺</button>' : '') + '</span></label>'
}
function jkReglage() {
  var flikar = '<div class="jkradval"><button type="button" data-radval=""' + (jkVald ? '' : ' aria-pressed="true"') + '>Alla rader</button>' +
    ['sol', 'termo', 'vind', 'hus', 'bat', 'moln'].map(function (id) {
      var andrad = jkInst.RADER[id] && Object.keys(jkInst.RADER[id]).length
      return '<button type="button" data-radval="' + id + '"' + (jkVald === id ? ' aria-pressed="true"' : '') + '>' + RM_NAMN[id] + (andrad ? ' •' : '') + '</button>'
    }).join('') + '</div>'
  var h
  if (!jkVald) {
    h = '<p class="help">Gäller alla rader som inte har ändrats för sig. Klicka på en rad i förhandsvisningen eller ovan för att ändra bara den.</p>' +
      Object.keys(FIN_STD).map(function (k) { return reglageRad('data-fin', k, FIN_INFO[k], jkInst.FIN[k], false) }).join('')
  } else {
    var R = jkInst.RADER[jkVald] || {}
    h = '<p class="help">Bara raden <b>' + RM_NAMN[jkVald] + '</b>. Ändrade värden är markerade; ↺ tar tillbaka det som gäller alla rader.</p>' +
      rmNycklar(jkVald, jkInst.kompakt).map(function (k) {
        var andrad = R[k] !== undefined && R[k] !== null, v = andrad ? R[k] : jkRadStd(jkVald, k, jkInst)
        if (k === 'fyll') return '<label class="kryss jkkryss' + (andrad ? ' andrad' : '') + '"><input type="checkbox" data-rad="fyll"' + (v ? ' checked' : '') + '> ' + RAD_INFO.fyll[0] + ' <small class="help">(' + RAD_INFO.fyll[1] + ')</small></label>'
        return reglageRad('data-rad', k, jkInfo(k), v, andrad)
      }).join('')
  }
  $('jkReglage').innerHTML = flikar + h
  $('jkStorlek').innerHTML = [['STORLEK_RAD', '8 + 9'], ['STORLEK_RAD_S', '8S + 9S']].map(function (x) {
    var v = jkInst[x[0]]
    return '<label><span>' + x[1] + '<small>tom = automatisk</small></span><input type="range" data-st="' + x[0] + '" min="9" max="22" step="0.5" value="' + (num(v) ? v : 14) + '"' + (num(v) ? '' : ' disabled') + '><input type="number" data-st="' + x[0] + '" min="9" max="22" step="0.5" value="' + (num(v) ? v : '') + '" placeholder="auto"></label>'
  }).join('')
  $('jkAterstall').textContent = jkVald ? 'Återställ raden' : 'Återställ allt'
}
function jkKoppla() {
  var R = $('jkReglage')
  R.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-radval]'); if (b) { jkVal(b.dataset.radval || null); return }
    var n = ev.target.closest('[data-noll]')
    if (n && jkVald) { delete (jkInst.RADER[jkVald] || {})[n.dataset.noll]; if (jkInst.RADER[jkVald] && !Object.keys(jkInst.RADER[jkVald]).length) delete jkInst.RADER[jkVald]; jkSpara(); jkReglage(); jkRita() }
  })
  R.addEventListener('input', function (ev) {
    var inp = ev.target, k
    if ((k = inp.dataset.fin)) {
      var v = parseFloat(inp.value); if (!num(v)) return
      jkInst.FIN[k] = v
      R.querySelectorAll('[data-fin="' + k + '"]').forEach(function (o) { if (o !== inp) o.value = v })
    } else if ((k = inp.dataset.rad)) {
      var w = inp.type === 'checkbox' ? inp.checked : parseFloat(inp.value); if (inp.type !== 'checkbox' && !num(w)) return
      jkInst.RADER[jkVald] = jkInst.RADER[jkVald] || {}
      jkInst.RADER[jkVald][k] = w
      R.querySelectorAll('[data-rad="' + k + '"]').forEach(function (o) { if (o !== inp && o.type !== 'checkbox') o.value = w })
      var lab = inp.closest('label')
      if (lab && !lab.classList.contains('andrad')) { lab.classList.add('andrad'); var sp = lab.querySelector('.jkvarde'); if (sp) sp.insertAdjacentHTML('beforeend', '<button type="button" class="liten jknoll" data-noll="' + k + '" title="Tillbaka till det som gäller alla rader">↺</button>') }
      var fl = R.querySelector('[data-radval="' + jkVald + '"]'); if (fl && fl.textContent.indexOf('•') < 0) fl.textContent += ' •'
    } else return
    jkSpara(); jkRita()
  })
  $('jkStorlek').addEventListener('input', function (ev) {
    var inp = ev.target, k = inp.dataset.st; if (!k) return
    var v = inp.value === '' ? null : parseFloat(inp.value)
    jkInst[k] = num(v) ? v : null
    $('jkStorlek').querySelectorAll('[data-st="' + k + '"]').forEach(function (o) { if (o !== inp) { if (o.type === 'range') { o.disabled = !num(v); if (num(v)) o.value = v } else o.value = num(v) ? v : '' } })
    jkSpara(); jkRita()
  })
  $('jkRad').addEventListener('click', function (ev) { var r = ev.target.closest('[data-rad]'); if (r) jkVal(jkVald === r.dataset.rad ? null : r.dataset.rad) })
}

// ---------------------------------------------------------------------
//  Projekt
// ---------------------------------------------------------------------
function ritaProjekt() {
  var ids = Object.keys(projekt).sort(function (a, b) { return projekt[b].andrad - projekt[a].andrad })
  $('projektLista').innerHTML = ids.length ? ids.map(function (id) {
    var p = projekt[id], f = FAMILJER.find(function (x) { return x.id === p.spec.familj })
    return '<div class="projkort"><b>' + esc(p.namn || 'Utan namn') + (id === aktivt ? ' · öppen' : '') + '</b><p class="help">' + esc(f ? f.namn : p.spec.familj) + ' · ändrad ' + new Date(p.andrad).toLocaleString('sv-SE') + (p.synk ? ' · synk' : '') + '</p>' +
      '<div class="knapprad"><button class="liten default" data-p="oppna" data-id="' + id + '">Öppna</button><button class="liten" data-p="dup" data-id="' + id + '">Duplicera</button><button class="liten" data-p="fil" data-id="' + id + '">Spara som fil</button><button class="liten" data-p="bort" data-id="' + id + '">Ta bort</button></div></div>'
  }).join('') : '<p class="help">Inga sparade widgets än.</p>'
}
function laddaNer(namn, text, typ) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: typ || 'text/plain' })); a.download = namn
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 500)
}

// ---------------------------------------------------------------------
//  Inloggning
// ---------------------------------------------------------------------
function visaLogin() {
  $('loginLampa').className = 'lamp' + (auth ? ' ok' : '')
  $('loginText').textContent = auth ? auth.anv : 'Logga in'
}

// ---------------------------------------------------------------------
//  Start och händelser
// ---------------------------------------------------------------------
function init() {
  // val
  $('specFamilj').innerHTML = FAMILJER.map(function (f) { return '<option value="' + f.id + '">' + f.namn + '</option>' }).join('')
  var enh = ENHETER.map(function (e) { return '<option value="' + e.id + '">' + e.namn + ' (' + e.w + ' × ' + e.h + ')</option>' }).join('')
  $('enhetVal').innerHTML = enh; $('enhetVal').value = enhetId
  $('jkEnhet').innerHTML = enh; $('jkEnhet').value = jkInst.enhet
  $('mallVal').innerHTML += MALLAR.map(function (m, i) { return '<option value="' + i + '">' + esc(m.namn) + '</option>' }).join('')
  $('laggTill').innerHTML = [['stackH', 'Rad ↔'], ['stackV', 'Kolumn ↕'], ['text', 'Text'], ['ikon', 'Ikon'], ['pil', 'Vindpil'], ['luft', 'Luft'], ['matare', 'Mätare'], ['graf', 'Graf'], ['bild', 'Bild']].map(function (x) { return '<button type="button" data-ny="' + x[0] + '">+ ' + x[1] + '</button>' }).join('')
  var dl = document.createElement('datalist'); dl.id = 'sfLista'; dl.innerHTML = SF_NAMN.map(function (n) { return '<option value="' + n + '">' }).join(''); document.body.appendChild(dl)
  document.querySelectorAll('#zoomVal button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === zoom)); b.textContent = { 1: 'Hel', 2: '1:1', 3: 'Nära' }[b.dataset.v] })
  // exempeldata
  var EX = [['ti', 'Källaren °C'], ['rh', 'Fukt %'], ['tu', 'Ute (sensorn)'], ['bp', 'Batteri %'], ['rs', 'Wifi dBm'], ['minSedan', 'Min sedan uppladdning'], ['T', 'Ute SMHI'], ['H', 'Högst idag'], ['L', 'Lägst idag'], ['ws', 'Vind m/s'], ['wd', 'Vind från (grader)']]
  $('exGrid').innerHTML = EX.map(function (x) { return '<label>' + x[1] + '<input type="number" step="0.1" data-ex="' + x[0] + '" value="' + exempel[x[0]] + '"></label>' }).join('') +
    ['larm', 'tyst', 'usb'].map(function (k) { return '<label class="kryss"><input type="checkbox" data-ex="' + k + '"' + (exempel[k] ? ' checked' : '') + '> ' + { larm: 'Larm', tyst: 'Sensorn tyst', usb: 'Laddar' }[k] + '</label>' }).join('') +
    '<label style="grid-column:1/-1">Egen JSON (exempel)<textarea rows="2" data-ex="json">' + esc(exempel.json) + '</textarea></label>'
  $('exGrid').addEventListener('input', function (ev) {
    var k = ev.target.dataset.ex; if (!k) return
    exempel[k] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.tagName === 'TEXTAREA' ? ev.target.value : parseFloat(ev.target.value)
    lsSet('wv-exempel', exempel); ritaTelefon(); jkRita()
  })

  // projekt att börja med
  if (aktivt && projekt[aktivt]) S0 = klon(projekt[aktivt].spec)
  else nyttProjekt(MALLAR[1].ny())

  // flikar
  ;[['flik-bygg', 'vy-bygg'], ['flik-jk', 'vy-jk'], ['flik-projekt', 'vy-projekt']].forEach(function (p) {
    $(p[0]).addEventListener('click', function () {
      document.querySelectorAll('.flikrad [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.id === p[0])) })
      document.querySelectorAll('.vy').forEach(function (v) { v.hidden = v.id !== p[1] })
      if (p[1] === 'vy-projekt') ritaProjekt()
      if (p[1] === 'vy-jk') jkRita()
      lsSet('wv-flik', p[0])
    })
  })
  // träd
  $('trad').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-gor]'), n = ev.target.closest('.nod')
    if (b && n) { gor(b.dataset.gor, n.dataset.id); return }
    if (n) { valtId = n.dataset.id; ritaTrad(); ritaEgenskaper(); ritaTelefon() }
  })
  var dragId = null
  $('trad').addEventListener('dragstart', function (ev) { var n = ev.target.closest('.nod'); if (n) { dragId = n.dataset.id; ev.dataTransfer.effectAllowed = 'move' } })
  $('trad').addEventListener('dragover', function (ev) { var n = ev.target.closest('.nod'); if (n && dragId && n.dataset.id !== dragId) { ev.preventDefault(); document.querySelectorAll('.drag-over').forEach(function (x) { x.classList.remove('drag-over') }); n.classList.add('drag-over') } })
  $('trad').addEventListener('drop', function (ev) {
    ev.preventDefault()
    var n = ev.target.closest('.nod'); document.querySelectorAll('.drag-over').forEach(function (x) { x.classList.remove('drag-over') })
    if (!n || !dragId) return
    var fran = hitta(dragId), till = hitta(n.dataset.id)
    if (!fran || !till || !fran.foralder || hitta(n.dataset.id, fran.el)) { dragId = null; return }   // inte in i sig själv
    fran.foralder.barn.splice(fran.foralder.barn.indexOf(fran.el), 1)
    if (n.dataset.id === 'rot') S0.rot.barn.unshift(fran.el)
    else if (till.el.barn && ev.shiftKey) till.el.barn.push(fran.el)
    else { var lst = till.foralder.barn; lst.splice(lst.indexOf(till.el), 0, fran.el) }
    dragId = null; andrat()
  })
  $('laggTill').addEventListener('click', function (ev) { var b = ev.target.closest('[data-ny]'); if (b) laggTill(b.dataset.ny) })
  // klick i telefonen väljer delen
  $('telefon').addEventListener('click', function (ev) { var el = ev.target.closest('.wv-el'); if (el && el.dataset.id) { valtId = el.dataset.id; ritaTrad(); ritaEgenskaper(); ritaTelefon() } })
  // widgetfält
  $('specNamn').addEventListener('input', function () { S0.namn = this.value; ritaTrad(); clearTimeout(sparTimer); sparTimer = setTimeout(sparaAktivt, 400) })
  $('specFamilj').addEventListener('change', function () {
    var var_las = /^accessory/.test(S0.familj), ar_las = /^accessory/.test(this.value)
    S0.familj = this.value
    if (var_las !== ar_las) S0.bakgrund = ar_las ? { typ: 'ingen' } : { typ: 'farg', farg: '#1c2026', fargLarm: '#3a1f1f' }
    andrat()
  })
  $('mallVal').addEventListener('change', function () {
    if (this.value === '') return
    nyttProjekt(MALLAR[+this.value].ny()); this.value = ''; ritaAllt(); toast('Ny widget från mall')
  })
  $('enhetVal').addEventListener('change', function () { enhetId = this.value; lsSet('wv-enhet', enhetId); ritaTelefon() })
  $('zoomVal').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; zoom = +b.dataset.v; lsSet('wv-zoom', zoom); this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)) }); ritaTelefon() })
  $('dataVal').addEventListener('click', async function (ev) {
    var b = ev.target.closest('button'); if (!b) return
    if (b.dataset.v === 'riktig' && !auth) { $('dlgLogin').showModal(); return }
    dataLage = b.dataset.v; this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)) })
    ritaTelefon()
    if (dataLage === 'riktig') { await hamtaRiktig(); ritaTelefon(); jkRita() }
  })
  $('btnVarden').addEventListener('click', function () { visaAllaVarden = !visaAllaVarden; this.textContent = visaAllaVarden ? 'Visa färre' : 'Visa alla'; ritaVarden(varden()) })
  var senasteText = null
  document.addEventListener('focusin', function (ev) { if (ev.target.matches('#egenskaper input[type=text]')) senasteText = ev.target })
  $('vardeLista').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-v]'); if (!b) return
    var inp = senasteText && document.body.contains(senasteText) ? senasteText : $('egenskaper').querySelector('input[data-k=text],input[data-k=varde]')
    if (!inp) { navigator.clipboard && navigator.clipboard.writeText(b.dataset.v); toast('Kopierat: ' + b.dataset.v); return }
    var p = inp.selectionStart === null || inp.selectionStart === undefined ? inp.value.length : inp.selectionStart
    inp.value = inp.value.slice(0, p) + b.dataset.v + inp.value.slice(inp.selectionEnd || p)
    inp.dispatchEvent(new Event('input')); inp.focus()
  })
  // export
  $('btnKopiera').addEventListener('click', async function () {
    try { var k = await byggKod(); await navigator.clipboard.writeText(k); $('exportMsg').className = 'msg ok'; $('exportMsg').textContent = 'Koden är kopierad. Klistra in den i ett nytt skript i Scriptable.' }
    catch (e) { $('exportMsg').className = 'msg bad'; $('exportMsg').textContent = 'Kunde inte kopiera: ' + e.message }
  })
  $('btnLadda').addEventListener('click', async function () { laddaNer((synkNamn() || 'widget') + '.js', await byggKod(), 'text/javascript') })
  $('btnSpara').addEventListener('click', function () { sparaAktivt(); toast('Sparat i webbläsaren') })
  $('synkPa').addEventListener('change', function () { projekt[aktivt] = projekt[aktivt] || {}; projekt[aktivt].synk = this.checked; sparaAktivt(); $('btnPublicera').disabled = !this.checked })
  $('btnPublicera').addEventListener('click', async function () {
    var m = $('exportMsg')
    if (!auth) { $('dlgLogin').showModal(); return }
    try { await db('PUT', 'widgetconf/' + synkNamn(), S0); m.className = 'msg ok'; m.textContent = 'Publicerat som "' + synkNamn() + '". Telefonen hämtar det inom 5 minuter.' }
    catch (e) { m.className = 'msg bad'; m.textContent = e.message + '. Kräver admin och en regel för widgetconf i Firebase (se README).' }
  })
  // jordkällaren
  $('jkEnhet').addEventListener('change', function () { jkInst.enhet = this.value; jkSpara(); jkRita() })
  $('jkLage').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; jkInst.kompakt = b.dataset.v === 'S'; this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)) }); jkSpara(); jkReglage(); jkRita() })
  $('jkRuta').checked = !!jkInst.rundad; $('jkByt').checked = !!jkInst.byt
  document.querySelectorAll('#jkLage button').forEach(function (x) { x.setAttribute('aria-pressed', String((x.dataset.v === 'S') === !!jkInst.kompakt)) })
  $('jkRuta').addEventListener('change', function () { jkInst.rundad = this.checked; jkSpara(); jkRita() })
  $('jkByt').addEventListener('change', function () { jkInst.byt = this.checked; jkSpara(); jkRita() })
  $('jkAterstall').addEventListener('click', function () {
    if (jkVald) delete jkInst.RADER[jkVald]
    else if (confirm('Återställa alla rader och textstorleken?')) { jkInst.FIN = klon(FIN_STD); jkInst.RADER = {}; jkInst.STORLEK_RAD = null; jkInst.STORLEK_RAD_S = null }
    jkSpara(); jkReglage(); jkRita()
  })
  $('jkKopiera').addEventListener('click', async function () {
    try { await navigator.clipboard.writeText(jkFinText(jkInst)); $('jkMsg').className = 'msg ok'; $('jkMsg').textContent = 'Kopierat. Ersätt raderna från STORLEK_RAD till slutet av FIN i skriptet.' }
    catch (e) { $('jkMsg').className = 'msg bad'; $('jkMsg').textContent = e.message }
  })
  $('jkPublicera').addEventListener('click', async function () {
    if (!auth) { $('dlgLogin').showModal(); return }
    try { await db('PUT', 'widgetconf/jordkallaren', { FIN: jkInst.FIN, RADER: jkInst.RADER, STORLEK_RAD: jkInst.STORLEK_RAD, STORLEK_RAD_S: jkInst.STORLEK_RAD_S, at: Date.now() }); $('jkMsg').className = 'msg ok'; $('jkMsg').textContent = 'Publicerat. Telefonen använder det inom 5 minuter.' }
    catch (e) { $('jkMsg').className = 'msg bad'; $('jkMsg').textContent = e.message + '. Kräver admin och en regel för widgetconf i Firebase (se README).' }
  })
  // projekt
  $('projektLista').addEventListener('click', async function (ev) {
    var b = ev.target.closest('[data-p]'); if (!b) return
    var id = b.dataset.id, p = projekt[id]
    if (b.dataset.p === 'oppna') { oppna(id); $('flik-bygg').click() }
    else if (b.dataset.p === 'dup') { var k = klon(p); k.namn = (k.namn || '') + ' (kopia)'; k.spec.namn = k.namn; k.andrad = Date.now(); projekt['p' + Date.now().toString(36)] = k; lsSet('wv-projekt', projekt); ritaProjekt() }
    else if (b.dataset.p === 'fil') laddaNer(String(p.namn || 'widget').replace(/[^\wåäöÅÄÖ -]/g, '') + '.widget.json', JSON.stringify(p, null, 1), 'application/json')
    else if (b.dataset.p === 'bort' && confirm('Ta bort "' + (p.namn || '') + '"?')) { delete projekt[id]; lsSet('wv-projekt', projekt); if (id === aktivt) { var r = Object.keys(projekt)[0]; if (r) oppna(r); else { nyttProjekt(MALLAR[0].ny()); ritaAllt() } } ritaProjekt() }
  })
  $('btnNytt').addEventListener('click', function () { nyttProjekt(MALLAR[0].ny()); ritaAllt(); $('flik-bygg').click() })
  $('btnExportAlla').addEventListener('click', function () { laddaNer('widgets.json', JSON.stringify(projekt, null, 1), 'application/json') })
  $('btnImport').addEventListener('click', function () { $('importFil').click() })
  $('importFil').addEventListener('change', async function () {
    var f = this.files[0]; if (!f) return
    try {
      var j = JSON.parse(await f.text()), n = 0
      var lagg = function (p) { if (p && p.spec && p.spec.rot) { projekt['p' + Date.now().toString(36) + n] = Object.assign({}, p, { andrad: Date.now() }); n++ } }
      if (j.spec) lagg(j); else if (j.rot) lagg({ namn: j.namn, spec: j }); else Object.keys(j).forEach(function (k) { lagg(j[k]) })
      lsSet('wv-projekt', projekt); ritaProjekt(); toast(n + ' widget' + (n === 1 ? '' : 's') + ' inlästa')
    } catch (e) { toast('Kunde inte läsa filen') }
    this.value = ''
  })
  // inloggning
  $('btnLogin').addEventListener('click', function () { $('lgUt').hidden = !auth; $('lgAnv').value = auth ? auth.anv : ''; $('lgMsg').textContent = ''; $('dlgLogin').showModal() })
  $('lgAvbryt').addEventListener('click', function () { $('dlgLogin').close() })
  $('lgUt').addEventListener('click', function () { auth = null; lsSet('wv-auth', null); riktig = null; visaLogin(); $('dlgLogin').close(); if (dataLage === 'riktig') $('dataVal').querySelector('[data-v=exempel]').click() })
  $('loginForm').addEventListener('submit', async function (ev) {
    ev.preventDefault()
    $('lgMsg').className = 'msg'; $('lgMsg').textContent = 'Loggar in …'
    try { await loggaIn($('lgAnv').value.trim().toLowerCase(), $('lgLos').value); $('lgLos').value = ''; visaLogin(); $('dlgLogin').close(); toast('Inloggad som ' + auth.anv) }
    catch (e) { $('lgMsg').className = 'msg bad'; $('lgMsg').textContent = e.message }
  })
  // tema
  $('btnTema').addEventListener('click', function () {
    var t = lsGet('wv-tema-v', 'morkt'), ny = t === 'morkt' ? 'ljust' : t === 'ljust' ? 'system' : 'morkt'
    lsSet('wv-tema-v', ny); try { localStorage.setItem('wv-tema', ny) } catch (e) {}
    var ljust = ny === 'ljust' || (ny === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
    if (ljust) document.documentElement.dataset.tema = 'ljust'; else delete document.documentElement.dataset.tema
    toast('Tema: ' + { morkt: 'mörkt', ljust: 'ljust', system: 'som systemet' }[ny])
  })

  visaLogin(); jkReglage(); jkKoppla(); ritaAllt()
  var flik = lsGet('wv-flik', 'flik-bygg'); if ($(flik)) $(flik).click()
  // uppdatera tiden i förhandsvisningen varje minut
  setInterval(function () { ritaTelefon() }, 60e3)
}
init()
})()
