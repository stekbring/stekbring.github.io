# Angelradio – USB-protokollet

Så pratar webbsidan med mottagaren. Gäller ReceiverOS 2.1.0 och senare.
Version 2.0.0 och äldre kan bara uppdateras från sidan (via startladdaren), inte ställas in.

Koden finns i `ReceiverOSv2.1/src/main.cpp` (avsnittet "USB-protokoll") och i
webbsidans `js/device.js`.

## Grunder

- Seriell port, **115200 baud**, 8N1. Nanon startar om när porten öppnas.
- Efter start skriver mottagaren: `AR READY ReceiverOS 2.1.0`
- Allt är textrader som slutar med `\n` (`\r\n` går också bra). Längsta rad: 100 tecken.
- Sidan skickar ett kommando i taget och väntar på svaret.
- Svaret är noll eller flera datarader och sist alltid `OK` eller `ERR <text>`.
  Feltexterna är `okant kommando` och `ogiltigt varde`.
- Rader som börjar med `!` är **händelser**. De kan komma när som helst.
- Värden skrivs som `nyckel=värde` utan mellanslag.
- **Namn skickas som hex av Latin-1-byte** (`nameh=446a75706574` = "Djupet"), så att å, ä och ö
  fungerar och mellanslag inte stör. Max 10 tecken.
- Sidan väntar normalt 2 sekunder på svar (3 s för `SAVE`, `TX`, `LOG` och `MEL W`).

## Kommandon

| Kommando | Svar (rader före `OK`) | Vad det gör |
|---|---|---|
| `INFO` | `INFO model=AR-RX fw=2.1.0 hw=2 bat_mv=4120 bat_pct=78 bat_type=1 slots=50 used=7 mel=2 melb=118 namelen=10 clone=0 keys=vol,sig,alen,dim,con,flip,btype` | Grundfakta. `bat_pct=-1` betyder inget batteri (bara USB). `keys` = inställningar som finns. Första `INFO` visar "ANSLUTEN TILL DATORN" på skärmen. |
| `SOUNDS` | `SND idx=0 nameh=…` per ljud. Egna ljud har `custom=1`, tomma platser `empty=1`. | Ljuden 0–3 är inbyggda (Morsekod, Larm 2, Glassbilen, Brandlarm), 4–5 är egna. |
| `GET` | `S vol=8 sig=0 alen=5 dim=15 con=3 flip=0 btype=0` | Alla inställningar. |
| `SET <nyckel> <värde>` | – | Ändrar direkt men sparar inte. |
| `SAVE` | – | Sparar inställningarna i EEPROM. |
| `DEFAULTS` | – | Fabriksinställningar. Sändare, namn och egna ljud finns kvar. |
| `TX` | `T slot=1 code=0xA1B2C3 paused=0 seen=12 nameh=…` per sändare | `seen` = sekunder sedan senast hörd, `-1` = inte sedan start. |
| `TXNAME <plats> <namnhex>` | – | Byter namn (tom = inget namn). |
| `TXDEL <plats>` | – | Tar bort sändaren. Platsen blir ledig, de andra numren ändras inte. |
| `TXPAUSE <plats> <0/1>` | – | En pausad sändare larmar inte. |
| `TXSET <plats> <kod> <paus> [namnhex]` | – | Lägger in en sändare direkt (används när en säkerhetskopia läses in). |
| `PAIR <0/1>` | – | Startar eller stoppar parning. Händelsen `!PAIR` kommer när en sändare sparats. |
| `MON <0/1>` | – | Live-monitor: händelsen `!RX` för allt som tas emot, även okända koder. |
| `RT <0/1>` | – | Räckviddstest, samma som System → Räckviddstest. Händelser `!RT`. Inget larmar under testet. |
| `LOG` | `L ago=300 slot=3 type=fall` per händelse, nyast först | De 8 senaste larmen sedan mottagaren startade. |
| `LOGCLR` | – | Tömmer loggen. |
| `BEEP` | – | Kort pip med nuvarande volym. |
| `PLAY <idx>` / `STOP` | – | Spelar ett ljud från `SOUNDS` en gång. |
| `CAL <mV>` | – | Användaren har mätt batteriet till så här många millivolt. Referensen justeras och sparas direkt. |
| `MEL R <plats>` | `M slot=1 nameh=… data=…` | Läser ett eget ljud (plats 1–2). |
| `MEL N <plats> <namnhex>` | – | Sätter namnet på ett eget ljud. |
| `MEL W <plats> <offset> <datahex>` | – | Skriver data från `offset` (max 32 byte per rad). |

### Inställningar (`GET`/`SET`)

| Nyckel | Värden | Betydelse |
|---|---|---|
| `vol` | 0–10 | Volym (0 = tystast, inte avstängt) |
| `sig` | ljudindex | Larmsignal. Ett tomt eget ljud ger `ERR`. |
| `alen` | 0, 5, 10, 30 | Larmets längd i sekunder. 0 = tills man klickar. |
| `dim` | 0, 10, 15, 30, 60 | Släck skärmen efter så många sekunder. 0 = aldrig. |
| `con` | 1–4 | Ljusstyrka |
| `flip` | 0/1 | Vänd skärmen 180° |
| `btype` | 0/1/2 | 3 × alkaliska / 3 × NiMH / 1 × Li-ion |

Webbsidan visar bara de inställningar som finns i `keys`. Nya inställningar i
framtida versioner läggs till i listan, och sidan har redan rutor för flera av dem
(`sigr`, `beepno`, `remind`, `remints`, `rush`, `flash`, `lowbat`, `relay`, `dbl`).

### Händelser

```
!RX code=0xA1B2C3 slot=1 ch=0 bits=24      slot=0 = okänd sändare
!PAIR slot=8 code=0xA1B2C3
!ALARM slot=3 type=fall
!RT slot=3 pct=92 got=10 exp=11 live=1      en gång per sekund medan sändaren hörs
!RT slot=3 pct=88 got=40 exp=45 live=0 min=72   när det varit tyst i 2 s (slutresultat)
```

### Räckviddstestet

Sändaren upprepar sin kod så länge den sänder. En EV1527-ram är 128 pulslängder,
och RCSwitch avkodar varannan ram eftersom den kräver två lika i rad. Vid 350 µs
pulslängd blir det **cirka 11 paket per sekund**. Mottagaren mäter sändarens
pulslängd och räknar ut hur många paket som borde ha kommit. Procenten är andelen
som faktiskt avkodades.

Ett sekundfönster utan paket räknas bara som 0 % om sändaren hörs igen efteråt.
Annars betyder det att sändaren har slutat.

### Eget ljud (128 byte i EEPROM per plats: namn 10 + data 118)

```
byte 0     format = 1 (allt annat = tom plats)
byte 1     upprepa (används inte – ljudet upprepas så länge larmet låter)
byte 2     tempo i BPM (40–255), ett steg = en sextondel = 15000/BPM ms
byte 3     antal poster N (max 57)
byte 4..   N par: (midi-ton, längd i steg)   midi 0 = paus
```

Frekvens: `f = 440 · 2^((midi − 69) / 12)`. Sidan använder tonerna E5–E7 (76–100).
Sidan skriver först `00` på byte 0 (platsen blir tom), sedan datat och sist
huvudet, så att ett avbrutet försök aldrig ger ett halvt ljud.

### EEPROM-karta (ReceiverOS 2.1)

| Adress | Innehåll |
|---|---|
| 0–9 | volym, larmsignal, (v1), larmlängd, skärmsläckning, ljusstyrka, vänd, batterityp, kalibrering (2 byte) |
| 10–209 | 50 sändarkoder × 4 byte (samma som 2.0) |
| 210–216 | pausade sändare (50 bitar) |
| 220–475 | 2 egna ljud × 128 byte |
| 500 | formatversion: 0x44 = 2.0, 0x45 = 2.1 |
| 501–1000 | 50 namn × 10 byte |

Uppgradering från 2.0 sker automatiskt vid första starten. Sändare, volym och larmsignal behålls.

## Uppdatering

Sidan använder Nanons startladdare (STK500v1). Den provar först 115200 baud
(Optiboot, ny startladdare) och sedan 57600 (gammal). Programmet får vara högst
30 720 byte. EEPROM påverkas inte, så inställningar och sändare finns kvar.
