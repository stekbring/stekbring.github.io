// Kontrollerar att all text i frågepaketen får plats på korten (samma layoutmotor som sidan).
const fs = require('fs'), path = require('path');
const html = fs.readFileSync('/home/claude/w/build/egna20/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const fontScript = scripts.find(s => s.includes('const WIDTHS'));
const core = scripts.find(s => s.includes('const PT = '));
const W = fontScript.match(/const WIDTHS = (\{[\s\S]*?\});/)[1];
global.WIDTHS = JSON.parse(W);
global.FONT_SERIF_B64 = ''; global.FONT_SANS_B64 = '';
eval(core + ';global.buildSide=buildSide;global.fitText=fitText;');
const dir = process.argv[2] || path.join(__dirname, 'out');
let total = 0, bad = 0;
const report = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.egna10')).sort()) {
  const deck = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  deck.cards.forEach((c, ci) => c.sides.forEach((q, si) => {
    total++;
    const w = buildSide(q, deck, {}).warn.filter(x => !/saknas/.test(x));
    if (w.length) { bad++; (report[f] = report[f] || []).push(`  kort ${ci + 1}${si ? 'B' : 'F'} ”${q.text}”: ${w.join(' | ')}`); }
  }));
}
for (const [f, lines] of Object.entries(report)) { console.log(f); lines.forEach(l => console.log(l)); }
console.log(`\n${total} sidor kontrollerade, ${bad} med anmärkningar.`);
