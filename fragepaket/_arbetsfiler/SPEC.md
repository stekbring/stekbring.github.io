# Spec: frågepaket för Egna10 (egna Smart10-kort)

Smart10 är ett svenskt/finskt frågespel. Varje fråga har **10 alternativ** runt kortet; under varje alternativ
göms ett **facit**. Spelarna tar tur att peka på ett alternativ och säga svaret – rätt ger poäng, fel gör att man åker ut
ur rundan (och tappar rundans poäng), så man kan passa. Därför ska varje fråga ha en blandning av lätta, medelsvåra och
några kluriga alternativ – inte omöjligt, men man ska få tänka och kunna chansa. Frågorna ska vara roliga, gärna med
oväntade vinklar och lite humor i formuleringen, men **faktamässigt helt säkra**.

## Filformat (UTF-8, en textfil per paket)

```
title: Paketets namn
file: NN-filnamn              (samma som filnamnet utan .txt)
color: #rrggbb                (paketets färg i biblioteket)
desc: En mening om vad paketet innehåller.
===
<typ> <betyg> | Frågetext
Alternativ 1 | Facit 1
... exakt 10 rader ...
Alternativ 10 | Facit 10
<tom rad mellan frågor>
```

Se `/home/claude/w/packs/src/01-80-talet.txt` som exempel på format, ton och svårighet.
Separatorn är ` | ` (sista `|` på raden). Använd inte `|` inne i texterna.

## Frågetyper (som i originalspelet)

| typ | facit | exempel |
|---|---|---|
| `sant` | `ja` eller `nej` | "Är djuret ett däggdjur?" – spelarna ska bara välja de sanna. **3–7 st `ja`** av 10. |
| `siffra` | ett exakt tal/årtal, t.ex. `1969`, `8`, `2,42` | "Hur många ben har …?", "Vilket år …?" |
| `ordning` | `1`–`10`, varje siffra exakt en gång | "Rangordna efter storlek (1 = störst)". Skriv alltid vad 1 betyder. Inga oavgjorda lägen. |
| `tid` | århundrade eller decennium, t.ex. `1800-talet`, `1960-talet` | "Från vilket århundrade …?" – samma sorts svar inom en fråga. |
| `farg` | ett färgnamn ur listan nedan | "Vilken färg har …?" – bara entydiga färger. |
| `ovrigt` | kort text | "Vilket land …?", "Vem …?", "Vad heter …?" |

Tillåtna färgnamn för `farg`: röd, blå, grön, gul, orange, lila, rosa, brun, svart, vit, grå, silver, guld, turkos,
ljusblå, mörkblå, beige, vinröd, mörkgrön, ljusgrön.

## Krav

* **Exakt 100 frågor** per paket (blir 50 dubbelsidiga kort).
* Ungefärlig fördelning (anpassa efter ämnet): ~30 `sant`, ~25 `ovrigt`, ~12–15 `siffra`, ~8–10 `ordning`,
  ~6–10 `tid`, ~5–10 `farg`. Använd alla sex typerna.
* **Betyg** 1–5 per fråga = hur bra/rolig frågan är. Appen använder betyget för "bästa hälften" (50) och
  "bästa fjärdedelen" (25). Sikta på ungefär 25 st 5:or, 30 st 4:or, 30 st 3:or, 15 st 2:or. Topp-25 och topp-50 ska
  var för sig vara en bra blandning av typer och delämnen.
* **Längder** (kortet är litet, 11 × 11 cm):
  - Frågetext: helst ≤ 45 tecken, max 60.
  - Alternativ: helst ≤ 22 tecken, max ~32.
  - Facit (text): helst ≤ 12 tecken, max ~18. Tal och årtal är alltid ok.
  - Ett långt ord kan få ett `~` där det får avstavas, t.ex. `Nederlän~derna`.
* Bara tecken i Latin-1 (svenska bokstäver, é, ü, ß, ” – … går bra). Inte ł, ș, č, ğ, ő, grekiska m.m. – skriv utan
  diakriten i stället (Walesa, Ceausescu).
* Inga dubbletter: de 10 alternativen i en fråga ska vara olika, och ingen fråga får upprepa en annan fråga
  (inte heller frågor i `01-80-talet.txt` eller i paket med närliggande ämnen – håll dig till ditt ämne).
* Inga låttexter (bara titlar). Filmrepliker bara korta, välkända rader.
* **Faktakontroll**: använd bara fakta du är helt säker på. Undvik sådant som ändrar sig (rekord, "nuvarande"
  innehavare, invånarantal som byter plats) om inte årtal anges i frågan. Undvik omtvistade fakta och tolkningsfrågor.
  Är du osäker på ett alternativ – byt ut det. Använd WebSearch för att kontrollera allt du inte är 100 % säker på
  (årtal, siffror, rangordningar, vem som gjorde vad).
* `sant`-frågor ska vara entydiga (inga "delvis sant").

## Kontrollera innan du är klar (obligatoriskt)

```
cd /home/claude/w/packs
python3 convert.py --only src/<din fil>.txt --out /tmp/claude-0/-home-claude/cdcfb492-6116-5af4-a5d2-bb12e7f92d1a/scratchpad/chk-<NN>
node fitcheck.js /tmp/claude-0/-home-claude/cdcfb492-6116-5af4-a5d2-bb12e7f92d1a/scratchpad/chk-<NN>
```

* `convert.py` måste säga "Inga formatfel" och 100 frågor / 50 kort.
* `fitcheck.js` visar text som krymper eller inte får plats. **"får inte plats" måste vara noll.** Försök få ner
  "Liten text" genom att korta alternativ/facit. "avstavades automatiskt" är ok men snyggare att korta eller sätta `~`.
* Skriv bara din egen fil i `src/`. Rör inte andra filer.
