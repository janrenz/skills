# Einbindung in einen bestehenden Auftritt

Die meisten Auftraggeber haben schon einen Webauftritt, oft TYPO3 oder WordPress. Dort stehen
Veröffentlichungen in der Regel als **Teaser plus PDF**; eine HTML-Lesefassung gibt es selten.
Vor einer Empfehlung den Auftritt kurz ansehen:

| Prüfen | Woran man es erkennt |
|---|---|
| CMS und Version | `meta generator`, Pfade wie `/typo3/`, `/_assets/<hash>/` (TYPO3 Composer-Modus), `/wp-content/` |
| Frontend-Build | eigenes Sitepackage oder Theme, CSS-Layer (`@layer`), eingesetzte Bibliotheken |
| Sicherheits-Header | HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy, **CSP** (ist sie schon vorbereitet, z. B. Skripte mit `nonce`?) |
| Barrierefreiheitserklärung | Stand, Prüfverfahren (BITV-Test oder Selbstbewertung) |
| Darstellung von Veröffentlichungen | Akkordeon, Teaser, vorhandene Bausteine wie Anker-Inhaltsverzeichnisse |
| Zuständigkeit | Wer betreibt Technik und Design (Impressum)? Gibt es mehrere Seitenbäume für dasselbe Gremium? |

## Optionen

| Option | Aufwand | Wer | Bewertung |
|---|---|---|---|
| **a) Eigene Subdomain oder eigener Pfad**, verlinkt aus dem Teaser (z. B. `lesefassung.<domain>`) | gering: DNS-Eintrag und Teaser-Link | Betreiber (DNS) und Redaktion | **kurzfristig empfohlen.** Braucht eine eigene Barrierefreiheitserklärung. Für öffentliche Auftraggeber auf eigenem Server hosten; die Seite ist statisch. |
| b) iframe in einer CMS-Seite | gering | Redaktion | **nicht empfohlen:** doppelte Scrollbalken, Anker und `?q=` nicht verlinkbar, Browsersuche und Druck brechen, schlechter für Screenreader. Die Vorlage verbietet Framing ohnehin (`frame-ancestors 'none'`). |
| c) HTML-Inhaltselement oder Datei in `fileadmin` | klein, meist nur mit Admin-Rechten | Agentur oder Admin | **Notlösung:** CSS kollidiert mit den Layern des Sitepackages. Inline-JS bricht, sobald eine CSP aktiv wird. Die Redaktion kann den Inhalt nicht pflegen. |
| **d) Inhaltselemente im Sitepackage** (TYPO3 Content Blocks ab v13, sonst Mask oder DCE; in WordPress Gutenberg-Blöcke) | mittel: einige Tage bis wenige Wochen | die betreuende Agentur | **dauerhaft empfohlen.** Bausteine: Kapitel mit Anker, Seitenverweis, Kernsatz-Box, Karten, Kette, Schritt-Tabs, Seitensuche. Das JS läuft über den Sitepackage-Build mit Nonce, ist also CSP-fest. Danach legt die Redaktion jede Veröffentlichung selbst als Lesefassung an. |
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
