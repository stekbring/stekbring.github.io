"""Bygger egna10 och egna20 med biblioteket från originalfilerna (orig10/orig20)."""
import pathlib, re, sys
W = pathlib.Path('/home/claude/w')
LIBJS = (W / 'lib/library.js').read_text() + '\n' + (W / 'lib/cards-extra.js').read_text() + '\n' + (W / 'lib/welcome.js').read_text() + '\n' + (W / 'lib/engine-ext.js').read_text()
PROJS = (W / 'lib/pro-engine.js').read_text() + '\n' + (W / 'lib/pro-ui.js').read_text()
import propatch
OLLE20 = '''/* ===== Olle-märkning – ändra här =====
   OLLE_WATERMARK = true  → svag Olle-logga nere till höger på varje kort (false = av)
   OLLE_PDF_LOGO  = true  → svart Olle-logga nere till höger på PDF:ens framsidor (false = av) */
const OLLE_WATERMARK = true;
const OLLE_PDF_LOGO = true;
'''
OLLE10 = '''/* ===== Olle-märkning – ändra här =====
   OLLE_PDF_LOGO = true → svart Olle-logga nere till höger på PDF:ens framsidor (false = av) */
const OLLE_WATERMARK = false;
const OLLE_PDF_LOGO = true;
'''
WELCOME = (W / 'lib/welcome.html').read_text()
WELCOME10 = WELCOME.replace('<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Kan installeras som app och funkar utan nät</li>', '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Kan installeras som app och funkar utan nät</li>\n          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Pro: flytta och ändra storlek på allt, egna typsnitt, text, bilder och vattenstämpel</li>').replace('<h1>Egna<span class="wl-ten">10</span></h1>', '<h1>Egna<span class="wl-ten">10</span><span class="wl-pro">PRO</span></h1>').replace('<h2>Egna<span class="wl-ten">10</span></h2>', '<h2>Egna<span class="wl-ten">10</span><span class="wl-pro">PRO</span></h2>')
assert WELCOME10.count('wl-pro') == 2 and 'Pro: flytta' in WELCOME10

def ic(n):
    return f'<svg class="ic" aria-hidden="true"><use href="#i-{n}"/></svg>'

def dialog(icons):
    I = (lambda n: ic(n)) if icons else (lambda n: '')
    return f'''<dialog id="dlgLib">
  <form method="dialog">
    <div class="dhead">Bibliotek – frågepaket</div>
    <div class="dbody libbody" id="libBody">
      <aside class="libside">
        <input type="search" id="libSearch" placeholder="Sök bland alla frågor…" aria-label="Sök bland alla frågor" autocomplete="off">
        <div class="libgh">Egna10-paket</div>
        <ul class="libplist" id="libPacks"></ul>
        <p class="help libnote" id="libSiteNote" hidden></p>
        <div class="libgh">Mina paket</div>
        <ul class="libplist" id="libMine"></ul>
        <div class="libside-btns">
          <button type="button" id="libSaveDeck" title="Spara hela din nuvarande kortlek som ett paket i biblioteket">{I("save")}<span>Spara kortleken här</span></button>
          <button type="button" id="libFileBtn" title="Lägg till en eller flera .egna10-filer">{I("file-plus")}<span>Lägg till fil…</span></button>
          <button type="button" id="libDirBtn" title="Lägg till alla .egna10-filer i en mapp">{I("folder")}<span>Öppna mapp…</span></button>
        </div>
        <p class="help" id="libInfo"></p>
        <input type="file" id="libFile" accept=".egna10,.egnatio,.json" multiple hidden>
        <input type="file" id="libDir" webkitdirectory multiple hidden>
      </aside>
      <section class="libmain">
        <button type="button" id="libBack" class="libback">{I("left")}<span>Alla paket</span></button>
        <div id="libHead" class="libhead"></div>
        <ul id="libQs" class="libqs"></ul>
      </section>
    </div>
    <div class="dfoot libfoot">
      <span id="libCount" class="libcount"></span>
      <label class="libshuf" title="Blanda frågorna i stället för att lägga dem paket för paket"><input type="checkbox" id="libShuffle"> Blanda ordningen</label>
      <button type="button" id="libClear">Rensa val</button>
      <button type="button" id="libAdd" class="default" disabled>{I("plus")}<span>Lägg till i kortleken</span></button>
      <button value="cancel">Stäng</button>
    </div>
  </form>
</dialog>

'''

def sub1(s, old, new, label):
    assert s.count(old) >= 1, 'saknas: ' + label
    return s.replace(old, new, 1)

def add_script_and_init(s, pro=False):
    i = s.index('function bindCards()')
    j = s.rfind('<script>', 0, i)
    js = (OLLE10 if pro else OLLE20) + LIBJS + ('\n' + PROJS if pro else '')
    s = s[:j] + '<script>\n' + js + '</script>\n' + s[j:]
    s = sub1(s, 'bindCropper(); bindPdf();\n', 'bindCropper(); bindPdf(); bindLibrary(); bindCardSelect(); bindWelcome(); patchSvgDoc(); bindCredit();' + (' bindPro();' if pro else '') + '\n', 'init')
    # svart Olle-logga på PDF:ens framsidor
    s = sub1(s, "pdfFooter(doc, H, `egna10 · ${deck.name || ''} · ark ${k + 1} av ${idx.length}`);", "pdfFooter(doc, H, `egna10 · ${deck.name || ''} · ark ${k + 1} av ${idx.length}`); ollePageMark(doc, W, H);", 'olle1')
    s = sub1(s, "pdfFooter(doc, H, `egna10 · ${deck.name || ''} · ark ${sheet} av ${sheets} · framsida`);", "pdfFooter(doc, H, `egna10 · ${deck.name || ''} · ark ${sheet} av ${sheets} · framsida`); ollePageMark(doc, W, H);", 'olle2')
    s = sub1(s, "pdfFooter(doc, H, 'egna10 · provutskrift, sida 1 (framsida)');", "pdfFooter(doc, H, 'egna10 · provutskrift, sida 1 (framsida)'); ollePageMark(doc, W, H);", 'olle3')
    s = common_js(s)
    return s

LISTBAR = '''<div class="listbar"><label title="Markera alla kort (Ctrl+A). Shift-klick markerar ett intervall, Ctrl-klick ett i taget. På mobilen: håll in ett kort."><input type="checkbox" id="ckAll"> Alla</label><select id="cardSort" aria-label="Sortera korten"><option value="">Sortera…</option><option value="alpha">Frågetext A–Ö</option><option value="best">Betyg – bäst först</option><option value="worst">Betyg – sämst först</option><option value="pack">Paket</option><option value="type">Frågetyp</option><option value="todo">Saker att kontrollera först</option><option value="random">Slumpvis ordning</option><option value="reverse">Vänd på ordningen</option><option value="undo" disabled>Ångra senaste sortering</option></select></div>
    <div class="selbar" id="selBar" hidden><span id="selInfo"></span><button type="button" id="selDone">Avmarkera</button></div>
'''

def common_js(s):
    s = sub1(s, "ol.innerHTML = state.deck.cards.map((c, ci) => `<li data-i=\"${ci}\"${ci === state.cur ? ' class=\"sel\"' : ''}>${listItemHTML(ci)}</li>`).join('');",
             "ol.innerHTML = state.deck.cards.map((c, ci) => `<li data-i=\"${ci}\" class=\"${ci === state.cur ? 'sel' : ''}${cardSel.ids.has(c.id) ? ' mk' : ''}\">${csCk(ci)}${listItemHTML(ci)}</li>`).join('');", 'renderList')
    s = sub1(s, "  const sel = ol.querySelector('li.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });\n}", "  const sel = ol.querySelector('li.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });\n  csRender();\n}", 'renderList2')
    s = sub1(s, "if (li) li.innerHTML = listItemHTML(state.cur);", "if (li) li.innerHTML = csCk(state.cur) + listItemHTML(state.cur);", 'refresh')
    s = sub1(s, "$('#cardList').addEventListener('click', e => { const li = e.target.closest('li'); if (li) { selectCard(Number(li.dataset.i)); if (isMobile()) setView('editor'); } });", "$('#cardList').addEventListener('click', csListClick);", 'click')
    s = sub1(s, "q.text = String(src.text || ''); q.ring = src.ring || '';", "q.text = String(src.text || ''); q.ring = src.ring || ''; if (Number(src.score) > 0) q.score = Number(src.score); if (src.pack) q.pack = String(src.pack);", 'sanitize')
    s = sub1(s, "      : `<span class=\"ok\">✓ Kortet är komplett på båda sidor.</span>`;\n", "      : `<span class=\"ok\">✓ Kortet är komplett på båda sidor.</span>`;\n    { const ew = $('#edWarn'); if (ew) { ew.innerHTML = warns.length ? $('#warnings').innerHTML : ''; ew.hidden = !warns.length; } }\n", 'warn')
    s = sub1(s, "const nc = newCard(); nc.id = c && c.id || uid();", "const nc = newCard(); nc.id = c && c.id || uid(); if (c && Number(c.score) > 0) nc.score = Number(c.score);", 'cardscore')
    s = sub1(s, "$('#typeHelp').textContent = TYPE_BY_ID[q.type].help;", "$('#typeHelp').textContent = TYPE_BY_ID[q.type].help; csRenderScore();", 'scorerender')
    s = sub1(s, '<span class="cardtitle" id="cardTitle"></span>', '<span class="cardtitle" id="cardTitle"></span>\n      <span class="cardscore" id="cardScore" role="group" aria-label="Betyg för kortet"></span>', 'scoremarkup')
    s = sub1(s, '<label>Frågetyp <select id="qType">', '<div id="edWarn" class="warnings edwarn" hidden></div>\n      <label>Frågetyp <select id="qType">', 'edwarn')
    s = re.sub(r'(<div class="btnrow"><button id="btnLibCards".*?</div>\n)', lambda m: m.group(1) + '    ' + LISTBAR, s, count=1)
    assert 'id="ckAll"' in s
    return s

def build20():
    s = (W / 'orig20/index.html').read_text()
    s = sub1(s, '</defs></svg>', '<symbol id="i-books" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2z"/><path d="M9 3h4v18H9"/><path d="m14.6 4.3 3.8-1 3.5 16.4-3.8 1z"/></symbol>\n</defs></svg>', 'sprite')
    s = sub1(s, '<div class="tb-group g-data">\n', '<div class="tb-group g-data">\n      <button id="btnLib" class="js-lib" title="Färdiga frågepaket och dina egna paket – välj frågor till kortleken">' + ic('books') + '<span>Bibliotek</span></button>\n', 'toolbar')
    m = re.search(r'\n( *)<div class="btnrow"><button id="btnUp".*?</div>\n', s)
    assert m, 'btnrow'
    s = s[:m.end()] + m.group(1) + '<div class="btnrow"><button id="btnLibCards" class="js-lib" title="Hämta frågor från färdiga paket">' + ic('books') + '<span>Hämta från biblioteket</span></button></div>\n' + s[m.end():]
    s = sub1(s, '<div class="busy" id="busy">', dialog(True) + WELCOME + '<div class="busy" id="busy">', 'dialog')
    s = sub1(s, '</style>', (W / 'lib/lib20.css').read_text() + (W / 'lib/welcome20.css').read_text() + '</style>', 'css')
    s = sub1(s, '</head>', '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap">\n</head>', 'font')
    s = s.replace('#btnInstall>span,#btnTheme>span{display:none}', '#btnInstall>span,#btnTheme>span,#btnSettings>span,#btnOpen>span{display:none}',1)
    s = add_script_and_init(s)
    return s

def build10():
    s = (W / 'orig10/index.html').read_text()
    s = sub1(s, '    <button id="btnExportTsv"', '    <button id="btnLib" class="js-lib" title="Färdiga frågepaket och dina egna paket – välj frågor till kortleken">Bibliotek…</button>\n    <button id="btnExportTsv"', 'toolbar')
    m = re.search(r'\n( *)<div class="btnrow"><button id="btnUp".*?</div>\n', s)
    assert m, 'btnrow'
    s = s[:m.end()] + m.group(1) + '<div class="btnrow"><button id="btnLibCards" class="js-lib" title="Hämta frågor från färdiga paket">Hämta från biblioteket…</button></div>\n' + s[m.end():]
    s = sub1(s, '<div class="busy" id="busy">', dialog(False) + WELCOME10 + '<div class="busy" id="busy">', 'dialog')
    s = sub1(s, '</style>', (W / 'lib/lib10.css').read_text() + (W / 'lib/welcome10.css').read_text() + (W / 'lib/pro10.css').read_text() + '</style>', 'css')
    # Pro: flikar i redigeringsrutan
    s = sub1(s, '    <div class="form">\n', '''    <div class="protabs" id="proTabs" role="tablist" aria-label="Vad vill du ändra?">
      <button type="button" role="tab" data-pt="content" aria-selected="true">Innehåll</button><button type="button" role="tab" data-pt="layout" aria-selected="false">Layout</button><button type="button" role="tab" data-pt="items" aria-selected="false">Text och bilder</button><button type="button" role="tab" data-pt="wm" aria-selected="false">Vattenstämpel</button><button type="button" role="tab" data-pt="fonts" aria-selected="false">Typsnitt</button>
    </div>
    <div class="pro-mini pro-cv" id="proMini" data-side="0"></div>
    <div id="proPanes"></div>
    <div class="form">\n''', 'protabs')
    # Pro: namn och PRO vid loggan
    s = re.sub(r'(<span class="brand" title=")egna10 – egna frågekort(">)(<svg class="logo".*?</svg>)egna10(</span>)', lambda m: m.group(1) + 'Egna10 Pro – egna frågekort' + m.group(2) + '<span class="logo-pro">' + m.group(3) + '<span class="pro-badge">PRO</span></span>Egna10' + m.group(4), s, count=1)
    assert 'pro-badge' in s
    s = sub1(s, '<title>Egna10</title>', '<title>Egna10 Pro</title>', 'title')
    s = s.replace('<meta name="apple-mobile-web-app-title" content="Egna10">', '<meta name="apple-mobile-web-app-title" content="Egna10 Pro">')
    s = add_script_and_init(s, pro=True)
    s = propatch.pro_engine(s)
    s = s.replace("pdfFooter(doc, H, `egna10 · ", "pdfFooter(doc, H, `Egna10 Pro · ").replace("pdfFooter(doc, H, 'egna10 · ", "pdfFooter(doc, H, 'Egna10 Pro · ")
    s = s.replace("creator: 'egna10'", "creator: 'Egna10 Pro'")
    return s

def sw(path, version):
    s = (W / path).read_text()
    s = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", s)
    old = "  // Övrigt (ikoner, PDF-verktyget): sparad kopia först, annars nätet."
    new = """  // Frågepaketen i biblioteket: alltid senaste versionen när det finns nät, annars sparad kopia.
  if (url.origin === location.origin && url.pathname.includes('/fragepaket/')) {
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req)) || Response.error(); }
    })());
    return;
  }
""" + old
    assert old in s
    s = s.replace(old, new, 1)
    # sidan själv: matcha inte katalogen fragepaket/ som en sida
    s = s.replace("(url.origin === location.origin && /\\/(index\\.html)?$/.test(url.pathname))", "(url.origin === location.origin && !url.pathname.includes('/fragepaket/') && /\\/(index\\.html)?$/.test(url.pathname))")
    return s

if __name__ == '__main__':
    out = W / 'build'
    (out / 'egna10').mkdir(parents=True, exist_ok=True)
    (out / 'egna20').mkdir(parents=True, exist_ok=True)
    (out / 'egna10/index.html').write_text(build10())
    (out / 'egna20/index.html').write_text(build20())
    (out / 'egna10/sw.js').write_text(sw('orig10/sw.js', 'egna10pro-v1'))
    (out / 'egna20/sw.js').write_text(sw('orig20/sw.js', 'egna20-v9'))
    (out / 'egna10/manifest.webmanifest').write_text((W / 'orig10/manifest.webmanifest').read_text().replace('"name": "Egna10"', '"name": "Egna10 Pro"').replace('"short_name": "Egna10"', '"short_name": "Egna10 Pro"'))
    for f in ['egna10/index.html', 'egna20/index.html', 'egna10/sw.js', 'egna20/sw.js']:
        print(f, (out / f).stat().st_size)
