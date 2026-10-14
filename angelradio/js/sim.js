/* Demoläget: en låtsasmottagare med samma metoder som SerialDevice.
   Används när ingen mottagare är inkopplad, eller i webbläsare utan Web Serial. */
(function (g) {
  'use strict';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const code = () => '0x' + Math.floor(rnd(0x100000, 0xfffff0)).toString(16).toUpperCase().padStart(6, '0');

  class SimDevice extends g.ArEmitter {
    constructor() {
      super();
      this.kind = 'sim'; this.protocol = true; this.timers = [];
      this.fw = '2.0.0';
      this.batMv = 4060;
      this.settings = { vol: 8, sig: 0, alen: 0, dim: 15, con: 3, flip: 0, btype: 1 };   // samma inställningar som ReceiverOS 2.1.0
      const names = ['Djupet', 'Vassen', 'Udden', 'Mitten', 'Grundet', '', 'Reserv'];   // max 10 tecken
      const now = Date.now();
      this.tx = names.map((n, i) => ({ slot: i + 1, code: code(), name: n, paused: i === 6, seenAt: i === 6 ? null : now - rnd(20, 1800) * 1000 }));
      const slots = [3, 1, 3, 2, 3, 5, 1, 3];   // mottagaren minns de 8 senaste
      this.log = slots.map((sl, i) => ({ at: now - (i * 1900 + rnd(200, 1600)) * 1000, slot: sl, type: 'fall' }));
      this.mel = { 1: g.ArMelody.encode(g.ArMelody.PRESETS[4].mel()), 2: null };
      this.melNames = { 1: 'Fanfar', 2: '' };
    }
    _t(fn, ms) { const id = setTimeout(fn, ms); this.timers.push(id); return id; }
    _i(fn, ms) { const id = setInterval(fn, ms); this.timers.push(id); return id; }
    async connect() {
      await sleep(650);
      /* ett larm efter en stund, så att man ser hur det ser ut */
      this._t(() => { if (this.closed) return; const t = this.tx[1]; t.seenAt = Date.now(); this.log.unshift({ at: Date.now(), slot: t.slot, type: 'fall' }); this.log.length = Math.min(this.log.length, 8); this.emit('alarm', { slot: t.slot, type: 'fall' }); }, 22000);
      this._i(() => { this.batMv = Math.max(3500, this.batMv - 1); }, 15000);
      return this.info();
    }
    async info() {
      await sleep(60);
      return { model: 'AR-RX', name: 'Huvudmottagare', fw: this.fw, hw: '2', batMv: this.batMv, batPct: null, usb: false, batType: this.settings.btype,
        slots: 50, used: this.tx.length, melSlots: 2, melBytes: 118, nameLen: 10, keys: Object.keys(this.settings), clone: false };
    }
    async sounds() {
      await sleep(40);
      const base = [{ idx: 0, name: 'Morsekod' }, { idx: 1, name: 'Larm 2' }, { idx: 2, name: 'Glassbilen' }, { idx: 3, name: 'Brandlarm' }];
      for (let i = 1; i <= 2; i++) base.push({ idx: 3 + i, name: this.melNames[i] || 'Eget ' + i, custom: true, empty: !this.mel[i] });
      return base;
    }
    async getSettings() { await sleep(80); return { ...this.settings }; }
    async setLive(obj) { await sleep(40); this.live = { ...this.settings, ...obj }; }
    async setSettings(obj) { await sleep(300); Object.assign(this.settings, obj); }
    async defaults() { await sleep(400); Object.assign(this.settings, { vol: 8, sig: 0, alen: 5, dim: 15, con: 3, flip: 0, btype: 0 }); }
    async listTx() {
      await sleep(120);
      return this.tx.map((t) => ({ slot: t.slot, code: t.code, name: t.name, paused: t.paused, seen: t.seenAt ? Math.round((Date.now() - t.seenAt) / 1000) : -1 }));
    }
    async txName(slot, name) { await sleep(80); const t = this.tx.find((x) => x.slot === slot); if (t) t.name = name; }
    async txDel(slot) { await sleep(120); this.tx = this.tx.filter((x) => x.slot !== slot); }
    async txPause(slot, on) { await sleep(60); const t = this.tx.find((x) => x.slot === slot); if (t) t.paused = !!on; }
    async txSet(t) { await sleep(40); this.tx = this.tx.filter((x) => x.slot !== t.slot); this.tx.push({ slot: t.slot, code: t.code, name: t.name, paused: t.paused, seenAt: null }); this.tx.sort((a, b) => a.slot - b.slot); }
    async pair(on) {
      await sleep(80);
      clearTimeout(this.pairT);
      if (!on) return;
      this.pairT = this._t(() => {
        let s = 1; while (this.tx.some((x) => x.slot === s)) s++;
        const t = { slot: s, code: code(), name: '', paused: false, seenAt: Date.now() };
        this.tx.push(t); this.tx.sort((a, b) => a.slot - b.slot);
        this.emit('pair', { slot: s, code: t.code });
      }, 2600);
    }
    async monitor(on) {
      await sleep(60);
      clearInterval(this.monT);
      if (!on) return;
      const fire = () => {
        const r = Math.random();
        if (r < 0.7 && this.tx.length) {
          const t = this.tx[Math.floor(Math.random() * this.tx.length)];
          t.seenAt = Date.now();
          this.emit('rx', { code: t.code, slot: t.slot, ch: Math.random() < 0.8 ? 2 : 1, bits: 24 });
        } else this.emit('rx', { code: code(), slot: 0, ch: 0, bits: r < 0.85 ? 24 : Math.floor(rnd(8, 23)) });
      };
      this.monT = this._i(fire, 1700);
      fire();
    }
    async rangeTest(on) {
      await sleep(60);
      clearInterval(this.rtT); clearTimeout(this.rtW);
      if (!on) return;
      /* Scenario: sändare 3 sänder hela tiden medan man går iväg, tappar till slut kontakten. Sedan en kort fällning på sändare 5. */
      let k = 0, minP = 100, tot = 0, n = 0;
      const walk = () => {
        k++;
        const d = 20 + k * 13;
        const base = 100 / (1 + Math.exp((d - 330) / 22));
        const pct = Math.max(0, Math.min(100, Math.round(base + rnd(-3, 2))));
        const exp = 11, got = Math.round(exp * pct / 100);   // cirka 11 paket/s, som RCSwitch avkodar
        if (pct < 8 || k > 40) {
          clearInterval(this.rtT);
          this.emit('rt', { slot: 3, pct: Math.round(tot * 100 / n), got: tot, exp: n, live: false, min: minP });
          this.rtW = this._t(burst, 3500);
          return;
        }
        minP = Math.min(minP, pct); tot += got; n += exp;
        this.emit('rt', { slot: 3, pct, got, exp, live: true });
      };
      const burst = () => {
        this.emit('rt', { slot: 5, pct: 99, got: 11, exp: 11, live: true });
        this.rtW = this._t(() => {
          this.emit('rt', { slot: 5, pct: 91, got: 10, exp: 11, live: true });
          this.rtW = this._t(() => this.emit('rt', { slot: 5, pct: 95, got: 21, exp: 22, live: false, min: 91 }), 2000);
        }, 1000);
      };
      this.rtW = this._t(() => { walk(); this.rtT = this._i(walk, 1000); }, 1200);
    }
    async readLog() {
      await sleep(120);
      return this.log.map((l) => ({ ago: Math.round((Date.now() - l.at) / 1000), slot: l.slot, type: l.type }));
    }
    async clearLog() { await sleep(100); this.log = []; }
    async beep() { await sleep(50); g.ArMelody.tone(2800, 90, (this.live || this.settings).vol / 10); }
    async play(idx) {
      await sleep(50);
      const pv = g.ArMelody.BUILTIN_PREVIEW[idx];
      if (pv) g.ArMelody.play(pv(), { vol: this.settings.vol / 10, reps: 1 });
      else if (idx >= 4 && this.mel[idx - 3]) g.ArMelody.play(g.ArMelody.decode(this.mel[idx - 3]), { vol: this.settings.vol / 10, reps: 1 });
      else g.ArMelody.play(g.ArMelody.PRESETS[2].mel(), { reps: 1, vol: this.settings.vol / 10 });
    }
    async stop() {}
    async calibrate(mv) { await sleep(150); this.batMv = Math.round(mv); }
    async readMelody(slot) { await sleep(80); return { slot, name: this.melNames[slot] || '', bytes: this.mel[slot] || new Uint8Array(0) }; }
    async writeMelody(slot, name, bytes) { await sleep(450); this.mel[slot] = bytes; this.melNames[slot] = name; }
    async clone() { await sleep(100); throw new Error('Stöds inte av den här mottagaren än'); }
    async flash(image, opts) {
      const step = opts.onStep || (() => {}), prog = opts.onProgress || (() => {});
      step('boot'); await sleep(1100);
      step('write');
      for (let i = 1; i <= 40; i++) { await sleep(85); prog(i / 40, 'write'); }
      step('verify');
      for (let i = 1; i <= 20; i++) { await sleep(55); prog(i / 20, 'verify'); }
      this.fw = opts.version || this.fw;
      await sleep(900);
      return { res: { baud: 115200, chip: 'ATmega328P', bytes: image ? image.length : 0 }, info: await this.info() };
    }
    async disconnect() { this.closed = true; for (const t of this.timers) { clearTimeout(t); clearInterval(t); } }
  }

  g.ArSimDevice = SimDevice;
})(typeof window !== 'undefined' ? window : globalThis);
