"""Gör om frågepaketens textfiler (packs/src/*.txt) till .egna10-filer + index.json.

Textformat:
    title: Namn
    file: 01-namn            (filnamn utan .egna10)
    color: #rrggbb
    desc: Kort beskrivning
    ===
    <typ> <betyg 1-5> | Frågetext
    Alternativ | Facit          (10 rader)
    <tom rad>
Typer: sant (facit ja/nej), siffra, ordning (facit 1-10), tid, farg (facit = färgnamn), ovrigt.
"""
import json, pathlib, re, sys, random, collections

HERE = pathlib.Path(__file__).parent
SRC = HERE / 'src'
OUT = HERE / 'out'
COLORS = {
    'röd': '#d32f2f', 'blå': '#1e5bd8', 'grön': '#2e9d3a', 'gul': '#f5d312', 'orange': '#f28c1c', 'lila': '#7b3fa0',
    'rosa': '#f48fb1', 'brun': '#7b4a26', 'svart': '#111111', 'vit': '#ffffff', 'grå': '#8a8a8a', 'turkos': '#1cb5b0',
    'beige': '#e3d3b0', 'guld': '#d4af37', 'silver': '#c0c0c0', 'mörkblå': '#1a2f7a', 'ljusblå': '#7fc4f0',
    'mörkgrön': '#1f5e2e', 'ljusgrön': '#9ad97a', 'vinröd': '#7b1e2e',
}
TYPES = {'sant', 'siffra', 'ordning', 'tid', 'farg', 'ovrigt'}


def parse(path):
    txt = path.read_text(encoding='utf-8')
    head, body = txt.split('\n===\n', 1)
    meta = {}
    for line in head.splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip()
    qs, errors = [], []
    blocks = [b for b in re.split(r'\n\s*\n', body.strip()) if b.strip()]
    for bi, b in enumerate(blocks):
        lines = [l.rstrip() for l in b.strip().splitlines() if l.strip() and not l.strip().startswith('#')]
        if not lines:
            continue
        m = re.match(r'^(\w+)\s+(\d)\s*\|\s*(.+)$', lines[0])
        where = f'{path.name} block {bi + 1} ({lines[0][:50]})'
        if not m:
            errors.append(f'{where}: felaktig rubrikrad'); continue
        typ, score, text = m.group(1), int(m.group(2)), m.group(3).strip()
        if typ not in TYPES:
            errors.append(f'{where}: okänd typ {typ}'); continue
        rows = []
        for l in lines[1:]:
            if '|' not in l:
                errors.append(f'{where}: rad utan | : {l}'); continue
            a, f = l.rsplit('|', 1)
            rows.append((a.strip(), f.strip()))
        if len(rows) != 10:
            errors.append(f'{where}: {len(rows)} alternativ (ska vara 10)')
        alts = [r[0] for r in rows]
        if len(set(a.lower() for a in alts)) != len(alts):
            errors.append(f'{where}: dubbletter bland alternativen')
        ans = [r[1] for r in rows]
        if typ == 'sant':
            bad = [x for x in ans if x not in ('ja', 'nej')]
            if bad: errors.append(f'{where}: sant-facit måste vara ja/nej: {bad}')
            n = ans.count('ja')
            if not 2 <= n <= 8: errors.append(f'{where}: {n} ja av 10 (ska vara 2–8)')
        if typ == 'ordning':
            if sorted(ans, key=lambda x: int(x) if x.isdigit() else 99) != [str(i) for i in range(1, 11)]:
                errors.append(f'{where}: ordning måste vara 1–10 exakt en gång: {ans}')
        if typ == 'farg':
            bad = [x for x in ans if x not in COLORS]
            if bad: errors.append(f'{where}: okända färger {bad}')
        if any(not x for x in ans):
            errors.append(f'{where}: tomt facit')
        qs.append({'type': typ, 'score': score, 'text': text, 'rows': rows, 'where': where})
    return meta, qs, errors


LONG = 99


def shuffled(q, rnd):
    # Blanda alternativens plats runt kortet så att facit inte hamnar i mönster
    # (t.ex. alla sanna till höger eller 1–10 medurs). Undvik långa rader av samma svar.
    rows = list(q['rows'])
    longs = sorted((len(a) for a, _ in rows), reverse=True)
    lim = longs[2] if len(longs) > 2 else 0
    def fits(r):  # de längsta alternativen får plats bäst högst upp och längst ned (plats 1 och 6)
        return all(len(a) <= max(lim, LONG) or i in (0, 5) for i, (a, _) in enumerate(r))
    for _ in range(2000):
        rnd.shuffle(rows)
        if not fits(rows):
            continue
        ans = [f for _, f in rows]
        if q['type'] == 'sant':
            run = max_run(ans)
            half = sum(1 for f in ans[:5] if f == 'ja')
            if run <= 3 and 1 <= half <= 4:
                break
        elif q['type'] in ('ordning', 'siffra', 'tid'):
            if max_run(ans) <= 2 and not ascending_run(ans, 3):
                break
        else:
            break
    return rows


def max_run(a):
    best = cur = 1
    for i in range(1, len(a) * 2):  # runt hela cirkeln
        if a[i % len(a)] == a[(i - 1) % len(a)]:
            cur += 1; best = max(best, cur)
        else:
            cur = 1
    return min(best, len(a))


def ascending_run(a, n):
    try:
        v = [float(x.replace(',', '.')) for x in a]
    except ValueError:
        return False
    for i in range(len(v)):
        if all(v[(i + k) % len(v)] < v[(i + k + 1) % len(v)] for k in range(n - 1)):
            if n >= 3: return True
    return False


def side(q):
    alts, ans = [], []
    for a, f in q['rows']:
        alts.append({'text': a, 'img': ''})
        if q['type'] == 'sant':
            ans.append({'text': '', 'img': '', 'mark': f, 'color': ''})
        elif q['type'] == 'farg':
            ans.append({'text': '', 'img': '', 'mark': '', 'color': COLORS[f]})
        else:
            ans.append({'text': f, 'img': '', 'mark': '', 'color': ''})
    return {'type': q['type'], 'text': q['text'], 'ring': '', 'score': q['score'], 'alts': alts, 'ans': ans}


def pair(qs):
    rest, cards = list(qs), []
    while rest:
        a = rest.pop(0)
        j = next((k for k, b in enumerate(rest) if b['type'] != a['type']), 0)
        b = rest.pop(j) if rest else None
        cards.append((a, b))
    return cards


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='kontrollera bara den här textfilen')
    ap.add_argument('--out', help='annan utmapp')
    a = ap.parse_args()
    global OUT
    if a.out: OUT = pathlib.Path(a.out)
    OUT.mkdir(parents=True, exist_ok=True)
    allerr, index, sigs = [], [], {}
    files = [pathlib.Path(a.only)] if a.only else sorted(SRC.glob('*.txt'))
    for path in files:
        meta, qs, errors = parse(path)
        allerr += errors
        for q in qs:
            sig = q['text'].lower() + '§' + '§'.join(a.lower() for a, _ in q['rows'])
            if sig in sigs:
                allerr.append(f"{q['where']}: samma fråga som {sigs[sig]}")
            sigs[sig] = q['where']
            alts_all = {a.lower() for a, _ in q['rows']}
        # Kontrollera att ingen alternativ-mängd upprepas helt i två frågor
        if len(qs) % 2:
            allerr.append(f'{path.name}: udda antal frågor ({len(qs)}) – varje kort behöver två frågor')
        if len(qs) != 100:
            print(f'OBS {path.name}: {len(qs)} frågor (målet är 100)')
        rnd = random.Random(meta['file'])
        for q in qs:
            q['rows'] = shuffled(q, rnd)
        cards = pair(qs)
        deck = {
            'format': 'egna10', 'version': 1, 'name': meta['title'], 'description': meta.get('desc', ''),
            'color': meta.get('color', ''),
            'label': {'dark': 'EGNA', 'light': '10'}, 'numbering': {'show': True, 'prefix': 'nr.', 'start': 1},
            'cards': [{'id': f"{meta['file']}-{i + 1}", 'sides': [side(a), side(b) if b else side(a)]} for i, (a, b) in enumerate(cards)],
        }
        fn = meta['file'] + '.egna10'
        (OUT / fn).write_text(json.dumps(deck, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        cnt = collections.Counter(q['type'] for q in qs)
        sc = collections.Counter(q['score'] for q in qs)
        print(f"{fn}: {len(qs)} frågor, {len(cards)} kort | typer {dict(cnt)} | betyg {dict(sorted(sc.items()))}")
        index.append({'file': fn, 'name': meta['title'], 'description': meta.get('desc', ''), 'color': meta.get('color', ''),
                      'questions': len(qs), 'cards': len(cards)})
    (OUT / 'index.json').write_text(json.dumps({'format': 'egna10-bibliotek', 'version': 1, 'packs': index}, ensure_ascii=False, indent=1), encoding='utf-8')
    if allerr:
        print('\nFEL:')
        for e in allerr: print('  ' + e)
        sys.exit(1)
    print('\nInga formatfel.')


if __name__ == '__main__':
    main()
