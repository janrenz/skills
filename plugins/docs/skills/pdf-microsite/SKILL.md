---
name: pdf-microsite
version: 0.1.0
description: |
  Portiert ein PDF-Papier (Impulspapier, Gutachten, Stellungnahme, Positionspapier, Bericht)
  in eine barrierefreie, durchsuchbare Microsite: eine statische HTML-Lesefassung mit
  Inhaltsverzeichnis, Volltextsuche, Seitenverweisen aufs Original, Dark Mode, strikter CSP,
  Markdown-Fassung und llms.txt für Agents. Enthält Vorlage, Build und Prüfskripte
  (Textabgleich mit dem PDF, axe/WCAG 2.2, Layout, Verhalten). Auch zum Review einer
  bestehenden Lesefassung. Triggers: "PDF als Webseite", "Lesefassung", "Landingpage aus PDF",
  "Microsite aus Papier", "Paper in HTML", "PDF barrierefrei aufbereiten", "interaktive Fassung",
  "review die Lesefassung", "PDF to microsite", "paper landing page".
---

# PDF-Papier → Microsite

Ergebnis ist **eine** statische Seite. Sie gibt den Text des PDFs wörtlich wieder und macht ihn
lesbar, durchsuchbar und zitierbar. Referenz: https://swk-foerdermonitoring.vercel.app
(SWK-Impulspapier 2022). Aus diesem Projekt stammt die Vorlage in `assets/template/`.

Drei Grundsätze, die alles andere entscheiden:

1. **Wortlaut vor Gestaltung.** Jeder Satz auf der Seite steht so im PDF, oder er ist sichtbar als
   Ergänzung gekennzeichnet (Grafik „nicht im Papier“, Tab-Kurznamen, Zwischenzeilen). Keine
   Zusammenfassungen im Namen der Autorinnen und Autoren. Lieber einen Baustein weglassen als
   Text umschreiben, damit er in eine Karte passt.
2. **Alles steht im HTML.** Kein Inhalt entsteht erst durch JavaScript, und keiner ist im HTML
   mit `hidden` versteckt. Tabs, Filter, Suche und Dark Mode sind Verbesserungen. Ohne JS, beim
   Drucken und für Agents stehen alle Inhalte offen untereinander.
3. **Zitierfähig.** Hochgestellte Verweise zeigen die *gedruckte* Seitenzahl des Papiers und
   verlinken `pdf#page=N` (PDF-Seite). Die beiden weichen fast immer voneinander ab, denn
   Titelblatt, Impressum und Mitgliederliste sind nicht nummeriert.

## Ablauf

### 1. PDF holen und vermessen

```bash
curl -sSL -o paper.pdf "<PDF-URL>"
pdfinfo paper.pdf | grep -E 'Pages|Title|Author'
python3 <skill>/scripts/pagemap.py paper.pdf      # schlägt page_offset / first_numbered vor
pdftotext -layout paper.pdf paper.txt              # Arbeitsgrundlage für den Text
```

Lies das ganze PDF (`Read` mit `pages`), nicht nur den Text-Dump. Kästen, Tabellen, Grafiken und
Fußnoten sieht man nur im Bild.

### 2. Projekt anlegen

```bash
mkdir -p ~/code/<slug> && cp -r <skill>/assets/template/. ~/code/<slug>/ && cd ~/code/<slug>
git init -b main
```

`site.json` ausfüllen: PDF-URL, Werte aus `pagemap.py`, spätere Adresse.

### 3. Inhalt übertragen (`src/index.html`)

- **Gliederung wie im PDF:** eine `<section id>` je Kapitel, gleiche Reihenfolge, gleiche
  Überschriften, `h1` → `h2` → `h3` ohne Sprünge. Das Inhaltsverzeichnis in der Seitenleiste
  hat einen Eintrag je Section.
- **Verweise `[[N]]`:** N ist die *PDF-Seite*. Setze einen Verweis an jede Kapitelüberschrift und
  ans Ende jedes Absatzes, der auf einer neuen Seite endet. `build.py` macht daraus Link und
  gedruckte Seitenzahl.
- **Zitate:** Fremdzitate bekommen „…“ und die Quellenangabe, wie das Papier sie macht.
  Verbatim-Passagen des Papiers selbst bekommen *keine* Anführungszeichen, denn die ganze Seite
  ist Wortlaut. Satzzeichen genau übernehmen, oft steht der Punkt *hinter* dem Zitat.
- **Listen:** Hat das Papier eine Aufzählung im Fließtext, darfst du sie als Liste setzen. Die
  Bindewörter („und“, „oder“) bleiben dann erhalten.
- **Literatur vollständig:** Untertitel, Reihen, Aktenzeichen und URLs übernehmen. Gekürzte
  Einträge waren der häufigste Fehler im Referenzprojekt.
- **Bausteine** (Karten, Kette, Tabs, Kasten, Personenfilter): Die Regeln für ihren Einsatz stehen
  als Kommentar in der Vorlage. Tabs nur für mindestens drei gleichartige Abschnitte, die jeweils
  mindestens einen Absatz lang sind. Nie für Einzeiler: Eine Karte zeigt ihren Inhalt sofort.
- **Eigene Grafiken** nur, wenn Zahlen im Text stehen. Die `figcaption` beginnt dann mit „Grafik der
  Lesefassung, nicht im Papier:“. Ein SVG bekommt `role="img"`, `<title>` und `<desc>`, die
  Farben kommen aus CSS-Klassen.
- Nicht gebrauchte Bausteine löschen. Die Vorlage enthält jeden Baustein einmal.

Bei langen Papieren (> 40 Seiten) kapitelweise vorgehen und nach jedem Kapitel Schritt 5
laufen lassen.

### 4. Bauen

```bash
python3 build.py          # src/index.html → index.html + index.md
```

`build.py` bricht ab, solange ein `[[…]]`-Platzhalter unaufgelöst ist. Autorenkommentare
entfernt es aus der Auslieferung.

### 5. Prüfen: alle drei Prüfungen, jedes Mal

```bash
# a) Wortlaut und Seitenzahlen gegen das PDF
python3 <skill>/scripts/fidelity.py paper.pdf index.html
python3 <skill>/scripts/coverage.py paper.pdf index.html --from <erste Inhaltsseite> --to <letzte>

# b) Barrierefreiheit, Layout, Verhalten, mit den echten CSP-Headern
(cd <skill>/scripts && npm i --silent)                  # einmalig: playwright-core, axe-core
python3 checks/serve.py 8787 &                          # setzt die Header aus vercel.json
node <skill>/scripts/audit.mjs http://127.0.0.1:8787/ ./shots > audit.json
```

- `fidelity.py` muss mit Exit 0 enden. Das heißt: jedes „Zitat“ steht wörtlich im PDF, und keine
  Seitenangabe liegt mehr als eine Seite daneben. Die Liste „EIGEN“ zeigt Blöcke mit wenig
  wörtlicher Übereinstimmung. Geh sie einzeln durch: Jeder Block muss gewollte Eigenleistung
  sein (Hinweistexte, Fußzeile, Grafiklegende) oder ein Layout-Artefakt des PDFs (Tabellen,
  Mitgliederlisten in Spalten).
- `coverage.py` listet Sätze des PDFs, die auf der Seite fehlen. Übrig bleiben dürfen nur das
  Inhaltsverzeichnis, Kopf- und Fußzeilen und Silbentrennungsartefakte von pdftotext
  („Technologieund“).
- `audit.json`:
  - `axe` leer in allen vier Läufen (Handy und Desktop, jeweils hell und dunkel);
  - `overflow` und `smallTargets` leer;
  - `console` leer, denn CSP-Verstöße erscheinen hier;
  - `behaviour`: `scrollYAfterLoad` = 0, die Suche öffnet einen verborgenen Tab, `?q=` markiert
    Treffer, der Filter zeigt die Leermeldung, der Design-Umschalter wirkt;
  - `noJs.visibleTextChars` ≈ `allTextChars`: Ohne JS ist alles sichtbar.
- Screenshots in `./shots` ansehen (`Read`). axe findet keine überlappenden Icons, gequetschten
  Tabs oder Seitenzahlen, die an den Rand rutschen.

Kontraste prüft axe mit. Wer die Palette tauscht, rechnet zusätzlich die Token-Paare nach, siehe
`references/review-checklist.md`.

### 6. Veröffentlichen

Standard ist Vercel, weil das Projekt statisch ist (`vercel.json` enthält die Header,
`.vercelignore` hält `src/`, `build.py`, `checks/` und `.env*` aus der Auslieferung):

```bash
npx vercel link --yes --project <slug>     # legt .env.local an, das nicht committen
npx vercel deploy --yes                    # Preview, meist per Vercel Authentication geschützt
npx vercel curl / --deployment <preview-url> -- -sI     # Header prüfen trotz Schutz
npx vercel deploy --prod --yes
node <skill>/scripts/audit.mjs https://<slug>.vercel.app/ ./shots-live > audit-live.json
```

Prüfe auf der Preview, dass `/build.py`, `/src/index.html` und `/.env.local` mit 404 antworten.

Soll die Seite auf einer Behördenseite erscheinen oder dort eingebunden werden, lies
`references/cms-integration.md`. US-Hosting kann bei öffentlichen Auftraggebern ein
Ausschlussgrund sein.

## Was die Vorlage schon richtig macht

Diese Punkte beim Anpassen nicht wieder kaputtmachen:

- **Sicherheit:** Die CSP ist `default-src 'none'` mit `'self'` für Skripte, Styles und Fonts,
  ohne Inline-Skripte oder -Styles, auch ohne `style="…"`-Attribute. Dazu `frame-ancestors
  'none'`, nosniff, eine Referrer- und eine Permissions-Policy. JSON-LD als
  `application/ld+json` ist ein Datenblock und läuft trotz CSP.
- **Datenschutz:** Die Schriften liegen selbst gehostet unter `assets/fonts/` (OFL-Lizenzen
  liegen daneben). Kein Google Fonts, keine Cookies, `localStorage` nur für die Design-Wahl
  (in try/catch).
- **Barrierefreiheit:** Skip-Link, Landmarks (`header`, `nav`, `main`, `footer`,
  `role="search"`), Live-Regionen für Trefferzahl und Filter, Tabs nach APG mit Pfeiltasten,
  Home und End. `aria-current="location"` im Inhaltsverzeichnis. Die Kopfzeile ist bei
  niedrigen Fenstern nicht sticky (WCAG 2.4.11). Es gibt **kein Ein-Tasten-Kürzel** wie `/`
  (WCAG 2.1.4). Klickflächen sind mindestens 24 px groß, Fokusrahmen 3 px, und
  `prefers-reduced-motion` wird respektiert.
- **Responsiv:** 320 px ohne horizontales Scrollen. Tabs scrollen auf dem Handy in ihrer Leiste,
  und das Inhaltsverzeichnis ist mobil eingeklappt und zeigt den aktuellen Abschnitt.
  `hyphens:auto` sorgt für saubere Trennung langer deutscher Komposita.
- **Dark Mode:** Die Farben stehen einmal als `light-dark()`-Tokens da, der Umschalter setzt
  `color-scheme`. `theme.js` läuft synchron im Head, damit die Seite nicht erst im falschen
  Design aufblitzt.
- **Agents:** `index.md` (Volltext mit Seitenlinks, `text/markdown`, CORS offen), `llms.txt`,
  `<link rel="alternate" type="text/markdown">`, JSON-LD (`WebPage` → `Report`), stabile
  Anker-IDs und Such-Deeplinks `?q=`. `robots.txt` erlaubt den Abruf, `noindex` bleibt
  bestehen, weil die Seite eine inoffizielle Fassung ist.
- **Druck:** Bedienelemente werden ausgeblendet, alle Tabs und Listeneinträge gedruckt.

## Review einer bestehenden Lesefassung

Holt man den Stand einer Seite ohne Quellcode, lädt man das HTML (`curl`) und legt es als
`src/index.html` ab. Verweise stehen dann schon als Links im HTML, `[[N]]` wird nicht gebraucht.
Danach laufen Schritt 5 und `references/review-checklist.md` durch. Befunde werden nach Schwere
sortiert: falscher Wortlaut oder falsche Seitenzahl vor Barrierefreiheit, vor Sicherheit, vor
Kosmetik.

## Dateien

| Datei | Zweck |
|---|---|
| `assets/template/src/index.html` | Seitengerüst mit allen Bausteinen und Einsatzregeln als Kommentar |
| `assets/template/assets/` | `site.css` (Tokens, Komponenten, Druck), `site.js` (Tabs, Suche, Filter, TOC, Zitieren), `theme.js`, Schriften |
| `assets/template/build.py` | `[[N]]` → Seitenlink, erzeugt `index.md`, bricht bei offenen Platzhaltern ab |
| `assets/template/vercel.json` | CSP und Sicherheits-Header, Markdown-Content-Type, Font-Caching |
| `assets/template/checks/serve.py` | lokaler Server mit den Headern aus `vercel.json` |
| `scripts/pagemap.py` | PDF-Seite ↔ gedruckte Seitenzahl, Vorschlag für `site.json` |
| `scripts/fidelity.py` | Zitate wörtlich? Seitenangaben richtig? Welche Blöcke sind Eigentext? |
| `scripts/coverage.py` | Welche Sätze des PDFs fehlen auf der Seite? |
| `scripts/audit.mjs` | axe (WCAG 2.2 AA) hell und dunkel, Überlauf, Klickflächen, Verhalten, ohne-JS-Sicht, Screenshots |
| `references/review-checklist.md` | Prüfliste UX, Sicherheit, Barrierefreiheit, Responsivität, Agents, mit Befunden aus dem Referenzprojekt |
| `references/cms-integration.md` | Einbindung in TYPO3/WordPress-Auftritte (Beispiel kmk.org / swk-bildung.org) |
