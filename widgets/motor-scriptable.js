// =====================================================================
//  Widgetmotorn: ritar widgeten i SPEC (se överst) med Scriptables egna delar.
//  Den här delen är likadan i alla widgets från verktyget.
// =====================================================================
var SIDA_JK = 'https://stekbring.github.io/jordkellare/'
var ROT = 'jordkallare'
var KC = { user: 'jk_user', pass: 'jk_pass', refresh: 'jk_refresh', token: 'jk_token', cfg: 'jk_cfg' }
var kcGet = function (k) { return Keychain.contains(k) ? Keychain.get(k) : null }
var fm = FileManager.local()
var cacheFil = function (n) { return fm.joinPath(fm.libraryDirectory(), 'wv-' + String(n).replace(/[^a-z0-9_-]/gi, '_') + '.json') }
function lasCache(n) { try { var p = cacheFil(n); return fm.fileExists(p) ? JSON.parse(fm.readString(p)) : null } catch (e) { return null } }
function skrivCache(n, d) { try { fm.writeString(cacheFil(n), JSON.stringify(d)) } catch (e) {} }

// ---------- Inloggning (samma konto som Jordkällaren-skriptet; nyckelringen delas) ----------
async function hamtaCfg() {
  var cfg = null
  try { cfg = JSON.parse(kcGet(KC.cfg) || 'null') } catch (e) {}
  if (cfg && Date.now() - (cfg.hamtad || 0) < 7 * DYGN) return cfg
  try {
    var r = new Request(SIDA_JK + 'firebase-config.js'); r.timeoutInterval = 15
    var s = await r.loadString()
    var f = function (re) { return (s.match(re) || [])[1] }
    var ny = { apiKey: f(/apiKey:\s*["']([^"']+)["']/), db: f(/databaseURL:\s*["']([^"']+)["']/), doman: f(/LOGIN_DOMAIN\s*=\s*["']([^"']+)["']/), hamtad: Date.now() }
    if (ny.apiKey && ny.db && ny.doman) { Keychain.set(KC.cfg, JSON.stringify(ny)); return ny }
  } catch (e) {}
  if (cfg) return cfg
  throw new Error('Hittar inte Firebase-inställningarna')
}
async function postJSON(url, body, form) {
  var r = new Request(url); r.method = 'POST'; r.timeoutInterval = 15
  r.headers = { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }
  r.body = form ? body : JSON.stringify(body)
  var j = await r.loadJSON()
  return { ok: r.response.statusCode === 200, j: j }
}
async function loggaIn(cfg, user, pass) {
  var x = await postJSON('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + cfg.apiKey, { email: user + '@' + cfg.doman, password: pass, returnSecureToken: true })
  if (!x.ok) throw new Error(/INVALID|NOT_FOUND/.test((x.j && x.j.error && x.j.error.message) || '') ? 'Fel användarnamn eller lösenord' : 'Inloggningen misslyckades')
  Keychain.set(KC.refresh, x.j.refreshToken)
  Keychain.set(KC.token, JSON.stringify({ t: x.j.idToken, till: Date.now() + (Number(x.j.expiresIn) - 120) * 1000 }))
  return x.j.idToken
}
async function token(cfg) {
  try { var c = JSON.parse(kcGet(KC.token) || 'null'); if (c && c.till > Date.now()) return c.t } catch (e) {}
  var rt = kcGet(KC.refresh)
  if (rt) {
    try {
      var x = await postJSON('https://securetoken.googleapis.com/v1/token?key=' + cfg.apiKey, 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(rt), true)
      if (x.ok) {
        Keychain.set(KC.refresh, x.j.refresh_token)
        Keychain.set(KC.token, JSON.stringify({ t: x.j.id_token, till: Date.now() + (Number(x.j.expires_in) - 120) * 1000 }))
        return x.j.id_token
      }
    } catch (e) {}
  }
  var u = kcGet(KC.user), p = kcGet(KC.pass)
  if (!u || !p) throw new Error('Inte inloggad – öppna skriptet i Scriptable')
  return loggaIn(cfg, u, p)
}
async function getDB(cfg, tok, path, q) {
  var r = new Request(cfg.db + '/' + ROT + '/' + path + '.json?auth=' + tok + (q || '')); r.timeoutInterval = 20
  var j = await r.loadJSON()
  if (r.response.statusCode !== 200) throw new Error(r.response.statusCode === 401 ? 'Kontot saknar läsrätt' : 'Fel ' + r.response.statusCode)
  return j
}

// ---------- Inställningar från verktyget (synk via länk) ----------
async function hamtaSpec() {
  if (!SYNK) return SPEC
  var c = lasCache('spec-' + SYNK)
  if (c && Date.now() - c.at < 5 * 60e3) return c.spec
  try {
    var cfg = await hamtaCfg()
    var s = await getDB(cfg, await token(cfg), 'widgetconf/' + SYNK)
    if (s && s.rot) { skrivCache('spec-' + SYNK, { at: Date.now(), spec: s }); return s }
  } catch (e) {}
  return c ? c.spec : SPEC
}

// ---------- Data ----------
async function hamtaData(spec) {
  var k = spec.kallor || {}, inn = { nu: Date.now(), zon: spec.zon }
  var fel = null
  if (k.jk) {
    var c = lasCache('jk')
    if (c && Date.now() - c.at < 3 * 60e3) Object.assign(inn, c.d)
    else {
      try {
        var cfg = await hamtaCfg(), tok = await token(cfg)
        var fran = '&orderBy=%22at%22&startAt=' + Math.floor(midnatt() - 7 * DYGN)
        var r = await Promise.all([getDB(cfg, tok, 'latest'), getDB(cfg, tok, 'larmstatus'), getDB(cfg, tok, 'timmar', fran)])
        var d = { latest: r[0], larm: r[1], timmar: lista(r[2]).filter(function (h) { return num(h.at) }) }
        skrivCache('jk', { at: Date.now(), d: d }); Object.assign(inn, d)
      } catch (e) { fel = e.message; if (c) Object.assign(inn, c.d) }
    }
  }
  if (k.smhi) {
    var v = lasCache('smhi')
    if (v && Date.now() - v.at < 30 * 60e3) inn.vader = v.d
    else {
      try {
        var plats = { lat: 57.1686, lon: 15.3497 }
        try { var cfg2 = await hamtaCfg(); var p = await getDB(cfg2, await token(cfg2), 'plats'); if (p && num(p.lat)) plats = { lat: p.lat, lon: p.lon } } catch (e) {}
        var rq = new Request('https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/' + plats.lon.toFixed(4) + '/lat/' + plats.lat.toFixed(4) + '/data.json')
        rq.timeoutInterval = 20
        var vd = { plats: plats, ts: smhiSerie(await rq.loadJSON()) }
        skrivCache('smhi', { at: Date.now(), d: vd }); inn.vader = vd
      } catch (e) { if (v) inn.vader = v.d }
    }
  }
  if (k.json && k.json.url) {
    var jc = lasCache('json-' + k.json.url)
    if (jc && Date.now() - jc.at < (k.json.min || 15) * 60e3) inn.json = jc.d
    else {
      try { var rj = new Request(k.json.url); rj.timeoutInterval = 15; inn.json = await rj.loadJSON(); skrivCache('json-' + k.json.url, { at: Date.now(), d: inn.json }) }
      catch (e) { if (jc) inn.json = jc.d }
    }
  }
  var V = harledVarden(inn)
  V.fel = fel
  return V
}

// ---------- Ritning ----------
function farg(hex, alfa) { return new Color(hex || '#ffffff', alfa === undefined ? 1 : alfa) }
function teckensnitt(el) {
  var s = el.storlek || 14, v = el.vikt || 'regular', typ = el.typsnitt || 'rundad'
  var namn = { light: 'light', regular: 'regular', medium: 'medium', semibold: 'semibold', bold: 'bold', heavy: 'heavy' }[v] || 'regular'
  if (typ === 'rundad') return Font[namn + 'RoundedSystemFont'](s)
  if (typ === 'mono') return Font[namn + 'MonospacedSystemFont'](s)
  if (typ === 'serif') return new Font('NewYork-' + (namn === 'regular' ? 'Regular' : namn.charAt(0).toUpperCase() + namn.slice(1)), s)
  return namn === 'regular' ? Font.systemFont(s) : Font[namn + 'SystemFont'](s)
}
function nyDC(w, h) { var dc = new DrawContext(); dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true; return dc }
function bage(dc, cx, cy, r, a0, a1, c, bredd, runda) {
  if (Math.abs(a1 - a0) < 0.5) return
  var p = new Path(), n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3))
  var pt = function (a) { return new Point(cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)) }
  p.move(pt(a0)); for (var i = 1; i <= n; i++) p.addLine(pt(a0 + (a1 - a0) * i / n))
  dc.addPath(p); dc.setStrokeColor(c); dc.setLineWidth(bredd); dc.strokePath()
  if (runda !== false) { dc.setFillColor(c); [a0, a1].forEach(function (a) { var q = pt(a); dc.fillEllipse(new Rect(q.x - bredd / 2, q.y - bredd / 2, bredd, bredd)) }) }
}
function matarBild(el, V) {
  var s = el.storlek || 64, b = el.bredd || 5, c = s / 2, r = c - b / 2 - (el.inset || 2)
  var v = talFran(el.varde, V), lo = num(el.min) ? el.min : 0, hi = num(el.max) ? el.max : 100
  var f = num(v) ? Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))) : null
  var g = matareGeo(el.stil), dc = nyDC(s, s)
  var fg = farg(elFarg(el, V), el.alfa), spar = farg(el.sparFarg || elFarg(el, V), num(el.spar) ? el.spar : 0.25)
  bage(dc, c, c, r, g.a0, g.a0 + g.span, spar, b, el.stil !== 'ring')
  if (num(f)) {
    if (el.stil === 'prick') {
      var a = (g.a0 + g.span * f) * Math.PI / 180, d = b + 3
      dc.setFillColor(fg); dc.fillEllipse(new Rect(c + r * Math.cos(a) - d / 2, c + r * Math.sin(a) - d / 2, d, d))
    } else if (f > 0) bage(dc, c, c, r, g.a0, g.a0 + g.span * f, fg, b, true)
  }
  return dc.getImage()
}
function grafBild(el, V) {
  var w = el.bredd || 140, h = el.hojd || 40, dc = nyDC(w, h), pad = 3
  var s = ((V.serier || {})[el.serie || 'ti'] || []).filter(function (p) { return p[0] >= Date.now() - (el.timmar || 24) * TIMME })
  if (el.bakgrund) { var bp = new Path(); bp.addRoundedRect(new Rect(0, 0, w, h), el.radie || 6, el.radie || 6); dc.addPath(bp); dc.setFillColor(farg(el.bakgrund, el.bakgrundAlfa || 0.15)); dc.fillPath() }
  if (s.length < 2) return dc.getImage()
  var lo = Math.min.apply(null, s.map(function (p) { return p[1] })), hi = Math.max.apply(null, s.map(function (p) { return p[1] }))
  var ms = el.minSpann || 0.5
  if (hi - lo < ms) { var m = (hi + lo) / 2; lo = m - ms / 2; hi = m + ms / 2 }
  var t0 = Date.now() - (el.timmar || 24) * TIMME, t1 = Math.max(Date.now(), s[s.length - 1][0])
  var X = function (t) { return (t - t0) / (t1 - t0) * (w - 2 * pad) + pad }
  var Y = function (v) { return pad + (h - 2 * pad) * (hi - v) / (hi - lo) }
  var c = farg(elFarg(el, V), el.alfa)
  var p = new Path(), forra = null
  s.forEach(function (q) { var pt = new Point(X(q[0]), Y(q[1])); if (!forra || q[0] - forra > 3 * TIMME) p.move(pt); else p.addLine(pt); forra = q[0] })
  dc.addPath(p); dc.setStrokeColor(c); dc.setLineWidth(el.linje || 2); dc.strokePath()
  if (el.prick !== false) { var sista = s[s.length - 1]; dc.setFillColor(c); dc.fillEllipse(new Rect(X(sista[0]) - 3, Y(sista[1]) - 3, 6, 6)) }
  return dc.getImage()
}

function justera(st, el) {
  if (el.riktning === 'h') { if (el.justera === 'start') st.topAlignContent(); else if (el.justera === 'end') st.bottomAlignContent(); else st.centerAlignContent() }
  else { if (el.justera === 'center') st.centerAlignContent(); else if (el.justera === 'end') st.bottomAlignContent(); else st.topAlignContent() }
}
async function ritaBarn(st, barn, V) {
  for (var i = 0; i < (barn || []).length; i++) { var el = barn[i]; if (syns(el, V)) await ritaEl(st, el, V) }
}
async function ritaEl(st, el, V) {
  if (el.typ === 'stack' || el.typ === 'matare') {
    var s = st.addStack()
    if (el.typ === 'matare') {
      var sz = el.storlek || 64
      s.size = new Size(sz, sz); s.backgroundImage = matarBild(el, V); s.layoutVertically(); s.centerAlignContent()
      s.addSpacer()
      for (var i = 0; i < (el.barn || []).length; i++) {
        var b = el.barn[i]; if (!syns(b, V)) continue
        var rad = s.addStack(); rad.layoutHorizontally(); rad.addSpacer(); await ritaEl(rad, b, V); rad.addSpacer()
      }
      s.addSpacer()
      return
    }
    if (el.riktning === 'h') s.layoutHorizontally(); else s.layoutVertically()
    justera(s, el)
    if (num(el.mellan) && el.mellan) s.spacing = el.mellan
    var p = el.padding || [0, 0, 0, 0]; if (p.some(function (x) { return x })) s.setPadding(p[0], p[1], p[2], p[3])
    if (el.bg) s.backgroundColor = farg(el.bg, el.bgAlfa)
    if (el.radie) s.cornerRadius = el.radie
    if (el.kant) { s.borderWidth = el.kant; s.borderColor = farg(el.kantFarg || '#ffffff', el.kantAlfa) }
    if (el.bredd || el.hojd) s.size = new Size(el.bredd || 0, el.hojd || 0)
    await ritaBarn(s, el.barn, V)
    return
  }
  if (el.typ === 'text') {
    var t = st.addText(fyllText(el.text, V))
    t.font = teckensnitt(el); t.textColor = farg(elFarg(el, V), el.alfa)
    t.lineLimit = el.rader || 1
    if (num(el.minSkala) && el.minSkala < 1) t.minimumScaleFactor = el.minSkala
    if (el.justeraText === 'center') t.centerAlignText(); else if (el.justeraText === 'right') t.rightAlignText()
    return
  }
  if (el.typ === 'ikon') {
    var sym = SFSymbol.named(fyllText(el.namn, V)) || SFSymbol.named('questionmark.square')
    sym.applyFont(Font.semiboldSystemFont(el.storlek || 14))
    var im = st.addImage(sym.image); im.imageSize = new Size(el.storlek || 14, el.storlek || 14); im.tintColor = farg(elFarg(el, V), el.alfa)
    return
  }
  if (el.typ === 'pil') {
    var gr = pilVinkel(el, V); if (gr === null) return
    var ps = el.storlek || 14, dc = nyDC(ps, ps), c = ps / 2, a = gr * Math.PI / 180, r = ps / 2 - 0.5
    var pt = function (x, y) { return new Point(c + x * Math.cos(a) - y * Math.sin(a), c + x * Math.sin(a) + y * Math.cos(a)) }
    var p = new Path(); p.move(pt(0, -r)); p.addLine(pt(r * 0.62, r * 0.05)); p.addLine(pt(r * 0.2, r * 0.05)); p.addLine(pt(r * 0.2, r))
    p.addLine(pt(-r * 0.2, r)); p.addLine(pt(-r * 0.2, r * 0.05)); p.addLine(pt(-r * 0.62, r * 0.05)); p.closeSubpath()
    dc.addPath(p); dc.setFillColor(farg(elFarg(el, V), el.alfa)); dc.fillPath()
    var pi = st.addImage(dc.getImage()); pi.imageSize = new Size(ps, ps)
    return
  }
  if (el.typ === 'luft') { if (num(el.langd)) st.addSpacer(el.langd); else st.addSpacer(); return }
  if (el.typ === 'graf') { var g = st.addImage(grafBild(el, V)); g.imageSize = new Size(el.bredd || 140, el.hojd || 40); return }
  if (el.typ === 'bild' && el.url) {
    try { var img = await new Request(fyllText(el.url, V)).loadImage(); var bi = st.addImage(img); if (el.bredd) bi.imageSize = new Size(el.bredd, el.hojd || el.bredd); if (el.radie) bi.cornerRadius = el.radie } catch (e) {}
  }
}

async function byggWidget(spec, V) {
  var w = new ListWidget()
  var bg = spec.bakgrund || {}
  var las = /^accessory/.test(config.widgetFamily || spec.familj || '')
  if (las && bg.typ === 'las') w.addAccessoryWidgetBackground = true
  else if (bg.typ === 'farg') w.backgroundColor = farg(V.larm && bg.fargLarm ? bg.fargLarm : bg.farg, bg.alfa)
  else if (bg.typ === 'gradient') {
    var gr = new LinearGradient(); gr.colors = [farg(bg.farg), farg(bg.farg2 || bg.farg)]; gr.locations = [0, 1]
    var a = (bg.vinkel || 180) * Math.PI / 180; gr.startPoint = new Point(0.5 - Math.sin(a) / 2, 0.5 + Math.cos(a) / 2); gr.endPoint = new Point(0.5 + Math.sin(a) / 2, 0.5 - Math.cos(a) / 2)
    w.backgroundGradient = gr
  }
  var p = spec.padding; if (p) w.setPadding(p[0], p[1], p[2], p[3])
  if (spec.url) w.url = fyllText(spec.url, V)
  var rot = spec.rot || { typ: 'stack', riktning: 'v', barn: [] }
  // roten är widgeten själv: dess barn ritas direkt i den
  if (rot.mellan) w.spacing = rot.mellan
  await ritaBarn(w, rot.barn, V)
  w.refreshAfterDate = new Date(Date.now() + Math.max(5, spec.uppdatera || 15) * 60e3)
  return w
}

async function felWidget(text) {
  var w = new ListWidget(); var t = w.addText(text); t.font = Font.mediumSystemFont(12); t.textColor = Color.orange(); t.minimumScaleFactor = 0.5
  w.refreshAfterDate = new Date(Date.now() + 15 * 60e3); return w
}

async function iAppen(spec) {
  var a = new Alert(); a.title = spec.namn || 'Widget'
  a.message = kcGet(KC.user) ? 'Inloggad som ' + kcGet(KC.user) + '.' : 'Logga in med widget-kontot (behövs för Jordkällaren och synk).'
  a.addAction('Visa widgeten'); a.addAction(kcGet(KC.user) ? 'Byt konto' : 'Logga in'); a.addCancelAction('Stäng')
  var val = await a.presentSheet()
  if (val === 0) {
    var V = await hamtaData(spec), w = await byggWidget(spec, V)
    var f = { small: 'presentSmall', medium: 'presentMedium', large: 'presentLarge', extraLarge: 'presentExtraLarge', accessoryCircular: 'presentAccessoryCircular', accessoryRectangular: 'presentAccessoryRectangular', accessoryInline: 'presentAccessoryInline' }[spec.familj] || 'presentSmall'
    await (w[f] ? w[f]() : w.presentSmall())
  } else if (val === 1) {
    var b = new Alert(); b.title = 'Logga in'; b.addTextField('Användarnamn', kcGet(KC.user) || 'widget'); b.addSecureTextField('Lösenord', ''); b.addAction('Logga in'); b.addCancelAction('Avbryt')
    if (await b.present() === -1) return
    var svar = new Alert()
    try { var cfg = await hamtaCfg(); await loggaIn(cfg, b.textFieldValue(0).trim().toLowerCase(), b.textFieldValue(1)); Keychain.set(KC.user, b.textFieldValue(0).trim().toLowerCase()); Keychain.set(KC.pass, b.textFieldValue(1)); svar.title = 'Klart!' }
    catch (e) { svar.title = 'Det gick inte'; svar.message = e.message }
    svar.addAction('OK'); await svar.present()
  }
}

// ---------- Start ----------
var spec0 = await hamtaSpec()
if (config.runsInWidget || config.runsInAccessoryWidget) {
  try { var V0 = await hamtaData(spec0); Script.setWidget(await byggWidget(spec0, V0)) }
  catch (e) { Script.setWidget(await felWidget(e.message || String(e))) }
} else {
  await iAppen(spec0)
}
Script.complete()
