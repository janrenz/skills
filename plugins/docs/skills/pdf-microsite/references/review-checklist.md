# Prüfliste Lesefassung

Jeder Punkt hat eine Prüfung. „auto“ heißt: Eines der Skripte findet den Fehler. Die anderen
Punkte muss man ansehen. Die Beispiele in Klammern stammen aus dem Review einer echten Lesefassung
(September 2026).

## 1. Wortlaut und Quellen (vor allem anderen)

- [ ] Jedes Zitat steht wörtlich im PDF, auch das Satzzeichen am Ende — auto `fidelity.py`
      (dort stand der Punkt innerhalb des Rechnungshof-Zitats, im Original steht er dahinter)
- [ ] Seitenverweise zeigen die gedruckte Seitenzahl, der Link geht auf die PDF-Seite
      (dort stand überall die PDF-Seite, also eine Seite zu hoch: Wer von der Seite zitierte,
      zitierte falsch)
- [ ] Keine Sätze gestrichen — auto `coverage.py` (dort fehlten drei Sätze, weil Karten
      „kompakter“ gemacht wurden)
- [ ] Literatur vollständig: Untertitel, Reihe, Aktenzeichen, URLs (dort fehlten sechs Angaben)
- [ ] Eigenleistungen sichtbar gekennzeichnet: Grafiken, Kurzbeschriftungen, Zwischenzeilen
- [ ] Hinweis „inoffizielle Fassung, maßgeblich ist das PDF“ in der Fußzeile
- [ ] Personenlisten in den Gruppen des PDFs (dort war „Ständige Mitglieder“ zu einem Etikett
      pro Karte geworden)

## 2. UX

- [ ] Die Seite erklärt oben in einem Satz, was die hochgestellten Ziffern bedeuten
- [ ] Die Suche findet *alles*, auch Text in nicht aktiven Tabs, und zeigt den Treffer
      (dort blieben Treffer in verborgenen Tabs unauffindbar) — auto `behaviour.hiddenTabRevealedBySearch`
- [ ] Die Suche lässt sich per Link teilen (`?q=`) — auto `behaviour.queryParamHits`
- [ ] Tabs nur, wo sich Umschalten lohnt. Einzeiler gehören in Karten (dort gab es drei Tabs mit
      je einem halben Satz).
- [ ] Tab-Beschriftungen sind Wörter, keine bloßen Ziffern (dort hießen sie „1“ bis „5“)
- [ ] Beim Laden springt nichts: `scrollY` = 0 — auto `behaviour.scrollYAfterLoad`
- [ ] Mobil zeigt das eingeklappte Inhaltsverzeichnis, wo man gerade ist
- [ ] Zitierangabe kopierbar, Original-PDF von überall erreichbar
- [ ] Filter melden „keine Treffer“ und die Anzahl — auto

## 3. Sicherheit und Datenschutz

- [ ] CSP ohne `unsafe-inline`, gesetzt als HTTP-Header und nicht per `<meta>` (sonst greift
      `frame-ancestors` nicht) — auto über `console`, weil `serve.py` die CSP setzt
- [ ] Keine Inline-Skripte, keine `<style>`-Blöcke im Body, keine `style="…"`-Attribute
      (dort lag `<style>` mitten im `<body>`, dazu zwei `style=`-Attribute)
- [ ] `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`/`X-Frame-Options`
- [ ] Keine Drittanbieter-Requests: Schriften selbst hosten (dort Google Fonts; das ist nach
      LG München I, 3 O 17493/20, eine Übermittlung der IP-Adresse an Google)
- [ ] Nur `textContent`, kein `innerHTML` mit Nutzereingaben (Suche, Filter)
- [ ] Build- und Quelldateien werden nicht ausgeliefert (`/build.py`, `/src/`, `/.env.local` → 404)
- [ ] `localStorage` nur in try/catch, und die Seite funktioniert auch ohne

## 4. Barrierefreiheit (WCAG 2.2 AA / BITV 2.0)

- [ ] axe ohne Befund in hell und dunkel, Handy und Desktop — auto (dort: Überschriften-Sprung
      h2 → h4 in Karten, Inhalte außerhalb von Landmarks)
- [ ] Kein Ein-Tasten-Kürzel (WCAG 2.1.4) (dort: `/` fokussierte die Suche)
- [ ] Die Kopfzeile verdeckt den Fokus nicht (2.4.11): nicht sticky bei niedrigen Fenstern und
      `scroll-padding-top` gesetzt
- [ ] Klickflächen ≥ 24 px (2.5.8) — auto `smallTargets`, axe `target-size`
- [ ] Tabs nach APG: `role=tab` mit `aria-selected`, Roving-Tabindex, Pfeile, Home und End.
      Die sichtbare Beschriftung ist im zugänglichen Namen enthalten (2.5.3).
- [ ] Live-Regionen (`role="status"`) für Trefferzähler und Filterergebnis
- [ ] SVG-Grafiken: `role="img"`, `<title>` und `<desc>` mit den Zahlen im Klartext
- [ ] Zierzeichen (·, —, Nummern-Badges vor Listentext) sind `aria-hidden`
- [ ] Kontrast Text ≥ 4,5:1, Bedienelemente und Fokus ≥ 3:1, und zwar in **beiden** Designs.
      Beim Palettentausch nachrechnen:
      ```python
      def L(h):
          c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
          c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]
          return .2126*c[0]+.7152*c[1]+.0722*c[2]
      def cr(a,b): a,b=sorted((L(a),L(b))); return (b+.05)/(a+.05)
      ```
      Paare: ink-3 auf paper, surface und surface-2 · green-ink auf green-soft · mark-ink auf
      mark · control-line auf surface (3:1) · rose (Fokus) auf paper (3:1)
- [ ] Dark-Mode-Tokens an **einer** Stelle, sonst driften sie auseinander (dort fehlte
      `--control-line` im erzwungenen Dark Mode und stand im System-Dark-Mode doppelt)

## 5. Responsivität

- [ ] 320, 390, 820 und 1440 px ohne horizontales Scrollen — auto `overflow`
- [ ] Icons nicht doppelt: Mond und Sonne im Umschalter (dort wurde `.ico-sun{display:none}`
      von der spezifischeren Regel `.btn-icon svg{display:block}` überstimmt; das sieht man nur
      im Screenshot)
- [ ] Tab-Leiste auf dem Handy einzeilig und scrollbar statt dreizeilig umbrochen
- [ ] Seitenverweis in Überschriften bleibt am Text und rutscht nicht an den rechten Rand
      (Flex-Überschrift)
- [ ] Lange Komposita trennen (`hyphens:auto`, `lang="de"`), URLs umbrechen (`overflow-wrap:anywhere`)
- [ ] Druckansicht: keine Bedienelemente, alle Inhalte

## 6. Lesbarkeit für Agents

- [ ] Ohne JS ist der ganze Text sichtbar — auto `noJs` (dort waren zwölf Tab-Panels im HTML
      mit `hidden` versteckt, und damit der halbe Kerngehalt)
- [ ] `index.md` mit Frontmatter (source, url, note zur Seitenzählung), `Content-Type: text/markdown`
- [ ] `llms.txt`: was die Seite ist, wie man Seitenzahlen zitiert, was *nicht* aus dem Papier stammt
- [ ] `<link rel="alternate" type="text/markdown">`, JSON-LD `WebPage` → `mainEntity` `Report`
      mit PDF-URL, Datum und Autorengremium
- [ ] Stabile Anker-IDs je Kapitel; `?q=` als Deeplink dokumentiert
- [ ] `robots.txt` erlaubt den Abruf (sonst sieht niemand das `noindex`)
- [ ] Keine `citation_*`-Meta-Tags: Sie würden die Lesefassung als die Publikation ausgeben
