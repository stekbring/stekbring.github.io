// =====================================================================
//  Förhandsvisning i webbläsaren: ritar samma SPEC som Scriptable-skriptet,
//  med CSS i stället för Scriptables delar. 1 px här = 1 punkt på iPhone.
// =====================================================================

var TYPSNITT = {
  rundad: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
  standard: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  serif: 'ui-serif, "New York", Georgia, serif',
}
var VIKTER = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 }

function hexRgb(hex) {
  var h = String(hex || '#ffffff').replace('#', '')
  if (h.length === 3) h = h.split('').map(function (c) { return c + c }).join('')
  var n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
// Låsskärmen ritar allt i en färg: vitt, med genomskinlighet efter hur ljus färgen är
function cssFarg(hex, alfa, las) {
  var a = alfa === undefined || alfa === null ? 1 : alfa
  var c = hexRgb(hex)
  if (las) {
    var lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
    return 'rgba(255,255,255,' + (a * (0.25 + 0.75 * lum)).toFixed(3) + ')'
  }
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
}

function bagSvgPath(cx, cy, r, a0, a1) {
  var rad = Math.PI / 180, x0 = cx + r * Math.cos(a0 * rad), y0 = cy + r * Math.sin(a0 * rad), x1 = cx + r * Math.cos(a1 * rad), y1 = cy + r * Math.sin(a1 * rad)
  if (Math.abs(a1 - a0) >= 359.9) return 'M' + (cx + r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 1 ' + (-2 * r) + ' 0a' + r + ' ' + r + ' 0 1 1 ' + (2 * r) + ' 0'
  return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2)
}

function matareSvg(el, V, las) {
  var s = el.storlek || 64, b = el.bredd || 5, c = s / 2, r = c - b / 2 - (el.inset || 2)
  var v = talFran(el.varde, V), lo = num(el.min) ? el.min : 0, hi = num(el.max) ? el.max : 100
  var f = num(v) ? Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))) : null
  var g = matareGeo(el.stil), fg = cssFarg(elFarg(el, V), el.alfa, las), sp = cssFarg(el.sparFarg || elFarg(el, V), num(el.spar) ? el.spar : 0.25, las)
  var lc = el.stil === 'ring' ? 'butt' : 'round'
  var h = '<svg width="' + s + '" height="' + s + '" style="position:absolute;inset:0" aria-hidden="true">'
  h += '<path d="' + bagSvgPath(c, c, r, g.a0, g.a0 + g.span) + '" fill="none" stroke="' + sp + '" stroke-width="' + b + '" stroke-linecap="' + lc + '"/>'
  if (num(f)) {
    if (el.stil === 'prick') {
      var a = (g.a0 + g.span * f) * Math.PI / 180
      h += '<circle cx="' + (c + r * Math.cos(a)).toFixed(2) + '" cy="' + (c + r * Math.sin(a)).toFixed(2) + '" r="' + ((b + 3) / 2) + '" fill="' + fg + '"/>'
    } else if (f > 0.002) h += '<path d="' + bagSvgPath(c, c, r, g.a0, g.a0 + g.span * Math.min(f, 0.9999)) + '" fill="none" stroke="' + fg + '" stroke-width="' + b + '" stroke-linecap="round"/>'
  }
  return h + '</svg>'
}

function grafSvg(el, V, las) {
  var w = el.bredd || 140, h = el.hojd || 40, pad = 3
  var s = ((V.serier || {})[el.serie || 'ti'] || []).filter(function (p) { return p[0] >= Date.now() - (el.timmar || 24) * TIMME })
  var out = '<svg width="' + w + '" height="' + h + '" aria-hidden="true">'
  if (el.bakgrund) out += '<rect width="' + w + '" height="' + h + '" rx="' + (el.radie || 6) + '" fill="' + cssFarg(el.bakgrund, el.bakgrundAlfa || 0.15, las) + '"/>'
  if (s.length >= 2) {
    var lo = Math.min.apply(null, s.map(function (p) { return p[1] })), hi = Math.max.apply(null, s.map(function (p) { return p[1] }))
    var ms = el.minSpann || 0.5
    if (hi - lo < ms) { var m = (hi + lo) / 2; lo = m - ms / 2; hi = m + ms / 2 }
    var t0 = Date.now() - (el.timmar || 24) * TIMME, t1 = Math.max(Date.now(), s[s.length - 1][0])
    var X = function (t) { return (t - t0) / (t1 - t0) * (w - 2 * pad) + pad }, Y = function (v) { return pad + (h - 2 * pad) * (hi - v) / (hi - lo) }
    var d = '', forra = null
    s.forEach(function (q) { d += (!forra || q[0] - forra > 3 * TIMME ? 'M' : 'L') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); forra = q[0] })
    var c = cssFarg(elFarg(el, V), el.alfa, las)
    out += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (el.linje || 2) + '" stroke-linejoin="round" stroke-linecap="round"/>'
    var sista = s[s.length - 1]
    if (el.prick !== false) out += '<circle cx="' + X(sista[0]).toFixed(1) + '" cy="' + Y(sista[1]).toFixed(1) + '" r="3" fill="' + c + '"/>'
  }
  return out + '</svg>'
}

// Ett element → DOM. ctx = { las, valt (id), riktning (förälderns) }
function domEl(el, V, ctx) {
  var d = document.createElement('div')
  d.className = 'wv-el wv-' + el.typ + (ctx.valt === el.id ? ' wv-valt' : '')
  d.dataset.id = el.id || ''
  var las = ctx.las
  if (el.typ === 'stack' || el.typ === 'matare') {
    if (el.typ === 'matare') {
      var sz = el.storlek || 64
      d.style.cssText = 'position:relative;width:' + sz + 'px;height:' + sz + 'px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center'
      d.innerHTML = matareSvg(el, V, las)
      ;(el.barn || []).forEach(function (b) { if (syns(b, V)) { var rad = document.createElement('div'); rad.style.cssText = 'position:relative;display:flex;justify-content:center;max-width:100%'; rad.appendChild(domEl(b, V, { las: las, valt: ctx.valt, riktning: 'h' })); d.appendChild(rad) } })
      return d
    }
    var h = el.riktning === 'h'
    var st = 'display:flex;flex-direction:' + (h ? 'row' : 'column') + ';min-width:0;min-height:0;flex:none;'
    st += h ? 'align-items:' + ({ start: 'flex-start', end: 'flex-end' }[el.justera] || 'center') + ';' : 'align-items:' + ({ center: 'center', end: 'flex-end' }[el.justera] || 'flex-start') + ';'
    if (el.mellan) st += 'gap:' + el.mellan + 'px;'
    var p = el.padding || [0, 0, 0, 0]; st += 'padding:' + p[0] + 'px ' + p[3] + 'px ' + p[2] + 'px ' + p[1] + 'px;'
    if (el.bg) st += 'background:' + cssFarg(el.bg, el.bgAlfa, las) + ';'
    if (el.radie) st += 'border-radius:' + el.radie + 'px;'
    if (el.kant) st += 'box-shadow:inset 0 0 0 ' + el.kant + 'px ' + cssFarg(el.kantFarg || '#ffffff', el.kantAlfa, las) + ';'
    if (el.bredd) st += 'width:' + el.bredd + 'px;'
    if (el.hojd) st += 'height:' + el.hojd + 'px;'
    // en stack utan fast bredd i en lodrät förälder fyller inte ut, men en med luft i sig gör det (som i SwiftUI)
    if (!el.bredd && harFlexLuft(el, 'h') && ctx.riktning !== 'h') st += 'align-self:stretch;'
    if (!el.hojd && harFlexLuft(el, 'v') && ctx.riktning === 'h') st += 'align-self:stretch;'
    if (ctx.riktning && harFlexLuft(el, ctx.riktning === 'h' ? 'h' : 'v')) st += 'flex:1 1 0;'
    d.style.cssText = st
    ;(el.barn || []).forEach(function (b) { if (syns(b, V)) d.appendChild(domEl(b, V, { las: las, valt: ctx.valt, riktning: h ? 'h' : 'v' })) })
    return d
  }
  if (el.typ === 'text') {
    var t = fyllText(el.text, V)
    var fs = el.storlek || 14
    d.textContent = t
    var css = 'font-family:' + (TYPSNITT[el.typsnitt || 'rundad'] || TYPSNITT.standard) + ';font-weight:' + (VIKTER[el.vikt] || 400) + ';font-size:' + fs + 'px;line-height:1.2;color:' + cssFarg(elFarg(el, V), el.alfa, las) + ';min-width:0;flex:0 1 auto;'
    if ((el.rader || 1) === 1) css += 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
    else css += 'display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:' + el.rader + ';overflow:hidden;'
    if (el.justeraText) css += 'text-align:' + el.justeraText + ';'
    d.style.cssText = css
    d.dataset.fs = fs; d.dataset.min = num(el.minSkala) ? el.minSkala : 1
    return d
  }
  if (el.typ === 'ikon') {
    var is = el.storlek || 14
    d.style.cssText = 'flex:none;display:flex;width:' + is + 'px;height:' + is + 'px'
    d.innerHTML = sfSvg(fyllText(el.namn, V), is, cssFarg(elFarg(el, V), el.alfa, las))
    return d
  }
  if (el.typ === 'pil') {
    var ps = el.storlek || 14, gr = pilVinkel(el, V)
    d.style.cssText = 'flex:none;display:flex;width:' + ps + 'px;height:' + ps + 'px'
    d.innerHTML = gr === null ? '' : '<svg width="' + ps + '" height="' + ps + '" viewBox="-10 -10 20 20" aria-hidden="true"><g transform="rotate(' + gr + ')"><path d="M0 -9.5 L5.9 0.5 L1.9 0.5 L1.9 9.5 L-1.9 9.5 L-1.9 0.5 L-5.9 0.5 Z" fill="' + cssFarg(elFarg(el, V), el.alfa, las) + '"/></g></svg>'
    return d
  }
  if (el.typ === 'luft') {
    if (num(el.langd)) d.style.cssText = 'flex:none;' + (ctx.riktning === 'h' ? 'width:' : 'height:') + el.langd + 'px'
    else d.style.cssText = 'flex:1 1 0;min-width:0;min-height:0'
    return d
  }
  if (el.typ === 'graf') { d.style.cssText = 'flex:none;display:flex'; d.innerHTML = grafSvg(el, V, las); return d }
  if (el.typ === 'bild') {
    d.style.cssText = 'flex:none;display:flex'
    if (el.url) { var im = document.createElement('img'); im.src = fyllText(el.url, V); im.alt = ''; im.style.cssText = 'width:' + (el.bredd || 40) + 'px;height:' + (el.hojd || el.bredd || 40) + 'px;object-fit:cover;border-radius:' + (el.radie || 0) + 'px'; d.appendChild(im) }
    return d
  }
  return d
}
function harFlexLuft(el, axel) {
  // finns en luft utan fast längd direkt i stacken längs axeln?
  if (el.typ !== 'stack') return false
  var egen = el.riktning === 'h' ? 'h' : 'v'
  return egen === axel && (el.barn || []).some(function (b) { return b.typ === 'luft' && !num(b.langd) })
}

// Hela widgeten. opt = { enhet, las, valt, inline }
function domWidget(spec, V, opt) {
  var fam = spec.familj || 'small', m = widgetMatt(opt.enhet, fam), las = /^accessory/.test(fam)
  var w = document.createElement('div')
  w.className = 'wv-widget wv-' + fam
  var bg = spec.bakgrund || {}, st = 'position:relative;width:' + m.w + 'px;height:' + m.h + 'px;border-radius:' + m.radie + 'px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;'
  if (las && bg.typ === 'las') st += 'background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);'
  else if (!las && bg.typ === 'farg') st += 'background:' + cssFarg(V.larm && bg.fargLarm ? bg.fargLarm : bg.farg, bg.alfa) + ';'
  else if (!las && bg.typ === 'gradient') st += 'background:linear-gradient(' + (bg.vinkel || 180) + 'deg,' + (bg.farg || '#222') + ',' + (bg.farg2 || bg.farg || '#222') + ');'
  else if (!las) st += 'background:rgba(30,30,32,.55);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);'
  var p = spec.padding || standardPadding(fam)
  st += 'padding:' + p[0] + 'px ' + p[3] + 'px ' + p[2] + 'px ' + p[1] + 'px;'
  if (spec.rot && spec.rot.mellan) st += 'gap:' + spec.rot.mellan + 'px;'
  w.style.cssText = st
  ;((spec.rot && spec.rot.barn) || []).forEach(function (b) { if (syns(b, V)) w.appendChild(domEl(b, V, { las: las, valt: opt.valt, riktning: 'v' })) })
  return w
}

// Efter att widgeten satts in: krymp text med minSkala < 1 tills den får plats (som iOS)
function anpassaText(rot) {
  rot.querySelectorAll('.wv-text').forEach(function (t) {
    var min = parseFloat(t.dataset.min || '1'), fs = parseFloat(t.dataset.fs || '14')
    if (min >= 1) return
    var s = 1
    while (t.scrollWidth > t.clientWidth + 0.5 && s > min) { s = Math.max(min, s - 0.04); t.style.fontSize = (fs * s) + 'px' }
    if (s < 1) t.title = 'Krympt till ' + Math.round(s * 100) + ' %'
  })
}
