# Widgets

Ett webbverktyg för att bygga widgets till Scriptable på iPhone och se dem på en riktig iPhone-skärm medan du bygger. Det finns på **stekbring.github.io/widgets**.

## Flikar

- **Bygg** – fri byggare.
  - Till vänster väljer du storlek (liten, mellan, stor, extra stor och låsskärmens rund, rektangel och rad). Där finns också trädet med widgetens delar: rad, kolumn, text, ikon, vindpil, luft, mätare, graf och bild.
  - I mitten ser du widgeten på vald iPhone-modell, i rätt storlek i punkter. Låsskärmens widgets visas under klockan. Klicka på en del i telefonen för att välja den.
  - Till höger ändrar du den valda delen. Det finns också en lista över värden att skriva in i texter, till exempel `{ti:1}` för källarens temperatur med en decimal.
- **Jordkällaren** – finjustering av låsskärmens hela rad (8 + 9). Klicka på en rad för att ändra bara den raden (storlek, ikoner, punkter, varje mellanrum för sig), eller välj *Alla rader* för det som gäller alla. Det motsvarar `RADER` och `FIN` överst i `Jordkallaren.js`. Textstorleken räknas ut exakt som i skriptet.
- **Projekt** – widgets som sparats i webbläsaren. Du kan också spara dem som fil eller öppna en fil.

## Till telefonen

1. **Kopiera kod** och klistra in den i ett nytt skript i Scriptable. Du kan också **Ladda ner .js** och lägga filen i iCloud Drive → Scriptable.
2. Kör skriptet en gång i appen och logga in med widget-kontot. Det behövs bara om widgeten använder Jordkällarens värden eller synk.
3. Lägg till en Scriptable-widget och välj skriptet.

**Synk via länk:** bocka i *Synk via länk* innan du kopierar koden. Därefter räcker det att trycka **Publicera ändringar**: skriptet på telefonen hämtar det nya utseendet inom 5 minuter. Det kräver admin-inloggning och regeln för `widgetconf` i Firebase (se nedan).

## Textmallar

| Skrivsätt | Resultat |
|---|---|
| `{ti}` | värdet som det är |
| `{ti:1}` | en decimal med komma (6,6) |
| `{upp:tid}` | klockslag (20:38) |
| `{nu:datum}` | datum |
| `{trend:pil}` | ↑ ↓ → |
| `{larm:LARM/}` | "LARM" vid larm, annars inget |
| `{json.namn}` | fält från en egen JSON-adress |

## Firebase-regel

Publicering skriver till `jordkallare/widgetconf/<namn>`. Lägg in följande under `jordkallare` i reglerna. Filen `tempsensor/firebase-regler.json` har det redan.

```json
"widgetconf": {
  ".read":  "auth != null && (auth.token.email == 'olle@jordkallare.se' || root.child('jordkallare/roller/' + auth.uid + '/roll').exists())",
  ".write": "auth != null && (auth.token.email == 'olle@jordkallare.se' || root.child('jordkallare/roller/' + auth.uid + '/roll').val() == 'admin')"
}
```

## Bra att veta

- Ikonerna i webbläsaren är ritade ungefär som Apples SF Symbols. På telefonen visas Apples riktiga ikoner, och vilket SF Symbol-namn som helst fungerar där.
- Låsskärmens widgets färgar iOS själv. Förhandsvisningen härmar det genom att visa allt i vitt med olika genomskinlighet.
- Utan Apples typsnitt (till exempel på Windows) kan texten bli något bredare här än på telefonen.
- Filer: `delad.js` (värden och textmallar, används både här och på telefonen), `motor-scriptable.js` (ritar widgeten i Scriptable), `forhand.js` (ritar den i webbläsaren), `radmotor.js` (raderna 8 + 9, samma kod som i Jordkallaren.js), `jk.js` (Jordkällaren-fliken), `enheter.js` (iPhone-mått), `ikoner.js`, `app.js` och `stil.css`.
