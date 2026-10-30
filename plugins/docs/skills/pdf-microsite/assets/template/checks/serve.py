#!/usr/bin/env python3
"""Statischer Server, der die Header aus vercel.json setzt. So fallen CSP-Fehler lokal auf.
python3 checks/serve.py [port]"""
import http.server, json, re, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
rules = json.loads((root / "vercel.json").read_text()).get("headers", [])
def to_re(src): return re.compile("^" + src.replace("(.*)", ".*") + "$")
compiled = [(to_re(r["source"]), r["headers"]) for r in rules]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(root), **k)
    def end_headers(self):
        path = self.path.split("?")[0].split("#")[0]
        if path.endswith("/"): path += "index.html"
        for rx, hs in compiled:
            if rx.match(path):
                for h in hs:
                    if h["key"].lower() != "content-type": self.send_header(h["key"], h["value"])
        super().end_headers()
    def guess_type(self, p):
        return "text/markdown; charset=utf-8" if str(p).endswith(".md") else super().guess_type(p)
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8787), H).serve_forever()
