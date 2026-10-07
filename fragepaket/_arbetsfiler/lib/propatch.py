"""Strängändringar i kortmotorn för Egna10 Pro (bara egna10)."""
def R(s, old, new, label, count=1):
    n = s.count(old)
    assert n == count, f'{label}: hittade {n} st, väntade {count}'
    return s.replace(old, new)

def pro_engine(s):
    s = R(s, 'const CX = 55, CY = 55;', 'let CX = 55, CY = 55;', 'cxcy')
    s = R(s, "  const st = styleOf(deck);\n  const P = [], warn = []", "  const st = styleOf(deck), D = proD;\n  const P = [], warn = []", 'D')
    s = R(s, "  P.push({ k: 'path', d: tabPath(b), fill: st.tab });", "  if (!D.tabHide) P.push({ k: 'path', d: tabPath(b), fill: st.tab });", 'tab')
    # etikett
    a = s.index('  // etikett'); e = s.index("  P.push({ k: 'circle', cx: CX, cy: CY, r: G.DISC_R, fill: st.disc });")
    blk = s[a:e].replace("'sans'", 'D.labelFont').replace('if (ld || ll) {', 'if ((ld || ll) && !D.tabHide) {').replace('let pt = 10.5;', 'let pt = D.labelMax;')
    s = s[:a] + blk + s[e:]
    s = R(s, "  P.push({ k: 'circle', cx: CX, cy: CY, r: G.DISC_R, fill: st.disc });\n  P.push({ k: 'circle', cx: CX, cy: CY, r: G.RING_R, fill: st.disc, stroke: ringColor(q), sw: G.RING_W });",
          "  if (!D.discHide) P.push({ k: 'circle', cx: CX, cy: CY, r: G.DISC_R, fill: st.disc });\n  if (!D.ringHide) P.push({ k: 'circle', cx: CX, cy: CY, r: G.RING_R, fill: D.discHide ? 'none' : st.disc, stroke: ringColor(q), sw: G.RING_W });", 'disc')
    s = R(s, "const lay = fitText(qt, 'serif', { shape: { type: 'circle', r: G.Q_R }, maxPt: 12, minPt: 6, maxLines: 7, gap: 1.17 });\n    P.push(textPrim(lay, CX, CY, st.text));",
          "const lay = fitText(qt, D.qFont, { shape: { type: 'circle', r: G.Q_R }, maxPt: D.qMax, minPt: Math.min(D.qMin, D.qMax), maxLines: D.qLines, gap: 1.17 });\n    P.push(textPrim(lay, CX + D.qDx, CY + D.qDy, D.qColor || st.text));", 'q')
    s = R(s, "else if (lay.pt < 8) warn.push(`${sideName}Frågan", "else if (lay.pt < Math.min(8, D.qMax)) warn.push(`${sideName}Frågan", 'qwarn')
    s = R(s, "x: CX - strW('Fråga', 'serif', 9) / 2, y: CY + 1 }]", "x: CX + D.qDx - strW('Fråga', 'serif', 9) / 2, y: CY + D.qDy + 1 }]", 'qph')
    s = R(s, "const lay = fitText(alt.text, 'serif', { shape: { type: 'box', w: i % 5 === 0 ? G.ALT_BOX_W_TB : G.ALT_BOX_W, h: G.ALT_BOX_H }, maxPt: 7.7, minPt: 5,",
          "const lay = fitText(alt.text, D.altFont, { shape: { type: 'box', w: i % 5 === 0 ? G.ALT_BOX_W_TB : G.ALT_BOX_W, h: G.ALT_BOX_H }, maxPt: D.altMax, minPt: Math.min(D.altMin, D.altMax),", 'alt')
    s = R(s, "P.push(textPrim(lay, x, y, st.text));", "P.push(textPrim(lay, x, y, D.altColor || st.text));", 'altc')
    s = R(s, "if (!lay.ok) overflow.push(i + 1); else if (lay.pt < 6.5) shrunk.push(i + 1);", "if (!lay.ok) overflow.push(i + 1); else if (lay.pt < Math.min(6.5, D.altMax)) shrunk.push(i + 1);", 'altw')
    s = R(s, "missingChars(alt.text, 'serif')", "missingChars(alt.text, D.altFont)", 'altm')
    s = R(s, "if (end - G.TICK_A >= 0.8) P.push(", "if (!D.spokesHide && end - G.TICK_A >= 0.8) P.push(", 'tick')
    s = R(s, "if (G.SPOKE_B - s0 >= 1) P.push(", "if (!D.spokesHide && G.SPOKE_B - s0 >= 1) P.push(", 'spoke')
    s = R(s, "stroke: st.line, sw: G.LINE_W", "stroke: D.lineColor || st.line, sw: G.LINE_W", 'linec', 2)
    s = R(s, "    const [ax, ay] = at(i, G.ANS_R);\n    if (q.type === 'sant')", "    const [ax, ay] = atAns(i);\n    if (q.type === 'sant')", 'ans')
    s = R(s, "const lay = fitText(ans.text, 'serif', { shape: { type: 'circle', r: G.ANS_TEXT_R }, maxPt: 7.7, minPt: 4.5,",
          "const lay = fitText(ans.text, D.ansFont, { shape: { type: 'circle', r: G.ANS_TEXT_R }, maxPt: D.ansMax, minPt: Math.min(D.ansMin, D.ansMax),", 'anst')
    s = R(s, "P.push(textPrim(lay, ax, ay, st.text));", "P.push(textPrim(lay, ax, ay, D.ansColor || st.text));", 'ansc')
    s = R(s, "if (!lay.ok) overflow.push('facit ' + (i + 1)); else if (lay.pt < 6)", "if (!lay.ok) overflow.push('facit ' + (i + 1)); else if (lay.pt < Math.min(6, D.ansMax))", 'answ')
    s = R(s, "missingChars(ans.text, 'serif')", "missingChars(ans.text, D.ansFont)", 'ansm')
    s = R(s, "missingChars(q.text, 'serif')", "missingChars(q.text, D.qFont)", 'qm')
    s = R(s, "    const pt = 6.2;\n    P.push({ k: 'text', font: 'serif', pt, color: st.text, lines: [{ s, w: strW(s, 'serif', pt), x: G.NUM_X - strW(s, 'serif', pt), y: G.NUM_Y }] });",
          "    const pt = D.numPt;\n    P.push({ k: 'text', font: D.numFont, pt, color: D.numColor || st.text, lines: [{ s, w: strW(s, D.numFont, pt), x: G.NUM_X - strW(s, D.numFont, pt), y: G.NUM_Y }] });", 'num')
    s = R(s, "    P.push({ k: 'circle', cx: CX, cy: CY, r: G.DISC_R, stroke: '#1d5fa8', sw: 0.3, dash: [1.2, 0.8], overlay: true });\n    for (let i = 0; i < 10; i++) { const [x, y] = at(i, G.ANS_R);",
          "    P.push({ k: 'circle', cx: 55, cy: 55, r: 33, stroke: '#1d5fa8', sw: 0.3, dash: [1.2, 0.8], overlay: true });\n    for (let i = 0; i < 10; i++) { const [x, y] = atBox(i, 45);", 'holes')
    s = R(s, "      const [ax, ay] = at(i, G.ANS_R); P.push({ k: 'hit',", "      const [ax, ay] = atAns(i); P.push({ k: 'hit',", 'hitans')
    s = R(s, "{ k: 'hit', cx: CX, cy: CY, r: G.RING_R, kind: 'q', pos: -1 }", "{ k: 'hit', cx: CX + D.qDx, cy: CY + D.qDy, r: G.RING_R, kind: 'q', pos: -1 }", 'hitq')
    # PDF: skärlinjen följer kortets (ev. ändrade) form
    s = R(s, "if (front && o.cutline) pdfScene(doc, [{ k: 'path', d: cardPath(0), stroke: '#77756a', sw: 0.12 }], T, images);",
          "if (front && o.cutline) pdfScene(doc, [{ k: 'path', d: sc.cut || cardPath(0), stroke: '#77756a', sw: 0.12 }], T, images);", 'cut')
    s = R(s, "const images = await prepareImages(idx.flatMap(i => deck.cards[i].sides), o.mode === 'long');",
          "const images = await prepareImages(idx.flatMap(i => deck.cards[i].sides), o.mode === 'long');\n  await proPrepareRasters(idx);", 'raster')
    # datamodell: behåll Pro-data
    s = R(s, "  if (!out.cards.length) out.cards.push(newCard());\n  return out;", "  out.pro = proCleanDeck(out.pro);\n  if (!out.cards.length) out.cards.push(newCard());\n  return out;", 'sanideck')
    s = R(s, "if (src.pack) q.pack = String(src.pack);", "if (src.pack) q.pack = String(src.pack); if (src.pro) q.pro = proCleanSide(src.pro);", 'saniside')
    # lagring: egen databas och egen synkkanal
    s = R(s, "const r = indexedDB.open('egna10', 1);\n      r.onupgradeneeded = () => r.result.createObjectStore('kv');\n      r.onsuccess = () => { this.db = r.result; res(this.db); };",
          "const r = indexedDB.open('egna10pro', 1);\n      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); this.fresh = true; };\n      r.onsuccess = async () => { this.db = r.result; if (this.fresh) { this.fresh = false; try { await proMigrate(this.db); } catch (e) { /* börjar tomt */ } } res(this.db); };", 'db')
    s = R(s, "new BroadcastChannel('egna10-kortlek')", "new BroadcastChannel('egna10pro-kortlek')", 'bc')
    s = R(s, "localStorage.setItem('egna10.prefs'", "localStorage.setItem('egna10pro.prefs'", 'prefs1')
    s = R(s, "localStorage.getItem('egna10.prefs'", "localStorage.getItem('egna10pro.prefs' ) || localStorage.getItem('egna10.prefs'", 'prefs2')
    return s
