#!/usr/bin/env python3
"""Baut die Microsite aus src/index.html.

  [[N]]  →  Herkunftslink auf PDF-Seite N, beschriftet mit der gedruckten Seitenzahl.
  Danach entsteht aus derselben Seite index.md (Volltext für Agents).

Konfiguration in site.json:
  pdf               URL des Original-PDFs
  page_offset       gedruckte Seite = PDF-Seite − page_offset
  first_numbered    erste PDF-Seite mit gedruckter Seitenzahl (davor: "PDF N")
  site_url          öffentliche Adresse (für Links in index.md)
"""
import html, json, re, sys
from html.parser import HTMLParser
from pathlib import Path

here = Path(__file__).resolve().parent
cfg = json.loads((here / "site.json").read_text())
PDF = cfg["pdf"]

def label(n):
    if n < cfg["first_numbered"]:
        return f"PDF {n}", f"PDF-Seite {n} (ohne Seitenzahl)"
    p = n - cfg["page_offset"]
    return str(p), f"Seite {p} des Papiers, PDF-Seite {n}"

def src_link(m):
    n = int(m.group(1)); vis, aria = label(n)
    return (f'<a class="src" href="{PDF}#page={n}" data-pdf-page="{n}" '
            f'aria-label="{aria}" title="{aria}">{vis}</a>')

# Autorenkommentare gehören nicht in die Auslieferung.
source = re.sub(r"<!--.*?-->\s*", "", (here / "src" / "index.html").read_text(), flags=re.S)
page = re.sub(r"\[\[(\d+)\]\]", src_link, source)
if "[[" in page:
    sys.exit("Unaufgelöster Verweis [[…]] in src/index.html")
(here / "index.html").write_text(page)

# ---------- Markdown ----------
VOID = {"br", "img", "input", "meta", "link", "hr", "source", "wbr"}

class MD(HTMLParser):
    """Kleiner HTML→Markdown-Wandler für <main>. Kennt nur die Elemente dieser Seiten.
    Ausgelassen: Bedienelemente (.needs-js, button, input, label), .sr-Texte, SVG."""
    SKIPTAGS = {"script", "style", "svg", "button", "input", "label", "nav"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.buf, self.stack = [], "", []
        self.inmain, self.lists, self.quote = False, [], 0
    @property
    def skipping(self): return any(e[1] for e in self.stack)
    def flush(self, prefix=""):
        t = re.sub(r"\s+", " ", self.buf).strip()
        if t: self.out.append(prefix + t)
        self.buf = ""
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = (a.get("class") or "").split()
        if tag == "main": self.inmain = True
        if not self.inmain: return
        skip = tag in self.SKIPTAGS or bool({"needs-js", "sr", "kicker"} & set(cls)) or a.get("aria-hidden") == "true"
        if tag not in VOID: self.stack.append((tag, skip))
        if self.skipping: return
        if tag in ("ul", "ol"): self.flush(); self.lists.append([tag, 0])
        elif tag in ("p", "li", "h1", "h2", "h3", "dt", "dd", "figcaption", "footer"): self.flush()
        elif tag == "blockquote": self.flush(); self.quote += 1
        elif tag == "a": self.buf += "["; self.stack[-1] = ("a", False, a.get("href"))
        elif tag in ("em", "i"): self.buf += "*"
        elif tag in ("strong", "b"): self.buf += " **"
        elif tag == "br": self.buf += " "
        elif "step-no" in cls: self.flush(); self.buf += "**"; self.stack[-1] = (tag, False, "BOLD")
        elif "cn" in cls: self.buf += "*"; self.stack[-1] = (tag, False, "LABEL")
        elif set(cls) & {"chair", "q"}: self.buf += " · "
    def handle_endtag(self, tag):
        if not self.inmain: return
        if tag == "main": self.flush(); self.inmain = False; return
        if tag in VOID: return
        # bis zum passenden Tag abbauen (verzeiht nicht geschlossene Elemente)
        while self.stack and self.stack[-1][0] != tag: self.stack.pop()
        if not self.stack: return
        entry = self.stack.pop()
        if entry[1] or self.skipping: return
        q = "> " * self.quote
        if len(entry) > 2 and entry[2] == "BOLD": self.buf = self.buf.rstrip() + "** "
        elif len(entry) > 2 and entry[2] == "LABEL": self.buf = self.buf.rstrip() + ":* "
        elif tag == "a": self.buf += f"]({entry[2]})" if len(entry) > 2 and entry[2] else "]"
        elif tag in ("em", "i"): self.buf += "*"
        elif tag in ("strong", "b"): self.buf += "** "
        elif tag == "h1": self.flush("# "); self.out.append("")
        elif tag == "h2": self.out.append(""); self.flush("## "); self.out.append("")
        elif tag == "h3": self.out.append(""); self.flush("### "); self.out.append("")
        elif tag == "li":
            kind, n = self.lists[-1]; self.lists[-1][1] += 1
            self.flush(q + (f"{n+1}. " if kind == "ol" else "- "))
        elif tag in ("ul", "ol"): self.flush(); self.lists.pop(); self.out.append("")
        elif tag == "dt": self.flush("- **"); self.out[-1] += ":**"
        elif tag == "dd": t = re.sub(r"\s+", " ", self.buf).strip(); self.buf = ""; self.out[-1] += " " + t
        elif tag in ("p", "figcaption", "footer"): self.flush(q); self.out.append(q.rstrip() if q else "")
        elif tag == "blockquote": self.flush(q); self.quote -= 1; self.out.append("")
        elif tag == "div" and self.buf.strip(): self.flush(q)
    def handle_data(self, d):
        if self.inmain and not self.skipping: self.buf += d

# Herkunftslinks in Markdown: [S. 8](pdf#page=9)
def md_src(m):
    n = int(m.group(1)); vis, _ = label(n)
    return f'<a href="{PDF}#page={n}">{"PDF-S. " + vis[4:] if vis.startswith("PDF") else "S. " + vis}</a>'
mdsrc = re.sub(r"\[\[(\d+)\]\]", md_src, source)
parser = MD(); parser.feed(mdsrc)
body = "\n".join(parser.out)
body = re.sub(r"\n{3,}", "\n\n", body).strip()

title = re.search(r"<title>(.*?)</title>", page).group(1)
desc = html.unescape(re.search(r'<meta name="description" content="([^"]+)"', page).group(1))
front = f"""---
title: {title}
source: {PDF}
url: {cfg['site_url']}
language: de
note: Inoffizielle Lesefassung. Maßgeblich ist das Original-PDF. "S. N" nennt die gedruckte Seitenzahl, der Link die PDF-Seite.
---

<!-- {desc} -->

"""
(here / "index.md").write_text(front + body + "\n")
print(f"index.html {len(page)//1024} KB, index.md {len(body)//1024} KB")
