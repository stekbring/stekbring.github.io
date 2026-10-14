/* ESP32-stöd: uppdatering med Espressifs esptool-js och en testpanel för ESP32-testbygget.
   esptool-js laddas först när någon faktiskt uppdaterar en ESP32, så sidan blir inte tyngre för Nano-ägare. */
(function (g) {
  'use strict';
  const ESPTOOL_URL = 'https://unpkg.com/esptool-js@0.5.4/bundle.js';
  const APP_ADDR = 0x10000;   // firmware.bin från PlatformIO hamnar i första app-partitionen
  let lib = null;

  async function load() {
    if (!lib) lib = await import(ESPTOOL_URL);
    return lib;
  }

  // Samma gränssnitt som ArStk500.flashNano: (port, image, { onStep, onProgress })
  async function flashEsp32(port, image, opts) {
    opts = opts || {};
    const step = (s) => { if (opts.onStep) opts.onStep(s); };
    const prog = (p, phase) => { if (opts.onProgress) opts.onProgress(p, phase); };
    if (!(image instanceof Uint8Array) || image.length < 1024) throw new Error('Programfilen ser inte ut som en ESP32-fil (.bin).');
    if (image[0] !== 0xE9) throw new Error('Filen är inte en ESP32-programfil. Använd firmware.bin från PlatformIO (.pio\\build\\esp32).');

    step('boot');
    let E;
    try { E = await load(); } catch (e) { throw new Error('Kunde inte hämta uppdateringsverktyget för ESP32. Kontrollera internetanslutningen.'); }
    const log = [];
    const terminal = { clean() {}, writeLine(s) { log.push(s); }, write(s) { log.push(s); } };
    const transport = new E.Transport(port, false);
    const loader = new E.ESPLoader({ transport, baudrate: 460800, terminal, debugLogging: false });
    let chip;
    try {
      try { chip = await loader.main(); }
      catch (e) { throw new Error('ESP32:an svarade inte. Håll inne BOOT-knappen och försök igen. (' + (e.message || e) + ')'); }
      step('write');
      await loader.writeFlash({
        fileArray: [{ data: loader.ui8ToBstr(image), address: APP_ADDR }],
        flashSize: 'keep', flashMode: 'keep', flashFreq: 'keep',
        eraseAll: false, compress: true,
        reportProgress: (i, written, total) => prog(total ? written / total : 0, 'write')
      });
      step('verify');
      prog(1, 'verify');
      await loader.after('hard_reset');
    } finally {
      try { await transport.disconnect(); } catch (e) { /* porten kan redan vara stängd */ }
    }
    return { chip, bytes: image.length, log };
  }

  /* ---------- Testpanel: låtsassändare för ESP32-testbygget ---------- */
  let panel = null;
  function showTestPanel(dev) {
    hideTestPanel();
    panel = document.createElement('div');
    panel.id = 'esp32Test';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'ESP32-test');
    panel.style.cssText = 'position:fixed;left:12px;bottom:84px;z-index:50;background:rgba(20,22,26,.94);color:#eee;' +
      'border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 12px;font:13px/1.35 system-ui,sans-serif;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:calc(100vw - 24px)';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:6px">' +
      '<b>ESP32-test: låtsassändare</b><button type="button" data-x aria-label="Dölj" style="all:unset;cursor:pointer;padding:0 4px;font-size:16px">×</button></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      ['SIM 1|Sändare 1 fäller', 'SIM 2|Sändare 2 fäller', 'SIM 1 60 15|Svag signal 15 s', 'SIM 1 100 15|Stark signal 15 s']
        .map((s) => { const [c, t] = s.split('|'); return '<button type="button" data-c="' + c + '" style="cursor:pointer;padding:5px 9px;border-radius:7px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:inherit;font:inherit">' + t + '</button>'; })
        .join('') + '</div>';
    panel.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-x')) { hideTestPanel(); return; }
      b.disabled = true;
      try { await dev.cmd(b.getAttribute('data-c'), 2000); } catch (e) { console.warn(e); }
      setTimeout(() => { b.disabled = false; }, 400);
    });
    document.body.appendChild(panel);
  }
  function hideTestPanel() { if (panel) { panel.remove(); panel = null; } }

  g.ArEsp32 = { flash: flashEsp32, showTestPanel, hideTestPanel, APP_ADDR };
})(typeof window !== 'undefined' ? window : globalThis);
