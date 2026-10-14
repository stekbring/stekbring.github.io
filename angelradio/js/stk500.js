/* Serieport-hjälp och STK500v1-flashning (Arduino Nano med Optiboot eller gammal startladdare).
   ArSerialIO delas av textprotokollet (device.js) och flashningen nedan. */
(function (g) {
  'use strict';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class ArSerialIO {
    constructor(port) {
      this.port = port; this.buf = []; this.waiters = [];
      this.onData = null; this.err = null; this.isOpen = false;
    }
    async open(baudRate) {
      await this.port.open({ baudRate, bufferSize: 8192 });
      this.isOpen = true; this.err = null; this.buf = [];
      this.writer = this.port.writable.getWriter();
      this.pumpDone = this._pump();
    }
    async _pump() {
      this.reader = this.port.readable.getReader();
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value && value.length) {
            if (this.onData) this.onData(value);
            else for (let i = 0; i < value.length; i++) this.buf.push(value[i]);
            this._wake();
          }
        }
      } catch (e) { this.err = e; this._wake(); if (this.onError) this.onError(e); }
      finally { try { this.reader.releaseLock(); } catch (e) { /* redan släppt */ } }
    }
    _wake() { const w = this.waiters; this.waiters = []; for (const f of w) f(); }
    async write(bytes) {
      if (!(bytes instanceof Uint8Array)) bytes = Uint8Array.from(bytes);
      await this.writer.write(bytes);
    }
    async read(n, timeout) {
      const t0 = Date.now();
      while (this.buf.length < n) {
        if (this.err) throw this.err;
        const left = timeout - (Date.now() - t0);
        if (left <= 0) throw new Error('timeout');
        await new Promise((r) => { const to = setTimeout(r, left); this.waiters.push(() => { clearTimeout(to); r(); }); });
      }
      return this.buf.splice(0, n);
    }
    flush() { this.buf.length = 0; }
    async setSignals(s) { try { await this.port.setSignals(s); } catch (e) { /* alla adaptrar stöder inte RTS */ } }
    async close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      try { if (this.reader) await this.reader.cancel(); } catch (e) { /* ignoreras */ }
      try { await this.pumpDone; } catch (e) { /* ignoreras */ }
      try { this.writer.releaseLock(); } catch (e) { /* ignoreras */ }
      try { await this.port.close(); } catch (e) { /* ignoreras */ }
    }
  }

  /* ---------- STK500v1 ---------- */
  const STK = { OK: 0x10, INSYNC: 0x14, EOP: 0x20, SYNC: 0x30, SIGN: 0x75, ENTER: 0x50, LEAVE: 0x51, ADDR: 0x55, PROG: 0x64, READ: 0x74 };
  const PAGE = 128;                       // ATmega328P
  const MAX_APP = 30720;                  // ryms även med den gamla 2 KB-startladdaren
  const SIGNATURES = { '1e950f': 'ATmega328P', '1e9514': 'ATmega328', '1e9516': 'ATmega328PB' };

  async function cmd(io, bytes, respLen, timeout) {
    io.flush();
    await io.write([...bytes, STK.EOP]);
    const a = await io.read(1, timeout || 600);
    if (a[0] !== STK.INSYNC) throw new Error('Startladdaren svarade inte i takt');
    const data = respLen ? await io.read(respLen, timeout || 600) : [];
    const b = await io.read(1, timeout || 600);
    if (b[0] !== STK.OK) throw new Error('Startladdaren sa nej');
    return data;
  }

  async function trySync(io, tries) {
    for (let i = 0; i < tries; i++) {
      try { await cmd(io, [STK.SYNC], 0, 150); return true; } catch (e) { await sleep(30); }
    }
    return false;
  }

  async function resetToBootloader(io) {
    await io.setSignals({ dataTerminalReady: false, requestToSend: false });
    await sleep(120);
    await io.setSignals({ dataTerminalReady: true, requestToSend: true });
    await sleep(40);
    io.flush();
  }

  /* Flashar image (Uint8Array) till en Nano. port = SerialPort som INTE är öppen.
     opts.onStep(namn), opts.onProgress(0..1, fas) */
  async function flashNano(port, image, opts) {
    opts = opts || {};
    const step = opts.onStep || (() => {}), prog = opts.onProgress || (() => {});
    if (image.length > MAX_APP) throw new Error('Programmet är ' + image.length + ' byte men får vara högst ' + MAX_APP);
    const pages = Math.ceil(image.length / PAGE);
    let lastErr = null;
    for (const baud of opts.bauds || [115200, 57600]) {
      const io = new ArSerialIO(port);
      try {
        step('boot');
        await io.open(baud);
        await resetToBootloader(io);
        if (!(await trySync(io, 12))) { lastErr = new Error('Ingen startladdare på ' + baud + ' baud'); await io.close(); continue; }
        const sig = (await cmd(io, [STK.SIGN], 3)).map((b) => b.toString(16).padStart(2, '0')).join('');
        if (!SIGNATURES[sig]) throw new Error('Okänd processor (' + sig + '). Det här verkar inte vara en Angelradio-mottagare.');
        await cmd(io, [STK.ENTER], 0);
        step('write');
        for (let p = 0; p < pages; p++) {
          const off = p * PAGE, w = off >> 1;
          const data = new Uint8Array(PAGE).fill(0xff);
          data.set(image.subarray(off, Math.min(off + PAGE, image.length)));
          await cmd(io, [STK.ADDR, w & 0xff, (w >> 8) & 0xff], 0);
          await cmd(io, [STK.PROG, 0x00, PAGE, 0x46, ...data], 0, 1500);
          prog((p + 1) / pages, 'write');
        }
        step('verify');
        for (let p = 0; p < pages; p++) {
          const off = p * PAGE, w = off >> 1;
          await cmd(io, [STK.ADDR, w & 0xff, (w >> 8) & 0xff], 0);
          const got = await cmd(io, [STK.READ, 0x00, PAGE, 0x46], PAGE, 1500);
          const n = Math.min(PAGE, image.length - off);
          for (let i = 0; i < n; i++) {
            if (got[i] !== image[off + i]) throw new Error('Kontrollen misslyckades på adress 0x' + (off + i).toString(16) + '. Prova igen.');
          }
          prog((p + 1) / pages, 'verify');
        }
        await cmd(io, [STK.LEAVE], 0);
        await io.close();
        return { baud, chip: SIGNATURES[sig], bytes: image.length };
      } catch (e) {
        lastErr = e;
        try { await io.close(); } catch (e2) { /* ignoreras */ }
        if (!/timeout|takt|Ingen startladdare/.test(e.message)) throw e;
      }
    }
    throw new Error('Fick ingen kontakt med mottagarens startladdare. ' + (lastErr ? '(' + lastErr.message + ')' : ''));
  }

  g.ArSerialIO = ArSerialIO;
  g.ArStk500 = { flashNano, MAX_APP, PAGE };
})(typeof window !== 'undefined' ? window : globalThis);
