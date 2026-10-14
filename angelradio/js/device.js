/* Mottagaren över USB: textprotokollet i PROTOKOLL.md.
   SerialDevice och SimDevice (demoläget, sim.js) har samma metoder, så resten av sidan bryr sig inte om vilken som används. */
(function (g) {
  'use strict';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class ArEmitter {
    constructor() { this._ev = {}; }
    on(ev, fn) { (this._ev[ev] = this._ev[ev] || []).push(fn); return () => this.off(ev, fn); }
    off(ev, fn) { this._ev[ev] = (this._ev[ev] || []).filter((f) => f !== fn); }
    emit(ev, data) { for (const f of this._ev[ev] || []) { try { f(data); } catch (e) { console.error(e); } } }
  }

  /* ---------- Hjälpare för protokollet ---------- */
  function parseKV(line) {
    const out = {};
    const re = /(\w+)=("([^"]*)"|\S*)/g;
    let m;
    while ((m = re.exec(line))) out[m[1]] = m[3] !== undefined ? m[3] : m[2];
    return out;
  }
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  function latin1ToHex(s) {
    let h = '';
    for (const ch of String(s)) {
      let c = ch.charCodeAt(0);
      if (c > 255) c = 63; /* ? */
      h += c.toString(16).padStart(2, '0');
    }
    return h;
  }
  function hexToLatin1(h) {
    let s = '';
    for (let i = 0; i + 1 < (h || '').length; i += 2) s += String.fromCharCode(parseInt(h.substr(i, 2), 16));
    return s;
  }
  const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  const hexToBytes = (h) => { const o = []; for (let i = 0; i + 1 < (h || '').length; i += 2) o.push(parseInt(h.substr(i, 2), 16)); return Uint8Array.from(o); };

  class ProtocolError extends Error {}

  class SerialDevice extends ArEmitter {
    constructor(port) {
      super();
      this.kind = 'serial'; this.port = port; this.io = null;
      this.text = ''; this.pending = null; this.queue = Promise.resolve();
      this.dec = new TextDecoder('latin1');
      this.protocol = false; this.ready = false;
    }

    async connect() {
      this.io = new g.ArSerialIO(this.port);
      this.io.onData = (b) => this._onBytes(b);
      this.io.onError = (e) => this.emit('lost', e);
      await this.io.open(115200);
      /* Nanon startar om när porten öppnas – vänta på READY eller som mest 2,5 s */
      const t0 = Date.now();
      while (!this.ready && Date.now() - t0 < 2500) await sleep(50);
      for (let i = 0; i < 3; i++) {
        try { const info = await this.info(); this.protocol = true; return info; } catch (e) { await sleep(300); }
      }
      this.protocol = false;
      return null; /* porten är öppen men programvaran pratar inte protokollet (t.ex. v2.0.0) */
    }

    _onBytes(bytes) {
      this.text += this.dec.decode(bytes, { stream: true });
      let i;
      while ((i = this.text.indexOf('\n')) >= 0) {
        const line = this.text.slice(0, i).replace(/\r$/, '').trim();
        this.text = this.text.slice(i + 1);
        if (line) this._onLine(line);
      }
      if (this.text.length > 4000) this.text = '';
    }

    _onLine(line) {
      this.emit('line', line);
      if (line.startsWith('AR READY')) { this.ready = true; return; }
      if (line[0] === '!') { this._onEvent(line); return; }
      const p = this.pending;
      if (!p) return;
      if (line === 'OK') { this.pending = null; clearTimeout(p.timer); p.res(p.lines); }
      else if (line.startsWith('ERR')) { this.pending = null; clearTimeout(p.timer); p.rej(new ProtocolError(line.slice(3).trim() || 'Fel från mottagaren')); }
      else p.lines.push(line);
    }

    _onEvent(line) {
      const sp = line.indexOf(' ');
      const name = (sp < 0 ? line.slice(1) : line.slice(1, sp)).toUpperCase();
      const kv = parseKV(line);
      const n = (k) => num(kv[k], null);
      switch (name) {
        case 'RX': this.emit('rx', { code: kv.code, slot: n('slot'), ch: n('ch'), bits: n('bits') }); break;
        case 'PAIR': this.emit('pair', { slot: n('slot'), code: kv.code }); break;
        case 'RT': this.emit('rt', { slot: n('slot'), pct: n('pct'), got: n('got'), exp: n('exp'), live: kv.live === '1', min: n('min') }); break;
        case 'ALARM': this.emit('alarm', { slot: n('slot'), type: kv.type || 'fall' }); break;
        case 'CLONE': this.emit('clone', { n: n('n'), of: n('of') }); break;
        case 'BAT': this.emit('bat', { mv: n('mv'), pct: n('pct') }); break;
        default: this.emit('event', { name, kv });
      }
    }

    cmd(text, timeout) {
      const run = () => new Promise((res, rej) => {
        if (!this.io || !this.io.isOpen) { rej(new Error('Inte ansluten')); return; }
        const p = { lines: [], res, rej };
        p.timer = setTimeout(() => { if (this.pending === p) this.pending = null; rej(new Error('Mottagaren svarade inte (' + text.split(' ')[0] + ')')); }, timeout || 2000);
        this.pending = p;
        this.io.write(new TextEncoder().encode(text + '\n')).catch((e) => { clearTimeout(p.timer); this.pending = null; rej(e); });
      });
      const r = this.queue.then(run, run);
      this.queue = r.catch(() => {});
      return r;
    }

    async info() {
      const lines = await this.cmd('INFO', 1200);
      const kv = parseKV(lines.find((l) => l.startsWith('INFO')) || '');
      const pct = num(kv.bat_pct, null);
      return {
        model: kv.model || 'AR-RX', name: kv.model === 'AR-HH' ? 'Handmottagare' : 'Huvudmottagare',
        fw: kv.fw || '?', hw: kv.hw || '?', batMv: num(kv.bat_mv, 0), batPct: pct != null && pct < 0 ? null : pct,
        usb: pct != null && pct < 0, batType: num(kv.bat_type, 0), slots: num(kv.slots, 50), used: num(kv.used, 0),
        melSlots: num(kv.mel, 2), melBytes: num(kv.melb, 118), nameLen: num(kv.namelen, 10),
        keys: kv.keys ? kv.keys.split(',') : null, clone: kv.clone === '1'
      };
    }
    async sounds() {
      const lines = await this.cmd('SOUNDS');
      return lines.filter((l) => l.startsWith('SND')).map((l) => { const kv = parseKV(l); return { idx: num(kv.idx, 0), name: hexToLatin1(kv.nameh) || ('Ljud ' + kv.idx), custom: kv.custom === '1', empty: kv.empty === '1' }; });
    }
    async getSettings() {
      const lines = await this.cmd('GET');
      const s = {};
      for (const l of lines) if (l.startsWith('S ')) { const kv = parseKV(l); for (const k in kv) s[k] = num(kv[k], kv[k]); }
      return s;
    }
    async setLive(obj) {   // ändrar utan att spara (t.ex. för att provlyssna volymen)
      for (const k of Object.keys(obj)) await this.cmd('SET ' + k + ' ' + Number(obj[k]));
    }
    async setSettings(obj) {
      await this.setLive(obj);
      await this.cmd('SAVE', 3000);
    }
    async defaults() { await this.cmd('DEFAULTS', 3000); }
    async listTx() {
      const lines = await this.cmd('TX', 3000);
      return lines.filter((l) => l.startsWith('T ')).map((l) => {
        const kv = parseKV(l);
        return { slot: num(kv.slot, 0), code: kv.code, name: hexToLatin1(kv.nameh), paused: kv.paused === '1', seen: num(kv.seen, -1) };
      });
    }
    async txName(slot, name) { await this.cmd('TXNAME ' + slot + ' ' + latin1ToHex(name.slice(0, 10))); }
    async txDel(slot) { await this.cmd('TXDEL ' + slot); }
    async txPause(slot, on) { await this.cmd('TXPAUSE ' + slot + ' ' + (on ? 1 : 0)); }
    async txSet(t) { await this.cmd('TXSET ' + t.slot + ' ' + t.code + ' ' + (t.paused ? 1 : 0) + ' ' + latin1ToHex((t.name || '').slice(0, 10))); }
    async pair(on) { await this.cmd('PAIR ' + (on ? 1 : 0)); }
    async monitor(on) { await this.cmd('MON ' + (on ? 1 : 0)); }
    async rangeTest(on) { await this.cmd('RT ' + (on ? 1 : 0)); }
    async readLog() {
      const lines = await this.cmd('LOG', 3000);
      return lines.filter((l) => l.startsWith('L ')).map((l) => { const kv = parseKV(l); return { ago: num(kv.ago, 0), slot: num(kv.slot, 0), type: kv.type || 'fall', vol: num(kv.vol, null) }; });
    }
    async clearLog() { await this.cmd('LOGCLR'); }
    async beep() { await this.cmd('BEEP'); }
    async play(idx) { await this.cmd('PLAY ' + idx); }
    async stop() { await this.cmd('STOP'); }
    async calibrate(mv) { await this.cmd('CAL ' + Math.round(mv)); }
    async readMelody(slot) {
      const lines = await this.cmd('MEL R ' + slot);
      const kv = parseKV(lines.find((l) => l.startsWith('M ')) || '');
      return { slot, name: hexToLatin1(kv.nameh), bytes: hexToBytes(kv.data) };
    }
    async writeMelody(slot, name, bytes) {
      // Namnet först, sedan datat i bitar om 32 byte. Huvudet (de fyra första
      // byten) skrivs sist så att ett avbrutet försök aldrig ger ett halvt ljud.
      await this.cmd('MEL N ' + slot + ' ' + latin1ToHex(name.slice(0, 10)));
      const write = (off, end) => this.cmd('MEL W ' + slot + ' ' + off + ' ' + bytesToHex(bytes.subarray(off, end)), 3000);
      await this.cmd('MEL W ' + slot + ' 0 00');   // markera platsen som tom medan vi skriver
      for (let off = 4; off < bytes.length; off += 32) await write(off, Math.min(off + 32, bytes.length));
      await write(0, 4);
    }
    async clone() { await this.cmd('CLONE', 30000); }

    async flash(image, opts) {
      /* Stäng textporten, låt startladdaren ta över, och anslut igen efteråt */
      if (this.io) await this.io.close();
      this.pending = null; this.queue = Promise.resolve(); this.ready = false;
      const res = await g.ArStk500.flashNano(this.port, image, opts);
      await sleep(400);
      const info = await this.connect();
      return { res, info };
    }

    async disconnect() {
      try { if (this.protocol) await Promise.race([this.cmd('MON 0', 400), sleep(450)]); } catch (e) { /* ignoreras */ }
      if (this.io) await this.io.close();
      this.io = null;
    }
  }

  g.ArEmitter = ArEmitter;
  g.ArSerialDevice = SerialDevice;
  g.ArProto = { parseKV, latin1ToHex, hexToLatin1, bytesToHex, hexToBytes };
})(typeof window !== 'undefined' ? window : globalThis);
