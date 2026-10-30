#!/usr/bin/env python3
"""Umgekehrter Abgleich: welche Sätze des PDFs fehlen auf der Microsite?
python3 coverage.py <paper.pdf> <index.html> [--from N] [--to M]"""
import re, subprocess, sys, html, unicodedata
pdf, page = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
lo = int(a[a.index("--from")+1]) if "--from" in a else 1
hi = int(a[a.index("--to")+1]) if "--to" in a else 999
def norm(s):
    s = unicodedata.normalize("NFKC", s).replace("­", "")
    s = re.sub(r"(\w)-\n(\w)", r"\1\2", s)
    s = re.sub(r"[„“”\"‚‘’'«»]", "", s); s = re.sub(r"[–—-]", "-", s)
    return re.sub(r"\s+", " ", s).strip().lower()
def clean(s):
    s = unicodedata.normalize("NFKC", s).replace("\u00ad", "")
    s = re.sub(r"(\w)-\n(\w)", r"\1\2", s)
    return re.sub(r"\s+", " ", s).strip()
site = re.sub(r"<script.*?</script>|<style.*?</style>", " ", open(page, encoding="utf8").read(), flags=re.S)
site = norm(html.unescape(re.sub(r"<[^>]+>", " ", site)))
sw = site.split(); siteset = {" ".join(sw[i:i+4]) for i in range(len(sw)-3)}
raw = subprocess.run(["pdftotext", pdf, "-"], capture_output=True, text=True).stdout.split("\f")
miss = tot = 0
for n, pg in enumerate(raw, 1):
    if not lo <= n <= hi: continue
    pg = re.sub(r"\n\s*\d+\s*\n", "\n", pg)                       # Seitenzahlen
    for sent in re.split(r"(?<=[.!?:])\s+(?=[A-ZÄÖÜ„])", clean(pg)):
        w = norm(sent).split()
        if len(w) < 6: continue
        tot += 1
        sh = [" ".join(w[i:i+4]) for i in range(len(w)-3)]
        cov = sum(x in siteset for x in sh) / len(sh)
        if cov < 0.6:
            miss += 1; print(f"S.{n:<3} {cov:4.0%}  {sent[:150]}")
print(f"\n{miss} von {tot} Sätzen fehlen ganz oder weitgehend")
