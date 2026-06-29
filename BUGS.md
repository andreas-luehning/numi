# Numi – Bug & UX Report

---

## Kritische Bugs (Logik / Datenverlust)



---

### B-03 · Stufe "Alles gemischt bis 20" enthält kein Übergang-Rechnen
**Bereich:** Aufgabengenerator  
**Problem:** Stufe 9 ("Alles gemischt bis 20") nutzt nur `[gP10, gM10, gP20, gM20]` — Aufgaben mit Zehnübergang (`gP20Z`, `gM20Z`) fehlen komplett.  
**Ursache:** `app.js:241`: `gen: () => pickFn([gP10, gM10, gP20, gM20])()` — die Übergang-Generatoren wurden vergessen.  
**Fix-Richtung:** `gP20Z` und `gM20Z` in die Liste aufnehmen.

---

### B-04 · `gP20`: deterministischer Wert wenn a = 19
**Bereich:** Aufgabengenerator  
**Problem:** Wenn `a = 19`, ist `oa = 9`, also `b = rand(1, 9 - 9) = rand(1, 0)`. `rand(a, b)` mit `b < a` gibt immer `a` zurück (wegen `Math.floor(0) + 1 = 1`). Damit ist `b` bei `a = 19` immer `1` — nie zufällig.  
**Ursache:** `app.js:131–139`, `app.js:86` (rand-Funktion).  
**Fix-Richtung:** `a` auf `rand(10, 17)` begrenzen oder den Randfall im Generator abfangen.

---

### B-05 · `gM10` kann Ergebnis 0 liefern
**Bereich:** Aufgabengenerator  
**Problem:** `b = rand(1, a)` bedeutet `b` kann gleich `a` sein → Ergebnis `0`. Für Erstklässler ist „Minus-Null" konzeptuell ungewöhnlich und womöglich nicht Lehrplan-konform.  
**Ursache:** `app.js:120–129`.  
**Fix-Richtung:** `b = rand(1, a - 1)` verwenden (Ergebnis mindestens 1).

---

### B-06 · Sitzungsergebnisse (Reihenfolge) gehen beim Abschluss verloren
**Bereich:** Datenhaltung  
**Problem:** `sessionRef.current.results` (Array mit true/false je Aufgabe) wird nirgendwo dauerhaft gespeichert und auch nicht an `report` übergeben. Damit ist die chronologische Information sofort weg — auch für die Dots (→ B-01).  
**Ursache:** `app.js:700–721` (finishSession).

---

## Mittlere Bugs (UX / Darstellung)

### B-07 · 🏠-Button fehlt Schatten (sieht billig aus)
**Bereich:** Report-Screen  
**Problem:** Der "Zurück zur Startseite"-Button (🏠) benutzt die Klasse `zh-ghost`, der komplett kein `box-shadow` hat. Alle anderen interaktiven Elemente haben den charakteristischen 3D-Schatten — dieser Button fällt optisch durch.  
**Ursache:** `.zh-ghost` in `app.js:1252` hat keinen `box-shadow` und keinen `:active`-Effekt.  
**Fix-Richtung:** `box-shadow:0 6px 0 #C9BFF0` + `:active`-Regel hinzufügen.

---

### B-08 · "Fertig"-Button zu unscheinbar
**Bereich:** Play-Screen  
**Problem:** Der "‹ Fertig"-Button ist komplett transparent (`background:transparent`) und hat keinen Rahmen oder Schatten. Er wirkt nicht wie ein Button, sondern wie ein Textlink — besonders auf kleinen Bildschirmen schwer zu treffen und kaum sichtbar.  
**Ursache:** `.zh-back` in `app.js:1183`.  
**Fix-Richtung:** Leichte Hintergrundfarbe und Schatten wie bei anderen Buttons; evtl. als Pill gestalten.

---

### B-09 · Hint-Text bricht bei langen Sätzen schlecht um
**Bereich:** Hilfe-Box (Play-Screen)  
**Problem:** `.zh-hinttext` hat kein `word-break`, kein `overflow-wrap` und kein `hyphens`. Lange Formeln wie "Erst bis zur 10: 17 − 7 = 10. Dann 10 − 3 = 7." brechen je nach Bildschirmbreite an ungünstigen Stellen um (z. B. mitten in einer Zahl oder zwischen Operator und Zahl).  
**Ursache:** `app.js:1204` (CSS).  
**Fix-Richtung:** `overflow-wrap: break-word` + `hyphens: auto` (lang=de) auf `.zh-hinttext` setzen; alternativ Hint in strukturiertem HTML statt als langen String ausgeben.

---

### B-10 · Stufenname in "Empfehlung" bricht bei langen Namen
**Bereich:** Home-Screen  
**Problem:** `.zh-rectext strong` zeigt den vollen Stufennamen (z. B. "Plus bis 20 (ohne Übergang)") in 21px bold. Auf Geräten mit ~360px Breite bricht der Name mitten im Wort oder nach der öffnenden Klammer um.  
**Ursache:** `app.js:1169`. Kein `line-clamp`, kein `word-break`, kein `hyphens`.  
**Fix-Richtung:** `hyphens: auto` + ggf. `font-size: clamp(16px, 4vw, 21px)`.

---

### B-11 · Konfetti auch bei schlechten Ergebnissen
**Bereich:** Report-Screen  
**Problem:** Konfetti erscheint immer auf dem Bericht (`show={true}`), auch wenn das Kind z. B. nur 3 von 20 Aufgaben richtig beantwortet hat.  
**Ursache:** `app.js:908`: `<Confetti show={true} />` — kein Schwellwert.  
**Fix-Richtung:** Konfetti nur zeigen wenn z. B. `r.correct / r.done >= 0.7` oder `r.done >= 10`.

---

### B-12 · Sprachausgabe wird beim Seitenwechsel nicht abgebrochen
**Bereich:** Sprachausgabe  
**Problem:** Wenn das Kind beim Bericht-Vorlesen den "Nochmal"-Button drückt, läuft die Sprachausgabe weiter während die neue Sitzung schon läuft. `speechSynthesis.cancel()` wird nur beim *Starten* einer neuen Äußerung aufgerufen, nicht beim Verlassen des Report-Screens.  
**Ursache:** `app.js:694–697` (speak), `startSession` ruft kein `cancel` auf.  
**Fix-Richtung:** Am Anfang von `startSession` `window.speechSynthesis.cancel()` aufrufen.

---

### B-13 · Report-Dots: Korrekte Dots übersteigen sichtbares Maximum
**Bereich:** Report-Screen  
**Problem:** Wenn `r.correct > 40` (möglich bei langen Sitzungen), werden alle 40 sichtbaren Punkte grün — obwohl es vielleicht Fehler gab. Der Nutzer sieht keine roten Punkte, denkt alles war perfekt.  
**Ursache:** `i < r.correct ? "g" : "e"` mit `length = Math.min(r.done, 40)` — wenn `correct >= 40`, sind alle Punkte grün, egal was.  
**Abhängig von:** B-01, B-02.

---

### B-14 · `getHint` für Subtraktion: falsche Rechnung bei a % 10 === 0
**Bereich:** Hilfe-Hint  
**Problem:** Für `a = 20` (theoretisch möglich wenn Generatoren geändert werden): `oa = 0`, `0 < b` → Hint-Zweig "über den Zehner" wird gewählt. `down = a - 10 = 10`, `rest = b - down = b - 10`. Wenn `b < 10`, ist `rest` negativ → Hint zeigt "10 − -5 = 15" (falsch).  
**Ursache:** `app.js:267–271`. Derzeit durch Generatoren abgefangen (max a=19), aber fragil beim Ändern der Stufen.

---

### B-15 · Play-Screen: `problem` kann null sein beim ersten Render
**Bereich:** Play-Screen  
**Problem:** `startSession` ruft `newProblem()` (setzt `setProblem(...)`) und dann `setScreen("play")` auf. Beide sind React-State-Updates. Falls React die beiden Updates in seltenen Fällen nicht batcht (z. B. in Event-Handlern in React 17), rendert der Play-Screen mit `problem = null` → Crash bei `p.options.map(...)`.  
**Ursache:** `app.js:675–687` (startSession), `app.js:1075`.  
**Fix-Richtung:** Guard: `if (!problem) return null;` am Anfang des Play-Screen-Zweigs.

---

### B-16 · Streak und Streak-Meldung doppeln sich
**Bereich:** Play-Screen  
**Problem:** Sowohl die `.zh-streakbar` (immer sichtbar) als auch `.zh-streakmsg` zeigen Streak-Informationen an. Bei einer Bonusmeldung ("🔥 10 in Folge! +5 ⭐") stehen zwei fast gleiche Texte kurz übereinander.  
**Ursache:** `app.js:1144–1146`.  
**Fix-Richtung:** `.zh-streakbar` während einer aktiven Bonusmeldung ausblenden oder Meldung in die Bar integrieren.

---

### B-17 · `zh-bob`-Animation auf Maskottchen im Play-Screen störend
**Bereich:** Play-Screen / Accessibility  
**Problem:** Das Maskottchen bobt dauerhaft auf dem Play-Screen während einer Rechenaufgabe. Das kann ablenkend sein und löst auch bei `prefers-reduced-motion` eine Ausnahme aus — die `@media`-Regel am Ende setzt die Animation korrekt auf `none`, aber nur wenn der User das im System eingestellt hat.  
**Ursache:** `app.js:1271` (`.zh-bob`), `app.js:1279` (media query).

---

### B-18 · Fortschritt-Balken steht nach `minutes = 0` bei 0 % — nie sichtbar
**Bereich:** Play-Screen  
**Problem:** Wenn "Aus" (0 Minuten) gewählt ist, wird `timePct = 0` immer, und der Balken wird mit `minutes > 0 &&` korrekterweise nicht gerendert. Aber der Timer läuft weiter (`useEffect` mit `minutes === 0` wird explizit übersprungen). Kein Fehler, aber wenn auf 0 zurückgeschaltet wird während eine Sitzung läuft, stoppt der Timer sofort — `elapsed` bleibt stehen.  
**Ursache:** `app.js:665–668`.  
**Hinweis:** Kein Showstopper, aber unklares Verhalten beim Live-Wechsel der Einstellung.

---

### B-19 · Keine visuelle Rückmeldung beim Einzel-Task-Übergang (1350 ms Lücke)
**Bereich:** Play-Screen  
**Problem:** Nach einer richtigen Antwort wartet die App 1350 ms mit `setTimeout(advance, 1350)`. In dieser Zeit ist der Button `disabled`, aber keine Ladeanimation oder Fortschrittshinweis zeigt dem Kind, dass gleich die nächste Aufgabe kommt. Auf langsamen Geräten wirkt die App "eingefroren".  
**Ursache:** `app.js:759`.

---

### B-20 · `zh-repdots` `max-width: 280px` zu eng für viele Punkte
**Bereich:** Report-Screen  
**Problem:** Der Punkt-Container ist auf `max-width: 280px` begrenzt. Bei 40 Punkten (22px + 6px Gap) passen genau 10 pro Zeile. Auf Geräten <280px (iPhone SE, 320px Breite − Padding) wird der Container noch enger, Punkte werden gequetscht.  
**Ursache:** `app.js:1225` (`.zh-repdots`).  
**Fix-Richtung:** `max-width` auf `min(320px, 90vw)` setzen und `gap` responsiv machen.

---

### B-21 · `makeOptions`: `answer + 10` als Distractor außerhalb max wird ignoriert, nicht ersetzt
**Bereich:** Aufgabengenerator  
**Problem:** `near`-Array enthält `answer + 10` und `answer - 10`. Bei kleinen Antworten (z. B. `answer = 3`, `max = 10`) werden `13` und `-7` gefiltert (korrekt), aber das `near`-Array wird dann kürzer — es fehlen sinnvolle Distraktoren in der Nähe der richtigen Antwort. Als Fallback wird `rand(0, max)` genutzt, der zufällig weit entfernte Werte produzieren kann.  
**Ursache:** `app.js:97–108`.

---

### B-22 · Kein Schutz gegen Doppelklick auf Antwort-Button
**Bereich:** Play-Screen  
**Problem:** `handlePick` prüft zwar `if (status === "right") return;`, aber zwischen dem ersten Klick und dem State-Update (React-Render) kann bei sehr schnellem Doppeltippen `status` noch "idle" sein. Das führt dazu, dass `sessionRef.current.results.push(firstTry)` zweimal aufgerufen wird — eine Aufgabe zählt doppelt.  
**Ursache:** `app.js:729–765`.  
**Fix-Richtung:** Lokale `isProcessing`-Ref nutzen und am Anfang von `handlePick` setzen.

---

### B-23 · `computeUnlocked` wird bei jedem Render neu berechnet
**Bereich:** Performance  
**Problem:** `const unlocked = computeUnlocked(save.stages)` wird direkt in `App()` aufgerufen (`app.js:788`), also bei jedem State-Update neu berechnet (auch bei nicht-relevanten State-Änderungen wie `elapsed` oder `streak`). Bei 60 fps Timern (Timer-Interval jede Sekunde) ist das vertretbar, aber unnötig.  
**Fix-Richtung:** `useMemo(() => computeUnlocked(save.stages), [save.stages])`.

---

### B-24 · `Header` als innere Funktion — wird bei jedem Render neu erstellt
**Bereich:** Performance / React-Antipattern  
**Problem:** `const Header = ({ showGear }) => ...` wird innerhalb von `App()` definiert (`app.js:791`). Damit ist `Header` bei jedem Render eine neue Funktion, React kann keine Komponente memorieren, und alle internen Hooks (falls später hinzugefügt) würden Probleme verursachen.  
**Fix-Richtung:** `Header` als separate Top-Level-Funktion auslagern und Props übergeben.

---

### B-25 · `Styles`-Komponente in jedem Screen neu gemountet
**Bereich:** Performance / DOM  
**Problem:** Jeder `if (screen === ...)` Block returned ein komplett neues React-Element-Tree inklusive `<Styles />`. Das bedeutet, das `<style>`-Tag wird bei jedem Screenwechsel neu erstellt und in den DOM eingefügt, selbst wenn sich der Inhalt nicht ändert.  
**Fix-Richtung:** `<Styles />` einmalig am Root-Level rendern, außerhalb der Screen-Bedingungen.

---

## Geringfügige Issues

### B-26 · Keine `aria-live`-Region für Streak-Meldung
**Bereich:** Accessibility  
**Problem:** Die Streak-Meldung (`zh-streakmsg`) erscheint und verschwindet visuell, wird aber nicht als Live-Region für Screen-Reader angekündigt.  
**Fix-Richtung:** `aria-live="polite"` auf dem Container.

---

### B-27 · `gM20Z`: `a > 20`-Bedingung im While ist unerreichbar
**Bereich:** Code-Qualität  
**Problem:** `while (a < 11 || a > 20)` — aber `a = r + b` mit `r ≤ 9` und `b ≤ 9` ergibt maximal 18. Die `a > 20`-Prüfung ist toter Code.  
**Ursache:** `app.js:165–177`.

---

### B-28 · Kein visueller Hinweis bei "Ohne Zeitlimit"-Modus wann Sitzung endet
**Bereich:** UX  
**Problem:** Wenn Zeitlimit auf "Aus" gestellt ist, gibt es keinen Balken und keinen anderen Indikator. Das Kind weiß nicht, wie lange die Sitzung dauert oder dass sie beliebig lang ist. Die einzige Option zum Beenden ist der "Fertig"-Button (der ohnehin schwer zu sehen ist → B-08).

---

### B-29 · Sprachmeldung bei neuem Freund nennt immer nur den ersten
**Bereich:** Sprachausgabe  
**Problem:** `const fr = newFriends.length ? \` Du hast einen neuen Freund: ${CREATURES[newFriends[0]].name}.\` : ""` — wenn mehrere Freunde gleichzeitig freigeschaltet werden (möglich wenn mehrere Stufen auf einmal abgeschlossen wurden), nennt die Sprachausgabe nur den ersten.  
**Ursache:** `app.js:723`.

---

## Backlog

### Features

### F-01 · Verliebte Zahlen als Zehner-Hilfe erklaeren
**Bereich:** Hilfe-Box / Lerninhalt  
**Einordnung:** Passt am besten in die Hilfe bei Plus-Aufgaben bis 10 und beim Zehneruebergang. Es ist kein eigener Rechenmodus noetig, sondern eine Strategie-Erklaerung genau dann, wenn sie zur Aufgabe passt.  
**Idee:** In der bestehenden Hilfe sichtbar machen, dass zwei Zahlen "verliebte Zahlen" sind, wenn sie zusammen genau 10 ergeben. Beim Zehnerstopp wird die passende Partnerzahl zur 10 genannt.  
**Ziel:** Zahlzerlegung der 10 trainieren, Kopfrechnen automatisieren und Zehneruebergaenge vorbereiten.  
**Zahlenpaare:** 0 + 10, 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5.  
**Moegliche Umsetzung:** Bei passenden Plus-Aufgaben Hinweise wie "Verliebte Zahlen: 4 und 6 passen zusammen, denn 4 + 6 = 10." anzeigen. Beim Zehneruebergang: "8 und 2 ergeben 10. Dann bleiben von 5 noch 3 uebrig."  
**Abgrenzung:** Nicht als isoliertes Vokabel-Feature bauen. Der Begriff soll nur helfen, wenn er die konkrete Rechenstrategie erklaert.

---

### F-02 · Lernstrategien in der Hilfe systematisch pruefen
**Bereich:** Hilfe-Box / Didaktik  
**Idee:** Die Hilfe koennte je nach Aufgabe eine passende Grundschul-Strategie nennen, statt immer nur "weiterzaehlen" oder "wegnehmen" zu zeigen.  
**Moegliche Strategien:** Zahlenhaeuser fuer Zahlzerlegung, Kraft der Fuenf fuer Mengenbilder, Zehnerstopp fuer Uebergaenge, Zwillingsaufgaben und Fast-Zwillinge fuer Automatisierung, Tauschaufgaben fuer Plus, Umkehraufgaben fuer Minus.  
**Priorisierung:** Erst F-01 sauber halten. Danach nur Strategien einbauen, die direkt aus der aktuellen Aufgabe ableitbar sind und den Hint kuerzer oder klarer machen.  
**Nicht passend aktuell:** Kernaufgaben zum Einmaleins und Riesenaufgaben im grossen Zahlraum gehoeren eher in spaetere Stufen, nicht in die aktuelle Plus-/Minus-bis-20-Hilfe.

---

*Stand: 2026-06-29 — 29 Bugs, 2 Backlog-Features*
