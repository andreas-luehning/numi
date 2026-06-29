NUMI – auf GitHub Pages hosten und starten
===========================================

Ergebnis: eine kostenlose https-Adresse wie
   https://DEINNAME.github.io/numi/
Diese Adresse öffnest du auf dem Tablet im Browser und installierst die App.
Nach dem ersten Online-Start läuft sie offline.

WICHTIG: Die Dateien aus diesem Ordner müssen direkt im Repository liegen –
also index.html ganz oben, NICHT in einem Unterordner.


============================================================
WEG 1 – ohne Kommandozeile (nur über die GitHub-Webseite)
============================================================
1. Kostenloses Konto auf https://github.com anlegen und einloggen.

2. Neues Repository erstellen:
   • oben rechts auf "+" → "New repository"
   • Name: numi
   • Sichtbarkeit: Public
   • "Create repository" klicken.

3. Dateien hochladen:
   • Auf der Repo-Seite: "uploading an existing file"
     (oder Tab "Add file" → "Upload files").
   • Den INHALT des numi-Ordners hineinziehen:
     index.html, app.js, manifest.webmanifest, service-worker.js
     sowie die Ordner vendor/ und icons/.
   • Unten "Commit changes" klicken.

4. GitHub Pages einschalten:
   • Tab "Settings" → links "Pages".
   • Unter "Build and deployment":
       Source:  Deploy from a branch
       Branch:  main     Ordner: / (root)   → "Save".
   • Nach ~1 Minute erscheint oben die Adresse
       https://DEINNAME.github.io/numi/

5. Diese Adresse auf dem Tablet öffnen → installieren:
   • Android/Chrome: Menü (⋮) → "App installieren".
   • iPad/Safari: Teilen-Symbol → "Zum Home-Bildschirm".


============================================================
WEG 2 – mit der Kommandozeile (git)
============================================================
Im numi-Ordner ein Terminal öffnen:

   git init
   git add .
   git commit -m "Numi"
   git branch -M main
   git remote add origin https://github.com/DEINNAME/numi.git
   git push -u origin main

Danach in den Repo-Settings GitHub Pages aktivieren (siehe Weg 1, Schritt 4).


============================================================
VORHER LOKAL TESTEN (optional)
============================================================
Im numi-Ordner:
   python3 -m http.server 8000
Dann im Browser  http://localhost:8000  öffnen.
(Doppelklick auf index.html allein reicht NICHT – der Offline-Modus
und die Installation brauchen einen kleinen Server bzw. https.)


============================================================
SPÄTER EINE NEUE VERSION HOCHLADEN
============================================================
• Geänderte Dateien committen/hochladen.
• In "service-worker.js" die erste Zeile hochzählen, z. B.
     const CACHE = "numi-v2";
  Damit holen sich die Tablets beim nächsten Online-Start die neue Version.


Hinweis: Die verspielten Schriften werden beim ersten Online-Start geladen.
Ist ein Tablet von Anfang an offline, nutzt Numi eine ähnliche Standardschrift –
funktioniert trotzdem voll.
