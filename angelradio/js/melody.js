/* Melodier: datamodell, kodning till mottagaren, RTTTL och uppspelning i webbläsaren.
   Format i mottagaren (max 128 byte): [ver=1, upprepa, bpm, antal, (midi, steg) × antal]. midi 0 = paus. 1 steg = 1/16-not. */
(function (g) {
  'use strict';
  const LOW = 76, HIGH = 100;            // E5 … E7, piezon låter bäst i den övre delen
  const STEPS = 64, MAX_BYTES = 128, MAX_ENTRIES = Math.floor((MAX_BYTES - 4) / 2);
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
  const stepMs = (bpm) => 15000 / bpm;

  function empty(name) { return { name: name || '', bpm: 160, rep: 3, notes: [] }; }

  /* notes: [{s, len, m}] sorterade, inga överlapp */
  function normalize(mel) {
    mel.notes = mel.notes.filter((n) => n.len > 0 && n.s < STEPS).map((n) => ({ s: n.s, len: Math.min(n.len, STEPS - n.s), m: n.m })).sort((a, b) => a.s - b.s);
    return mel;
  }
  function lengthSteps(mel) { return mel.notes.reduce((e, n) => Math.max(e, n.s + n.len), 0); }

  function entries(mel) {
    const out = []; let t = 0;
    for (const n of normalize(mel).notes) {
      if (n.s > t) out.push([0, n.s - t]);
      out.push([n.m, n.len]); t = n.s + n.len;
    }
    return out;
  }
  function encode(mel) {
    const e = entries(mel);
    if (e.length > MAX_ENTRIES) throw new Error('För många toner och pauser (' + e.length + ', max ' + MAX_ENTRIES + ')');
    const b = [1, Math.max(0, Math.min(255, mel.rep | 0)), Math.max(40, Math.min(255, mel.bpm | 0)), e.length];
    for (const [m, l] of e) b.push(m, l);
    return Uint8Array.from(b);
  }
  function byteCount(mel) { return 4 + 2 * entries(mel).length; }
  function decode(bytes, name) {
    const mel = empty(name);
    if (!bytes || bytes.length < 4 || bytes[0] !== 1) return mel;
    mel.rep = bytes[1]; mel.bpm = bytes[2];
    let t = 0;
    for (let i = 0; i < bytes[3]; i++) {
      const m = bytes[4 + 2 * i], l = bytes[5 + 2 * i];
      if (m) mel.notes.push({ s: t, len: l, m });
      t += l;
    }
    return normalize(mel);
  }

  /* ---------- RTTTL ---------- */
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11, h: 11 };
  function fitRange(m) { while (m < LOW) m += 12; while (m > HIGH) m -= 12; return m; }
  function parseRTTTL(txt) {
    const parts = String(txt).trim().split(':');
    if (parts.length < 3) throw new Error('RTTTL ska ha tre delar: namn:inställningar:toner');
    const name = parts[0].trim().slice(0, 12);
    const def = { d: 4, o: 6, b: 63 };
    for (const kv of parts[1].split(',')) { const [k, v] = kv.split('='); if (k && v) def[k.trim().toLowerCase()] = parseInt(v, 10); }
    const mel = empty(name); mel.bpm = Math.max(40, Math.min(255, def.b || 63));
    let t = 0;
    for (let tok of parts.slice(2).join(':').split(',')) {
      tok = tok.trim().toLowerCase();
      if (!tok) continue;
      const m = tok.match(/^(\d{1,2})?([a-hp])(#?)(\.?)(\d)?(\.?)$/);
      if (!m) throw new Error('Kan inte tolka tonen "' + tok + '"');
      const d = m[1] ? parseInt(m[1], 10) : def.d;
      let len = 16 / d; if (m[4] || m[6]) len *= 1.5;
      len = Math.max(1, Math.round(len));
      if (m[2] !== 'p') {
        const oct = m[5] ? parseInt(m[5], 10) : def.o;
        const midi = fitRange(12 * (oct + 1) + SEMI[m[2]] + (m[3] ? 1 : 0));
        if (t < STEPS) mel.notes.push({ s: t, len, m: midi });
      }
      t += len;
    }
    if (t > STEPS) mel.truncated = true;
    return normalize(mel);
  }
  const DUR = { 16: '1', 8: '2', 12: '2.', 4: '4', 6: '4.', 2: '8', 3: '8.', 1: '16' };
  function toRTTTL(mel) {
    const toks = [];
    const push = (m, len) => {
      while (len > 0) {
        const pick = [16, 12, 8, 6, 4, 3, 2, 1].find((x) => x <= len);
        const d = DUR[pick];
        const dot = d.endsWith('.');
        const dv = dot ? d.slice(0, -1) : d;
        if (!m) toks.push(dv + 'p' + (dot ? '.' : ''));
        else {
          const nm = NAMES[m % 12].toLowerCase(), oct = Math.floor(m / 12) - 1;
          toks.push(dv + nm + (dot ? '.' : '') + oct);
        }
        len -= pick;
      }
    };
    for (const [m, l] of entries(mel)) push(m, l);
    const nm = (mel.name || 'angelradio').replace(/[^a-z0-9 åäö_-]/gi, '').slice(0, 12) || 'angelradio';
    return nm + ':d=16,o=6,b=' + mel.bpm + ':' + toks.join(',');
  }

  /* ---------- Färdiga ljud (egna kompositioner) ---------- */
  function seq(list, bpm, name, rep) {
    const mel = empty(name); mel.bpm = bpm; mel.rep = rep == null ? 3 : rep;
    let t = 0;
    for (const [m, l] of list) { if (m) mel.notes.push({ s: t, len: l, m }); t += l; }
    return normalize(mel);
  }
  function morse(text, m, bpm, name) {
    const code = { F: '..-.', 'Ä': '.-.-', L: '.-..', A: '.-', S: '...', O: '---', N: '-.', P: '.--.' };
    const list = [];
    for (const ch of text) {
      if (ch === ' ') { list.push([0, 4]); continue; }
      const c = code[ch]; if (!c) continue;
      [...c].forEach((sym, i) => { list.push([m, sym === '.' ? 1 : 3]); if (i < c.length - 1) list.push([0, 1]); });
      list.push([0, 3]);
    }
    return seq(list, bpm, name, 2);
  }
  const PRESETS = [
    { id: 'morse', mel: () => morse('FÄLL', 98, 220, 'Morse FÄLL') },
    { id: 'tva', mel: () => seq([[93, 2], [88, 2], [93, 2], [88, 2], [93, 2], [88, 2], [0, 4]], 150, 'Tvåton') },
    { id: 'trippel', mel: () => seq([[96, 1], [0, 1], [96, 1], [0, 1], [96, 1], [0, 5]], 150, 'Trippelpip', 4) },
    { id: 'stig', mel: () => seq([[84, 1], [86, 1], [88, 1], [89, 1], [91, 1], [93, 1], [95, 1], [96, 3], [0, 4]], 200, 'Stigande') },
    { id: 'fanfar', mel: () => seq([[84, 2], [88, 2], [91, 2], [96, 4], [0, 2], [91, 2], [96, 6], [0, 4]], 170, 'Fanfar') },
    { id: 'siren', mel: () => seq([[86, 1], [88, 1], [90, 1], [91, 1], [93, 1], [95, 1], [93, 1], [91, 1], [90, 1], [88, 1], [86, 2]], 220, 'Sirén') },
    { id: 'mjuk', mel: () => seq([[79, 3], [0, 1], [84, 3], [0, 1], [88, 6], [0, 6]], 120, 'Mjuk väckning', 2) },
    { id: 'napp', mel: () => seq([[91, 1], [96, 1], [0, 1], [91, 1], [96, 1], [0, 1], [100, 4], [0, 6]], 180, 'Napp-napp') }
  ];
  /* Förhandslyssning av mottagarens inbyggda ljud (Glassbilen spelas bara i mottagaren) */
  const BUILTIN_PREVIEW = { 0: () => morse('FÄLL', 98, 220, 'Morse FÄLL'), 1: () => seq([[93, 3], [86, 3], [93, 3], [86, 3]], 150, 'Larm 2', 2) };

  /* ---------- Uppspelning ---------- */
  let ctx = null;
  function audio() {
    if (!ctx) { const AC = g.AudioContext || g.webkitAudioContext; ctx = AC ? new AC() : null; }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, ms, vol) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain();
    o.type = 'square'; o.frequency.value = f;
    const v = 0.05 * (vol == null ? 0.7 : vol);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + 0.004);
    gn.gain.setValueAtTime(v, t + ms / 1000 - 0.006); gn.gain.linearRampToValueAtTime(0, t + ms / 1000);
    o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
  }
  function play(mel, opts) {
    opts = opts || {};
    const ac = audio(); if (!ac) return () => {};
    const sm = stepMs(mel.bpm) / 1000, len = Math.max(lengthSteps(mel), 1);
    const reps = Math.max(1, Math.min(opts.reps || mel.rep || 1, 4));
    const vol = opts.vol == null ? 0.7 : opts.vol;
    const t0 = ac.currentTime + 0.05;
    const nodes = [];
    for (let r = 0; r < reps; r++) {
      for (const n of mel.notes) {
        const st = t0 + (r * len + n.s) * sm, d = n.len * sm - 0.012;
        const o = ac.createOscillator(), gn = ac.createGain();
        o.type = 'square'; o.frequency.value = freq(n.m);
        gn.gain.setValueAtTime(0, st); gn.gain.linearRampToValueAtTime(0.05 * vol, st + 0.004);
        gn.gain.setValueAtTime(0.05 * vol, st + Math.max(0.005, d - 0.006)); gn.gain.linearRampToValueAtTime(0, st + Math.max(0.01, d));
        o.connect(gn).connect(ac.destination); o.start(st); o.stop(st + d + 0.02);
        nodes.push(o);
      }
    }
    const total = reps * len * sm * 1000 + 80;
    let raf = 0, stopped = false;
    const tick = () => {
      if (stopped) return;
      const el = (ac.currentTime - t0) / sm;
      if (opts.onStep) opts.onStep(el >= 0 ? el % len : -1);
      if (el < reps * len) raf = requestAnimationFrame(tick);
    };
    if (opts.onStep) raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => { stopped = true; if (opts.onStep) opts.onStep(-1); if (opts.onEnd) opts.onEnd(); }, total);
    return function stop() {
      stopped = true; clearTimeout(timer); cancelAnimationFrame(raf);
      for (const o of nodes) { try { o.stop(); } catch (e) { /* redan slut */ } }
      if (opts.onStep) opts.onStep(-1); if (opts.onEnd) opts.onEnd();
    };
  }

  g.ArMelody = { LOW, HIGH, STEPS, MAX_BYTES, MAX_ENTRIES, freq, noteName, isBlack, stepMs, empty, normalize, lengthSteps, encode, decode, byteCount, parseRTTTL, toRTTTL, PRESETS, BUILTIN_PREVIEW, play, tone, audio };
})(typeof window !== 'undefined' ? window : globalThis);
