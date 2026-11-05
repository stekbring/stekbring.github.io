# Snaparkiv

Bläddra i din Snapchat-export – chattar, memories, bilder och videor – sorterat efter datum, med klockslag, plats och vem som skickade vad.

**Öppna:** https://stekbring.github.io/snaparkiv/

## Så funkar det
1. Begär din data i Snapchat: *Inställningar → Mina data*. Kryssa i *Exportera JSON-filer* och gärna memories och chattmedia.
2. Ladda ner alla zip-filerna (`mydata~….zip`, `mydata~…-2.zip` …).
3. Öppna sidan och välj alla zip-filerna på en gång – de behöver inte packas upp.

## Integritet
Allt läses lokalt i webbläsaren direkt från zip-filerna på din dator. Inget laddas upp någonstans – sidan är en enda statisk HTML-fil utan server. Bara kartbilderna (OpenStreetMap) och kartbiblioteket hämtas från internet.

Sidan fungerar även offline som fil (spara `index.html` och dubbelklicka).

## Funktioner
- Chattar som pratbubblor, sökning i en eller alla chattar, hoppa till datum
- Memories grupperade per månad, med Snapchats text/filter ovanpå
- Alla media med filter på källa, typ, år och avsändare
- Karta över memories med GPS-position
- Statistik: meddelanden per år, tid på dygnet, mest aktiva chattar
- Mörkt och ljust tema
