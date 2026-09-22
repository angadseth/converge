"""Dev helper: insert a page fragment into index.html just before </main>.

Usage: python splice.py <fragment.html>
Fragments live in the scratchpad while a page is being written; the site itself is one file.
"""
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
index = root / "index.html"
frag = Path(sys.argv[1]).read_text(encoding="utf-8")
html = index.read_text(encoding="utf-8")
marker = "\n</main>"
if marker not in html:
    sys.exit("no </main> in index.html")
html = html.replace(marker, "\n" + frag.rstrip() + "\n" + marker, 1)
index.write_text(html, encoding="utf-8", newline="\n")
print("sheets:", html.count('class="sheet"'))
