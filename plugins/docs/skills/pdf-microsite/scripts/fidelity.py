#!/usr/bin/env python3
"""Abgleich Microsite ↔ Original-PDF.

python3 fidelity.py <paper.pdf> <index.html>

Prüft
  1. jedes Zitat in „…“ steht wörtlich im PDF (nach Normalisierung),
  2. jeder Textblock (p, li, h2, h3, blockquote, dd) lässt sich einer PDF-Seite
     zuordnen; Blöcke mit geringer Übereinstimmung sind Umschreibungen oder
     Eigentext und müssen bewusst so gewollt sein,
  3. die Seitenangabe im Herkunftslink (#page=N) passt zur gefundenen Seite.
Exit 1, wenn ein Zitat fehlt oder eine Seitenangabe mehr als eine Seite abweicht.
"""
import re, subprocess, sys, unicodedata
from html.parser import HTMLParser

pdf, html_path = sys.argv[1], sys.argv[2]

def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("­", "")
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)          # Silbentrennung am Zeilenende
    s = re.sub(r"[„“”\"‚‘’'«»]", "", s)
    s = re.sub(r"[–—-]", "-", s)
    s = re.sub(r"\[…\]|\[\.\.\.\]|…", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()

raw = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
pages = [norm(p) for p in raw.split("\f")]
alltext = " ".join(pages)

class Blocks(HTMLParser):
    TAGS = {"p", "li", "h1", "h2", "h3", "blockquote", "dd", "figcaption"}
    def __init__(self):
        super().__init__(); self.stack = []; self.blocks = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "nav", "svg", "cite") or (tag == "footer" and "site-footer" in (a.get("class") or "")) or (tag == "footer" and not self.stack): self.skip += 1; self._skiptags = getattr(self, "_skiptags", []) + [tag]
        if tag in self.TAGS: self.stack.append({"tag": tag, "text": "", "pages": [], "id": a.get("id")})
        if tag == "a" and self.stack:
            m = re.search(r"#page=(\d+)", a.get("href", ""))
            if m: self.stack[-1]["pages"].append(int(m.group(1))); self.skip += 1; self._srclink = True
    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "footer", "svg", "cite"): self.skip -= 1
        if tag == "a" and getattr(self, "_srclink", False): self.skip -= 1; self._srclink = False
        if tag in self.TAGS and self.stack:
            b = self.stack.pop()
            if self.stack: self.stack[-1]["text"] += b["text"]; self.stack[-1]["pages"] += b["pages"]
            self.blocks.append(b)
    def handle_data(self, d):
        if self.stack and not self.skip: self.stack[-1]["text"] += d

p = Blocks(); p.feed(open(html_path, encoding="utf8").read())

def shingles(s, n=5):
    w = s.split(); return {" ".join(w[i:i+n]) for i in range(max(1, len(w)-n+1))}

page_sh = [shingles(pg) for pg in pages]
fail = 0
print("## Zitate")
quotes = set()
for b in p.blocks:
    for q in re.findall(r"„([^“]{12,})“", b["text"]):
        quotes.add(q)
for q in sorted(quotes):
    parts = [norm(x).rstrip(".,;:") for x in re.split(r"\[…\]|…", q) if len(norm(x)) > 8]
    missing = [x for x in parts if x not in alltext]
    if missing:
        fail += 1; print(f"  FEHLT  „{q[:90]}“\n         → {missing[0][:90]}")
print(f"  {len(quotes)} Zitate geprüft, {fail} nicht wörtlich im PDF")

print("\n## Blöcke")
low, pagebad = 0, 0
for b in p.blocks:
    t = norm(b["text"])
    if len(t.split()) < 8: continue
    sh = shingles(t)
    scores = [len(sh & ps) / len(sh) for ps in page_sh]
    best = max(range(len(scores)), key=scores.__getitem__)
    s, pg = scores[best], best + 1
    tag = f'{b["tag"]}{"#"+b["id"] if b["id"] else ""}'
    if s < 0.5:
        low += 1; print(f"  EIGEN  {s:4.0%}  {tag:14} {b['text'].strip()[:80]}")
    elif b["pages"]:
        cited = b["pages"][-1]
        # Ein Block darf über eine Seitengrenze laufen; weiter weg ist falsch.
        # Wiederholte Passagen (Zusammenfassung, Inhaltsverzeichnis) stehen auf mehreren Seiten:
        # richtig ist, was auf der zitierten Seite oder ihrer Vorgängerseite steht.
        near = max(scores[c - 1] for c in (cited - 1, cited) if 1 <= c <= len(scores))
        if abs(cited - pg) > 1 and near < 0.5:
            pagebad += 1; fail += 1
            print(f"  SEITE  zitiert S.{cited}, gefunden S.{pg}  {tag:14} {b['text'].strip()[:70]}")
print(f"  {low} Blöcke mit <50 % wörtlicher Übereinstimmung (Umschreibung/Eigentext), {pagebad} falsche Seitenangaben")
sys.exit(1 if fail else 0)
