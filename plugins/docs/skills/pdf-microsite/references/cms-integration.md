# Einbindung in einen bestehenden Auftritt

Stand der Recherche: September 2026, Beispiel KMK und SWK. Die Optionen gelten für jeden
TYPO3- oder WordPress-Auftritt einer Behörde oder eines Gremiums.

## Beispiel KMK / SWK

| | kmk.org | swk-bildung.org |
|---|---|---|
| CMS | TYPO3 12/13 im Composer-Modus (`/_assets/<hash>/`, `meta generator`, Backend `/typo3/`) | WordPress, eigenes Theme „nucleus“, Content-Verzeichnis nach `/content/` umbenannt |
| Frontend | eigenes Sitepackage, Vite-Build, CSS mit `@layer`, Schrift **Karla**, a11y-dialog, Swiper | RequireJS, jQuery 3.7 |
| Dienstleister (Impressum) | Technik und TYPO3: Faktor E GmbH, Bonn · Design: DITHO Design GmbH, Köln | nicht genannt |
| Header | HSTS, nosniff, XFO SAMEORIGIN, Referrer-Policy, **keine CSP**, obwohl die Skripte schon `nonce` tragen (TYPO3-CSP-API vorbereitet) | HSTS, XFO, keine CSP |
| Barrierefreiheitserklärung | „teilweise vereinbar“, BITV-Test Januar 2026 | „vollständig vereinbar“, nur als Selbstbewertung mit WAVE |
| Veröffentlichungen | Akkordeon mit Datum, Titel, Kurztext und PDF; es gibt Sprungmarken-TOC-Bausteine | je Veröffentlichung Teaser und PDF-Download, keine Gliederung |

**Eine HTML-Lesefassung eines Papiers gibt es auf keiner der beiden Seiten.** Alles ist Teaser
plus PDF. Die SWK hat auf beiden Seiten einen Seitenbaum. Bevor jemand etwas beauftragt, muss
geklärt sein, welcher der beiden maßgeblich ist.

## Optionen

| Option | Aufwand | Wer | Bewertung |
|---|---|---|---|
| **a) Eigene Subdomain oder eigener Pfad**, verlinkt aus dem Teaser (z. B. `lesefassung.<domain>`) | gering: DNS-Eintrag und Teaser-Link | Betreiber (DNS) und Redaktion | **kurzfristig empfohlen.** Braucht eine eigene Barrierefreiheitserklärung. Für öffentliche Auftraggeber auf eigenem Server statt Vercel hosten, die Seite ist statisch. |
| b) iframe in einer CMS-Seite | gering | Redaktion | **nicht empfohlen:** doppelte Scrollbalken, Anker und `?q=` nicht verlinkbar, Browsersuche und Druck brechen, schlechter für Screenreader. Die Vorlage verbietet Framing ohnehin (`frame-ancestors 'none'`). |
| c) HTML-Inhaltselement oder Datei in `fileadmin` | klein, meist nur mit Admin-Rechten | Agentur oder Admin | **Notlösung:** CSS kollidiert mit den Layern des Sitepackages. Inline-JS bricht, sobald die vorbereitete CSP aktiv wird. Die Redaktion kann den Inhalt nicht pflegen. |
| **d) Inhaltselemente im Sitepackage** (TYPO3 Content Blocks ab v13, sonst Mask oder DCE; in WordPress Gutenberg-Blöcke) | mittel: einige Tage bis wenige Wochen | Agentur (bei der KMK: Faktor E) | **dauerhaft empfohlen.** Bausteine: Kapitel mit Anker, Seitenverweis, Kernsatz-Box, Karten, Kette, Schritt-Tabs, Seitensuche; Akkordeon und Anker-TOC bestehen schon. Das JS läuft über den Sitepackage-Build mit Nonce, ist also CSP-fest. Danach legt die Redaktion jede Veröffentlichung selbst als Lesefassung an. |
| e) Headless (EXT:headless + Next/Nuxt) | hoch | Agentur | unverhältnismäßig für diesen Zweck |

## Was aus der Vorlage übertragbar ist

Bei Option d dient die Microsite als Spezifikation:

- Die Komponenten aus `site.css` entsprechen je einem Inhaltselement. Die Tokens werden durch
  das Farbsystem des Hauses ersetzt, Dark Mode entfällt, wenn der Auftritt keinen hat.
- `site.js` ist ohne Abhängigkeiten und mit `defer` einbindbar. Tabs, Suche und Filter
  funktionieren über Datenattribute (`data-tabs`, `data-tab`) und stehen ohne JS offen.
- Die Konvention „gedruckte Seitenzahl sichtbar, Link auf `#page=N`“ bekommt im CMS ein
  eigenes Feld am Absatz oder an der Überschrift.
- `index.md` und `llms.txt` erzeugt die Agentur z. B. als eigenen Seitentyp (`typeNum`) mit
  Markdown-Ausgabe.
