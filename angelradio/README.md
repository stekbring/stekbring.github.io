# Angelradio – webbsidan

Inställningar, sändare, egna larmljud, räckviddstest och uppdatering för Angelradio-mottagaren,
direkt i webbläsaren via USB (Web Serial). Fungerar i Chrome och Edge på dator.
Allt annat (mobil, Safari, Firefox) får demoläget.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och all stil (samma design som Olles Hälsa och egna20) |
| `js/app.js` | Gränssnittet |
| `js/device.js` | Pratar med mottagaren enligt `PROTOKOLL.md` |
| `js/sim.js` | Demoläget, en låtsasmottagare |
| `js/stk500.js` | Uppdatering via Nanons startladdare |
| `js/hex.js` | Läser `.hex`-filer |
| `js/melody.js` | Ljudstudion: melodier, RTTTL och uppspelning |
| `firmware/releases.json` | Versionslistan som visas under Uppdatera |
| `firmware/*.hex` | Programfilerna (läggs till när de är byggda) |
| `PROTOKOLL.md` | Vad ReceiverOS måste kunna för att sidan ska fungera |

## Testa lokalt

Web Serial kräver `https://` eller `localhost`:

```
python -m http.server 8000
```

Öppna sedan `http://localhost:8000`. Lägg till `?demo` i adressen för att starta demoläget direkt.

## Publicera en ny version av programvaran

1. Bygg i PlatformIO: `pio run -e nano` (eller bocken "Build" i VS Code)
2. Kopiera `.pio/build/nano/firmware.hex` till `firmware/ReceiverOS-<version>.hex`
3. Lägg till versionen överst i `firmware/releases.json` (version, datum, fil och nyheter)
4. Pusha stekbring.github.io

Versionsnumret i `releases.json` måste vara samma som `SW_NUMBER` i `config.h`,
annars tror sidan att det finns en nyare version.

## Filer i firmware/

| Fil | Källkod |
|---|---|
| `ReceiverOS-2.0.0.hex` | `angelradiov3/simulation/ReceiverOSv2` (din egen byggda fil) |
| `ReceiverOS-2.1.0.hex` | `angelradiov3/simulation/ReceiverOSv2.1` |
