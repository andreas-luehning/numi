# Numi – Bug & UX Report

---

## ✅ Behoben

**Vor dieser Runde (Commit 70ca4c5 + Stufen-Umbau):**
B-01, B-02 (Report-Dots chronologisch), B-06 (Sitzungsergebnisse landen im Report),
B-07 (🏠-Button Schatten), B-08 (Fertig-Button als Pill), B-13 (Dots über Maximum),
B-16 (Streak-Doppelung). Zusätzlich: eigene Übergang-Stufen `p20z`/`m20z`/`pm20z`.

**Batch 1 – Logik:**
- **B-03** · `Alles gemischt bis 20` enthält jetzt `gP20Z`/`gM20Z`.
- **B-04** · `gP20` nutzt `a = rand(10, 17)` → kein deterministisches `b` mehr.
- **B-05** · `gM10` nutzt `b = rand(1, a - 1)` → Ergebnis nie 0.
- **B-15** · Guard `if (!problem) return null;` im Play-Screen.
- **B-22** · `lockRef` verhindert Doppelzählung bei schnellem Doppeltipp.

**Batch 2 – UX / Darstellung:**
- **B-09** · `.zh-hinttext` mit `overflow-wrap` + `hyphens:auto`.
- **B-10** · `.zh-rectext strong` mit `clamp()` + `hyphens:auto`.
- **B-11** · Konfetti nur bei ≥70 % richtig oder neuem Freund.
- **B-12** · `speechSynthesis.cancel()` am Anfang von `startSession`.
- **B-19** · Fortschrittsbalken (`.zh-nextbar`) während der 1350-ms-Pause.
- **B-20** · `.zh-repdots` `max-width: min(320px, 90vw)`.

---

## Offen – Batch 3 (Refactor / Performance / A11y)

### B-21 · `makeOptions`: Distraktoren-Fallback kann weit entfernte Werte liefern
**Bereich:** Aufgabengenerator  
**Problem:** Werden `near`-Kandidaten herausgefiltert (außerhalb `0..max`), füllt der Fallback `rand(0, max)` mit ggf. weit entfernten Zahlen auf – didaktisch schwächere Ablenker.  
**Ursache:** `app.js:97–108`.

---

### B-23 · `computeUnlocked` wird bei jedem Render neu berechnet
**Bereich:** Performance  
**Fix-Richtung:** `useMemo(() => computeUnlocked(save.stages), [save.stages])`.

---

### B-24 · `Header` als innere Funktion — bei jedem Render neu erstellt
**Bereich:** Performance / React-Antipattern  
**Fix-Richtung:** `Header` als Top-Level-Funktion auslagern, Props übergeben.

---

### B-25 · `Styles`-Komponente in jedem Screen neu gemountet
**Bereich:** Performance / DOM  
**Fix-Richtung:** `<Styles />` einmalig am Root rendern, außerhalb der Screen-Bedingungen.

---

### B-26 · Keine `aria-live`-Region für Streak-Meldung
**Bereich:** Accessibility  
**Fix-Richtung:** `aria-live="polite"` auf dem Container der Streak-Meldung.

---

### B-29 · Sprachmeldung bei neuem Freund nennt immer nur den ersten
**Bereich:** Sprachausgabe  
**Ursache:** `app.js` (`finishSession`, `newFriends[0]`).  
**Fix-Richtung:** Alle `newFriends` aufzählen.

---

## Offen – geringfügig / latent

### B-14 · `getHint` für Subtraktion: falsche Rechnung bei `a % 10 === 0`
**Bereich:** Hilfe-Hint  
**Problem:** Für `a = 20` würde der Übergang-Zweig negativen `rest` zeigen. Aktuell durch Generatoren (max `a = 19`) abgefangen, aber fragil.  
**Ursache:** `app.js` (`getHint`).

---

### B-17 · `zh-bob`-Animation auf Maskottchen im Play-Screen störend
**Bereich:** Play-Screen / Accessibility  
**Hinweis:** `prefers-reduced-motion` setzt sie korrekt auf `none`; nur ohne diese Einstellung dauerhaft.

---

### B-18 · Timer stoppt beim Live-Wechsel auf „Aus" (0 Minuten)
**Bereich:** Play-Screen  
**Hinweis:** Kein Showstopper, unklares Verhalten beim Live-Wechsel der Einstellung.

---

### B-27 · `gM20Z`: `a > 20`-Bedingung im While ist unerreichbar (toter Code)
**Bereich:** Code-Qualität  
**Ursache:** `app.js` (`gM20Z`, `while (a < 11 || a > 20)`; `a` max 18).

---

### B-28 · Kein visueller Hinweis im „Ohne Zeitlimit"-Modus, wann die Sitzung endet
**Bereich:** UX  
**Problem:** Bei Zeitlimit „Aus" gibt es keinen Indikator; einzige Endoption ist „Fertig".

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

**Offene Designfrage (29.06.2026):** Soll die Strategie-/Verliebte-Zahlen-Hilfe nur erscheinen,
wenn das Kind aktiv „Hilfe" drückt, oder automatisch bei einer falschen Antwort? → nächste Runde klären.

---

*Stand: 2026-06-29 — Batch 1 & 2 behoben; 9 Bugs offen, 2 Backlog-Features*
