/* Intel HEX → minnesavbild. Används av uppdateringen (flash). */
(function (g) {
  'use strict';

  function parseHex(text, maxSize) {
    maxSize = maxSize || 32768;
    const img = new Uint8Array(maxSize).fill(0xff);
    let base = 0, end = 0, sawEof = false, lineNo = 0;
    const lines = String(text).split(/\r?\n/);
    for (const raw of lines) {
      lineNo++;
      const line = raw.trim();
      if (!line) continue;
      if (line[0] !== ':') throw new Error('Rad ' + lineNo + ' börjar inte med ":"');
      const bytes = [];
      for (let i = 1; i < line.length; i += 2) {
        const b = parseInt(line.substr(i, 2), 16);
        if (Number.isNaN(b)) throw new Error('Ogiltigt tecken på rad ' + lineNo);
        bytes.push(b);
      }
      if (bytes.length < 5) throw new Error('För kort rad ' + lineNo);
      const len = bytes[0];
      if (bytes.length !== len + 5) throw new Error('Fel längd på rad ' + lineNo);
      let sum = 0;
      for (const b of bytes) sum = (sum + b) & 0xff;
      if (sum !== 0) throw new Error('Fel kontrollsumma på rad ' + lineNo);
      const addr = (bytes[1] << 8) | bytes[2];
      const type = bytes[3];
      const data = bytes.slice(4, 4 + len);
      if (type === 0x00) {
        const a = base + addr;
        if (a + len > maxSize) throw new Error('Programmet är för stort för minnet (' + maxSize + ' byte)');
        img.set(data, a);
        end = Math.max(end, a + len);
      } else if (type === 0x01) { sawEof = true; break; }
      else if (type === 0x02) base = ((data[0] << 8) | data[1]) << 4;
      else if (type === 0x04) base = ((data[0] << 8) | data[1]) << 16;
      /* 0x03 och 0x05 (startadress) behövs inte för AVR */
    }
    if (!sawEof) throw new Error('Filen saknar slutrad – den verkar avklippt');
    if (end === 0) throw new Error('Filen innehåller inget program');
    return { image: img.subarray(0, end), size: end };
  }

  g.ArHex = { parseHex };
})(typeof window !== 'undefined' ? window : globalThis);
