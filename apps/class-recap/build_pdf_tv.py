#!/usr/bin/env python3
"""Render an Obsidian meeting-report markdown file to a TradeVantage-branded PDF.
Fork of the recording-report build_pdf.py with dark brand styling + logo.
Usage: build_pdf_tv.py <report.md> <out.pdf> [--imgdir DIR] [--vault DIR]
"""
import re, os, sys, base64, subprocess, pathlib, tempfile, urllib.parse, argparse

VAULT_DEFAULT = "/Users/dio/Second Brain/Second Brain"
CHROME_CANDIDATES = [
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]

# TradeVantage logo mark (public/figma/logo-mark.svg), recolored to brand yellow.
LOGO = ('<svg viewBox="0 0 15.3079 16" width="19" height="20" style="display:block" '
        'xmlns="http://www.w3.org/2000/svg">'
        '<path d="M5.30986 1.13169e-05L10.463 11.2513L12.8758 5.99305H15.3079L10.4438 16L2.88743 1.13169e-05H5.30986Z" fill="#FFD400"/>'
        '<path d="M0.787486 2.49371H11.2873L10.4998 4.59366H2.05315e-06L0.787486 2.49371Z" fill="#FFD400"/></svg>')

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&'
         'family=Intel+One+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">')

CSS = r"""
:root{
  --bg:#111111;--bg2:#161616;--surf:#1A1A1A;--surf2:#1F1F1F;
  --ink:#EEEEEE;--ink2:#D6D6D6;--muted:#9A9A9A;--faint:#6E6E6E;
  --line:rgba(255,255,255,0.09);--line2:rgba(255,255,255,0.16);
  --brand:#FFD400;--brand-dim:#E6C000;
  --blood:#E03C3C;--moss:#8FCF2E;--steel:#8A94A6;
  --mono:"Intel One Mono",ui-monospace,"SF Mono",Menlo,monospace;
  --sans:"Inter","Helvetica Neue",-apple-system,Arial,sans-serif;
}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:0;}
body{font-family:var(--sans);color:var(--ink);font-size:10.4pt;line-height:1.66;margin:0;
  background:var(--bg);-webkit-font-smoothing:antialiased;}
.page{padding:15mm 15mm 16mm;}
.mono{font-family:var(--mono);}

/* Cover */
.cover{padding:2mm 0 7mm;margin-bottom:9mm;border-bottom:2px solid var(--brand);}
.brandbar{display:flex;align-items:center;gap:8px;margin-bottom:11mm;}
.brandbar .wm{font-family:var(--mono);font-weight:700;font-size:13pt;letter-spacing:-.01em;color:var(--ink);}
.brandbar .tag{margin-left:auto;font-family:var(--mono);font-size:7.4pt;letter-spacing:.2em;
  text-transform:uppercase;color:var(--faint);border:1px solid var(--line);padding:3px 9px;}
.eyebrow{font-family:var(--mono);font-size:8pt;letter-spacing:.22em;text-transform:uppercase;
  color:var(--brand);font-weight:600;margin-bottom:12px;}
h1.title{font-family:var(--sans);font-size:27pt;line-height:1.1;margin:0 0 4mm;font-weight:800;
  letter-spacing:-.02em;color:#fff;max-width:15em;}
.meta{display:grid;grid-template-columns:auto 1fr;gap:5px 18px;font-size:9.2pt;color:var(--ink2);margin-top:5mm;}
.meta dt{font-family:var(--mono);font-size:7.8pt;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);align-self:center;}
.meta dd{margin:0;}
.chips{margin-top:5mm;}
.pchip{display:inline-block;background:var(--surf);border:1px solid var(--line2);
  padding:3px 11px;margin:0 6px 6px 0;font-family:var(--mono);font-size:8pt;color:var(--ink2);}

/* Headings */
h2{font-family:var(--sans);font-size:15pt;font-weight:700;margin:11mm 0 4mm;color:#fff;
  letter-spacing:-.015em;padding-bottom:3mm;border-bottom:1px solid var(--line);
  display:flex;align-items:baseline;gap:10px;break-after:avoid;}
h2::before{content:attr(data-n);font-family:var(--mono);font-size:9pt;font-weight:700;
  color:var(--brand);letter-spacing:.05em;}
h3{font-family:var(--sans);font-size:11.6pt;font-weight:700;margin:6mm 0 2mm;color:var(--brand-dim);break-after:avoid;}
p{margin:2.6mm 0;}
strong{color:#fff;font-weight:700;}
em{color:var(--ink2);}
hr{border:none;border-top:1px solid var(--line);margin:8mm 0;}
a,.wl{color:var(--brand);text-decoration:none;font-weight:500;
  border-bottom:1px solid rgba(255,212,0,.32);}
ul,ol{margin:2.6mm 0;padding-left:5.5mm;}
li{margin:1.6mm 0;}
li::marker{color:var(--brand);}
code{font-family:var(--mono);font-size:.9em;background:var(--surf2);border:1px solid var(--line);
  padding:.5px 5px;color:var(--brand-dim);}

/* Figures */
figure{margin:6mm 0;text-align:center;break-inside:avoid;}
figure img{display:block;margin:0 auto;width:auto;height:auto;
  max-width:138mm;max-height:88mm;object-fit:contain;
  border:1px solid var(--line2);background:#000;}
figcaption{font-family:var(--mono);font-size:8pt;color:var(--muted);margin-top:3mm;
  padding:0 6mm;line-height:1.5;letter-spacing:.01em;}

/* Callouts — full border, label tag, tinted panel (no side stripe) */
.callout{border:1px solid var(--line2);background:var(--surf);padding:4mm 5mm;margin:5mm 0;
  break-inside:avoid;font-size:10pt;}
.callout p:first-of-type{margin-top:0;}.callout p:last-child{margin-bottom:0;}
.callout-label{font-family:var(--mono);font-size:7.2pt;letter-spacing:.16em;text-transform:uppercase;
  font-weight:700;margin-right:9px;padding:2px 8px;color:#111;vertical-align:1.5px;}
.callout-tip{border-color:rgba(255,212,0,.34);background:rgba(255,212,0,.055);}
.cl-tip{background:var(--brand);}
.callout-important{border-color:rgba(255,212,0,.34);background:rgba(255,212,0,.05);}
.cl-important{background:var(--brand);}
.callout-warning{border-color:rgba(224,60,60,.4);background:rgba(224,60,60,.07);}
.cl-warning{background:var(--blood);color:#fff;}
.callout-note{border-color:var(--line2);background:var(--surf2);}
.cl-note{background:var(--steel);color:#fff;}

/* Table */
table{border-collapse:collapse;width:100%;margin:5mm 0;font-size:8.7pt;break-inside:avoid;
  border:1px solid var(--line2);}
th{background:var(--brand);color:#111;text-align:left;padding:6px 9px;font-family:var(--mono);
  font-weight:700;font-size:7.6pt;letter-spacing:.08em;text-transform:uppercase;}
td{padding:6px 9px;border-top:1px solid var(--line);vertical-align:top;color:var(--ink2);}
tr:nth-child(even) td{background:var(--bg2);}
td strong{color:#fff;}

/* Footer */
.foot{margin-top:12mm;padding-top:4mm;border-top:2px solid var(--brand);
  font-family:var(--mono);font-size:7.6pt;letter-spacing:.06em;color:var(--faint);
  display:flex;justify-content:space-between;text-transform:uppercase;}
"""

def find_chrome():
    for c in CHROME_CANDIDATES:
        if os.path.exists(c): return c
    sys.exit("No Chrome/Chromium/Edge found for PDF rendering")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("md"); ap.add_argument("out_pdf")
    ap.add_argument("--imgdir"); ap.add_argument("--vault", default=VAULT_DEFAULT)
    a = ap.parse_args()

    raw = pathlib.Path(a.md).read_text()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    fm, body = (m.group(1), m.group(2)) if m else ("", raw)
    def fmv(k):
        mm = re.search(rf"^{k}:\s*(.+)$", fm, re.M); return mm.group(1).strip().strip('"') if mm else ""
    title = fmv("title") or pathlib.Path(a.md).stem

    imgdir = a.imgdir
    if not imgdir:
        src = re.search(r'sources:\s*\[?"?([^"\]\n]+)', fm)
        imgdir = os.path.join(a.vault, src.group(1).strip()) if src else str(pathlib.Path(a.md).parent)

    def grab(label):
        mm = re.search(rf"\*\*{label}:\*\*\s*(.+)", body)
        if not mm: return ""
        return re.sub(r"\*\*|\[\[|\]\]", "", mm.group(1)).strip()
    platform = grab("Platform")
    date_line = grab("Date").split("·")[0].strip()
    duration = grab("Duration")
    participants = grab("Participants")

    # Drop the redundant leading H1 title from the body (the cover carries the title).
    body = re.sub(r"^\s*#\s+[^\n]+\n", "", body, count=1)

    # Ensure a blank line precedes list items so pandoc parses them as lists (not run-on text).
    _norm, _prev = [], ""
    for _ln in body.split("\n"):
        _isli = re.match(r"^\s*(?:[-*]\s|\d+\.\s)", _ln)
        _previsli = re.match(r"^\s*(?:[-*]\s|\d+\.\s)", _prev)
        if _isli and _prev.strip() and not _previsli:
            _norm.append("")
        _norm.append(_ln); _prev = _ln
    body = "\n".join(_norm)

    # Greedy to the final "*" on the caption line: captions legitimately contain **bold**,
    # and a non-greedy match would stop at the first inner "*", leaving stray text in the
    # image's paragraph — which suppresses pandoc's implicit <figure> wrapper entirely.
    body = re.sub(r"!\[\[([^\]]+?\.(?:jpg|jpeg|png))\]\]\n\*(.+)\*[ \t]*$",
                  lambda mo: f"![{mo.group(2)}]({os.path.join(imgdir, mo.group(1))})",
                  body, flags=re.M)

    CALL = {"NOTE":"note","TIP":"tip","WARNING":"warning","IMPORTANT":"important"}
    lines, out, i = body.split("\n"), [], 0
    while i < len(lines):
        mo = re.match(r"^>\s*\[!(\w+)\]\s*(.*)$", lines[i])
        if mo:
            ct = CALL.get(mo.group(1).upper(), "note"); ctitle = mo.group(2).strip(); i += 1
            inner = []
            while i < len(lines) and lines[i].startswith(">"):
                inner.append(re.sub(r"^>\s?", "", lines[i])); i += 1
            out.append(f"::: {{.callout .callout-{ct}}}")
            if ctitle: out.append(f'[]{{.callout-label .cl-{ct}}} **{ctitle}**\n')
            out.extend(inner); out.append(":::\n")
        else:
            out.append(lines[i]); i += 1
    body = "\n".join(out)
    body = re.sub(r"\[\[[^\]|]+\|([^\]]+)\]\]", r'<span class="wl">\1</span>', body)
    body = re.sub(r"\[\[([^\]]+)\]\]", r'<span class="wl">\1</span>', body)

    p = subprocess.run(["pandoc", "-f", "markdown+fenced_divs+pipe_tables+raw_html",
                        "-t", "html5", "--wrap=none"], input=body, capture_output=True, text=True)
    if p.returncode: sys.exit(p.stderr)
    html_body = p.stdout

    # Number the H2 sections (data-n) for the mono index chip.
    counter = {"n": 0}
    def num_h2(mo):
        counter["n"] += 1
        return f'<h2 data-n="{counter["n"]:02d}">{mo.group(1)}</h2>'
    html_body = re.sub(r"<h2[^>]*>(.*?)</h2>", num_h2, html_body, flags=re.S)

    def embed(mo):
        fp = urllib.parse.unquote(mo.group(1))
        mime = "png" if fp.lower().endswith(".png") else "jpeg"
        return f'src="data:image/{mime};base64,{base64.b64encode(pathlib.Path(fp).read_bytes()).decode()}"'
    html_body = re.sub(r'src="([^"]+\.(?:jpg|jpeg|png))"', embed, html_body)

    chips = "".join(f'<span class="pchip">{x.strip()}</span>' for x in participants.split(",") if x.strip())
    meta = ""
    for label, val in [("Platform", platform), ("Date", date_line), ("Duration", duration)]:
        if val: meta += f"<dt>{label}</dt><dd>{val}</dd>\n"
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>{FONTS}
<style>{CSS}</style></head>
<body><div class="page">
<div class="cover">
  <div class="brandbar">{LOGO}<span class="wm">+vantage</span><span class="tag">Class Report</span></div>
  <div class="eyebrow">TradeVantage · Trading Class Recap</div>
  <h1 class="title">{title}</h1>
  <dl class="meta">{meta}</dl>
  {'<div class="chips">'+chips+'</div>' if chips else ''}
</div>
{html_body}
<div class="foot"><span>+vantage · tradevantage.gg</span><span>{date_line}</span></div>
</div></body></html>"""

    tmp_html = tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w")
    tmp_html.write(html); tmp_html.close()
    subprocess.run([find_chrome(), "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
                    "--virtual-time-budget=20000", f"--print-to-pdf={a.out_pdf}",
                    f"file://{tmp_html.name}"], capture_output=True)
    os.unlink(tmp_html.name)
    if os.path.exists(a.out_pdf):
        print(f"PDF: {a.out_pdf} ({os.path.getsize(a.out_pdf)//1024} KB)")
    else:
        sys.exit("PDF render failed")

if __name__ == "__main__":
    main()
