# Angelradio – USB-protokollet

Så pratar webbsidan med mottagaren. ReceiverOS 2.1.0 och senare ska följa det här.
Version 2.0.0 och äldre kan bara uppdateras från sidan (startladdaren), inte ställas in.

## Grunder

- Seriell port, **115200 baud**, 8N1. Nanon startar om när porten öppnas.
- Efter start skriver mottagaren en rad: `AR READY ReceiverOS 2.1.0`
- Allt är textrader som slutar med `\n` (`\r\n` går också bra).
- Sidan skickar ett kommando i taget och väntar på svaret.
- Svaret är noll eller flera datarader, och sist alltid `OK` eller `ERR <text>`.
  Felteksten ska vara ren ASCII.
- Rader som börjar med `!` är **händelser**. De kan komma när som helst, även mitt i ett svar.
- Värden skrivs som `nyckel=värde` utan mellanslag.
- **Namn skickas som hex av Latin-1-byte** (`nameh=446a75706120...`), så att å, ä och ö
  fungerar och mellanslag inte stör. Max 12 tecken. Samma kodning som typsnittet på skärmen använder.
- Sidan väntar normalt 2 sekunder på svar (3 s för `SAVE`, `TX`, `LOG`, 30 s för `CLONE`).

## Kommandon

| Kommando | Svar (datarader före `OK`) | Vad det gör |
|---|---|---|
| `INFO` | `INFO model=AR-RX fw=2.1.0 hw=3 bat_mv=4120 bat_type=1 slots=50 used=7 mel=3 melb=128` | Grundfakta. `bat_pct=` får skickas om mottagaren räknar själv. |
| `SOUNDS` | `SND idx=0 nameh=…` per ljud, `custom=1` för egna, | Listan som visas i Larmsignal. Index 0–2 inbyggda, 3–5 egna. |
| `GET` | `S vol=7 sig=0 …` (en eller flera rader) | Alla inställningar. |
| `SET <nyckel> <värde>` | – | Ändrar i RAM, sparas inte än. |
| `SAVE` | – | Skriver inställningarna till EEPROM. |
| `DEFAULTS` | – | Fabriksinställningar (sändare och egna ljud finns kvar). |
| `TX` | `T slot=1 code=0xA1B2C3 paused=0 seen=12 nameh=…` | Alla parade sändare. `seen` = sekunder sedan senast hörd, `-1` = aldrig. |
| `TXNAME <slot> <namehex>` | – | Byter namn (tom hex = inget namn). |
| `TXDEL <slot>` | – | Tar bort, numret blir ledigt. |
| `TXPAUSE <slot> <0/1>` | – | Pausad sändare larmar inte. |
| `TXSET <slot> <code> <paused> <namehex>` | – | Lägger in en sändare direkt (används vid återställning av säkerhetskopia). |
| `PAIR <0/1>` | – | Startar/stoppar parning. Händelse `!PAIR` när en ny sändare lagts till. |
| `MON <0/1>` | – | Live-monitor. Händelse `!RX` för allt som tas emot. |
| `RT <0/1>` | – | Räckviddstest. Händelser `!RT`. Samma läge som System → Räckviddstest. |
| `LOG` | `L ago=300 slot=3 type=fall vol=7` | Händelselogg, nyast först. `type` = `fall`, `rush`, `lowbat`, `start`. |
| `LOGCLR` | – | Tömmer loggen. |
| `BEEP` | – | Kort pip med nuvarande volym. |
| `PLAY <idx>` / `STOP` | – | Spelar ett av ljuden i `SOUNDS`. |
| `CAL <mV>` | – | Användaren har mätt batteriet till så här många millivolt. Justera `VCC_MV`-faktorn och spara. |
| `MEL R <slot>` | `M slot=1 nameh=… data=01030AA0…` | Läser ett eget ljud (slot 1–3). |
| `MEL W <slot> <datahex> <namehex>` | – | Skriver ett eget ljud. |
| `MEL P <datahex>` | – | Spelar en melodi direkt utan att spara. |
| `CLONE` | – | Skickar alla aktiva sändare till handmottagaren. Händelse `!CLONE n=3 of=7` per sändare. |

### Inställningar (`GET`/`SET`)

| Nyckel | Värden | Betydelse |
|---|---|---|
| `vol` | 0–10 | Volym |
| `sig` | ljudindex | Larmsignal vid fäll |
| `sigr` | ljudindex | Signal vid rusning |
| `alen` | 0, 5, 10, 30 | Larmets längd i sekunder, 0 = tills man klickar |
| `beepno` | 0/1 | Pip ut spöets nummer |
| `remind` | 0/1 | Påminnelse om okvitterat larm |
| `remints` | 15, 30, 60, 120 | Påminnelseintervall i sekunder |
| `rush` | 0/1 | Larma vid rusning |
| `flash` | 0/1 | Blinkande skärm vid larm |
| `dim` | 0, 10, 15, 30, 60 | Släck skärmen efter så många sekunder, 0 = aldrig |
| `con` | 1–4 | Ljusstyrka (SSD1306-kontrast) |
| `flip` | 0/1 | Vänd skärmen 180° |
| `btype` | 0/1/2 | Alkaliska / NiMH / Litium |
| `lowbat` | 0/1 | Varna vid lågt batteri |
| `relay` | 0/1 | Vidaresänd larm till handmottagaren |
| `dbl` | 0/1 | Kräv två mottagna paket innan larm |

Okända nycklar ska ge `ERR`, så att sidan märker om versionerna inte passar.

### Händelser

```
!RX code=0xA1B2C3 slot=1 ch=2 bits=24     slot=0 = okänd sändare, ch 1 = rusning, 2 = fäll
!PAIR slot=8 code=0xA1B2C3
!RT slot=3 pct=92 got=22 exp=24 live=1     en gång per sekund medan sändaren hörs
!RT slot=3 pct=88 got=0 exp=0 live=0 min=41  när det varit tyst ~0,3 s (slutresultat)
!ALARM slot=3 type=fall
!CLONE n=3 of=7
!BAT mv=4100 pct=78
```

### Eget ljud (128 byte i EEPROM per plats)

```
byte 0     format = 1
byte 1     upprepningar (0 = så länge larmet låter)
byte 2     tempo i BPM (40–255), ett steg = en sextondel = 15000/BPM ms
byte 3     antal poster N (max 62)
byte 4..   N par: (midi-ton, längd i steg)   midi 0 = paus
```

Frekvens: `f = 440 · 2^((midi − 69) / 12)`. Sidan använder tonerna E5–E7 (76–100).

## Uppdatering

Sidan använder Nanons vanliga startladdare (STK500v1) och provar först 115200 baud
(Optiboot, ny startladdare), sedan 57600 (gammal). Programmet får vara högst 30 720 byte.
EEPROM påverkas inte, så inställningar och sändare finns kvar. Om EEPROM-layouten ändras
mellan versioner ska den nya programvaran flytta över värdena själv, eftersom sidan bara lägger
tillbaka säkerhetskopian när något faktiskt har försvunnit.

Lägg den byggda filen (`.pio/build/nano/firmware.hex`) i `firmware/` med namnet från
`firmware/releases.json`, och lägg till en rad med versionsnummer, datum och nyheter där.
