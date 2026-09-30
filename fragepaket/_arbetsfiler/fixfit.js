// Blandar om alternativen i frågor där texten krymper, tills allt får plats (behåller blandningsreglerna).
const fs = require('fs'), path = require('path');
const html = fs.readFileSync('/home/claude/w/build/egna20/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
global.WIDTHS = JSON.parse(scripts.find(s => s.includes('const WIDTHS')).match(/const WIDTHS = (\{[\s\S]*?\});/)[1]);
global.FONT_SERIF_B64 = ''; global.FONT_SANS_B64 = '';
eval(scripts.find(s => s.includes('const PT = ')) + ';global.buildSide=buildSide;');
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const maxRun = a => { let b = 1, c = 1; for (let i = 1; i < a.length * 2; i++) { if (a[i % a.length] === a[(i - 1) % a.length]) { c++; b = Math.max(b, c); } else c = 1; } return Math.min(b, a.length); };
const asc3 = a => { const v = a.map(x => parseFloat(String(x).replace(',', '.'))); if (v.some(isNaN)) return false; for (let i = 0; i < v.length; i++) if (v[i] < v[(i + 1) % 10] && v[(i + 1) % 10] < v[(i + 2) % 10]) return true; return false; };
function ok(q) {
  const a = q.ans.map(x => q.type === 'sant' ? x.mark : q.type === 'farg' ? x.color : x.text);
  if (q.type === 'sant') { const h = a.slice(0, 5).filter(x => x === 'ja').length; return maxRun(a) <= 3 && h >= 1 && h <= 4; }
  if (['ordning', 'siffra', 'tid'].includes(q.type)) return maxRun(a) <= 2 && !asc3(a);
  return true;
}
const bad = (q, d) => buildSide(q, d, {}).warn.filter(w => !/saknas/.test(w)).length;
const dir = path.join(__dirname, 'out'); let fixed = 0, left = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.egna10'))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const c of d.cards) for (const q of c.sides) {
    if (!bad(q, d)) continue;
    const idx = [...Array(10).keys()]; let done = false;
    for (let t = 0; t < 3000 && !done; t++) {
      for (let i = 9; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const cand = { ...q, alts: idx.map(i => q.alts[i]), ans: idx.map(i => q.ans[i]) };
      if (ok(cand) && !bad(cand, d)) { q.alts = cand.alts; q.ans = cand.ans; done = true; }
    }
    if (done) fixed++; else left++;
  }
  fs.writeFileSync(path.join(dir, f), JSON.stringify(d));
}
console.log(`omblandade ${fixed}, kvar ${left}`);
