#!/usr/bin/env python3
"""Ermittelt, welche gedruckte Seitenzahl auf welcher PDF-Seite steht, und schlägt
page_offset / first_numbered für site.json vor.

python3 pagemap.py <paper.pdf>

Gedruckte Seitenzahl = allein stehende Zahl in den letzten/ersten Zeilen einer Seite.
Viele Papiere zählen Titel, Impressum oder Mitgliederliste nicht mit; dann ist die
PDF-Seite nicht die zitierfähige Seite.
"""
import collections, re, subprocess, sys
pdf = sys.argv[1]
n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
offsets, rows = collections.Counter(), []
for i in range(1, n + 1):
    lines = [l.strip() for l in subprocess.run(["pdftotext", "-layout", "-f", str(i), "-l", str(i), pdf, "-"],
             capture_output=True, text=True).stdout.splitlines() if l.strip()]
    cand = [l for l in lines[-3:] + lines[:2] if re.fullmatch(r"(Seite\s+)?\d{1,3}(\s*(/|von)\s*\d+)?", l)]
    printed = int(re.search(r"\d+", cand[0]).group()) if cand else None
    rows.append((i, printed, (lines[0] if lines else "")[:60]))
    if printed is not None: offsets[i - printed] += 1
for i, p, head in rows:
    print(f"PDF {i:>3} → gedruckt {p if p is not None else '–':>4} | {head}")
if offsets:
    off, cnt = offsets.most_common(1)[0]
    first = min(i for i, p, _ in rows if p is not None and i - p == off)
    print(f'\nVorschlag für site.json: "page_offset": {off}, "first_numbered": {first}   ({cnt} von {n} Seiten passen)')
    if len(offsets) > 1: print(f"Achtung: uneinheitlich {dict(offsets)} – Seiten einzeln prüfen (römische Zählung, Anhänge).")
else:
    print('\nKeine gedruckten Seitenzahlen gefunden: "page_offset": 0, "first_numbered": 1')
