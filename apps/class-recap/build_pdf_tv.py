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

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode()

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&'
         'family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">')

# TradeVantage "Paper desk" brand (the tradevantage.gg landing): paper ground with a faint grid,
# ink type, one signal yellow, mono uppercase labels, hairline rules, dark desk frames for charts.
CSS = r"""
:root{
  --paper:#F4F3EF;--white:#FFFFFF;--stone:#D9D8D3;--shadow:#E4E3DE;
  --ink:#111214;--graphite:#3A3C40;--mute:#6B6D72;--desk:#0E0F11;
  --signal:#FFD400;--up:#1F7A4A;--down:#B33A30;
  --sans:"Instrument Sans","Helvetica Neue",Arial,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:var(--paper);}
@page{size:A4;margin:0;}
body{margin:0;font-family:var(--sans);color:var(--ink);font-size:10.2pt;line-height:1.62;
  -webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;}
.page{padding:14mm 17mm;-webkit-box-decoration-break:clone;box-decoration-break:clone;}

/* ---------- cover ---------- */
.cover{height:297mm;padding:15mm 17mm 0;display:flex;flex-direction:column;break-after:page;position:relative;overflow:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;}
.topbar img{height:7.2mm;display:block;}
.eyebrow,.lbl{font-family:var(--mono);font-weight:500;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--graphite);}
.cover .eyebrow{margin-top:22mm;}
h1.title{font-family:var(--sans);font-weight:600;font-size:38pt;line-height:1.02;letter-spacing:-.035em;
  margin:5mm 0 0;max-width:15.5em;text-wrap:balance;}
.rows{margin-top:10mm;border-top:1px solid var(--ink);max-width:128mm;}
.row{display:grid;grid-template-columns:13mm 28mm 1fr;align-items:baseline;padding:2.6mm 0;border-bottom:1px solid var(--stone);font-size:10pt;}
.row .n,.row .k{font-family:var(--mono);font-size:7.4pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);}
.row .v{color:var(--ink);font-weight:500;}
.hero{position:relative;margin:auto -17mm 0;}
.hero img{display:block;width:100%;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 11%);mask-image:linear-gradient(to bottom,transparent,#000 11%);}
.tag{position:absolute;font-family:var(--mono);font-weight:500;font-size:8pt;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);line-height:1.25;white-space:nowrap;}
.tag small{display:block;color:var(--mute);font-size:7.4pt;letter-spacing:.08em;}
.sig{display:inline-block;width:2.2mm;height:2.2mm;background:var(--signal);border:1px solid var(--ink);margin-right:2mm;vertical-align:-.2mm;}

/* ---------- body ---------- */
h2{font-family:var(--sans);font-weight:600;font-size:19pt;line-height:1.1;letter-spacing:-.025em;
  margin:11mm 0 4mm;padding-top:3mm;border-top:1px solid var(--ink);break-after:avoid;break-inside:avoid;text-wrap:balance;}
h2::before{content:attr(data-n);display:block;font-family:var(--mono);font-weight:500;font-size:7.4pt;
  letter-spacing:.14em;color:var(--mute);margin-bottom:2.4mm;}
h3{font-family:var(--sans);font-weight:600;font-size:12.4pt;letter-spacing:-.015em;margin:7mm 0 2mm;break-after:avoid;}
p{margin:2.4mm 0;}
strong{font-weight:600;color:var(--ink);}
em{color:var(--graphite);}
hr{border:none;border-top:1px solid var(--stone);margin:8mm 0;}
ul,ol{margin:2.4mm 0;padding-left:5mm;}
li{margin:1.4mm 0;}
ul>li::marker{content:"\25AA  ";color:var(--ink);}
ol>li::marker{font-family:var(--mono);font-size:8.4pt;color:var(--mute);}
a,.wl{color:var(--ink);text-decoration:none;font-weight:500;
  background:linear-gradient(transparent 62%,rgba(255,212,0,.55) 62%);}
code{font-family:var(--mono);font-size:.86em;background:var(--white);border:1px solid var(--stone);padding:0 4px;}

/* figures: chart frames sit on a dark desk tile */
body{counter-reset:fig;}
figure{margin:6mm 0;break-inside:avoid;counter-increment:fig;}
figure img{display:block;width:100%;max-height:96mm;object-fit:contain;background:var(--desk);
  border:1px solid var(--ink);padding:1.6mm;}
figcaption{font-size:8.4pt;line-height:1.5;color:var(--graphite);margin-top:2.2mm;}
figcaption::before{content:"FIG " counter(fig, decimal-leading-zero);font-family:var(--mono);font-size:7pt;
  letter-spacing:.14em;color:var(--ink);font-weight:600;margin-right:2.4mm;}

/* callouts: white card, ink hairline, mono chip */
.callout{background:var(--white);border:1px solid var(--ink);padding:3.6mm 4.4mm;margin:5mm 0;break-inside:avoid;font-size:9.8pt;
  box-shadow:1.2mm 1.2mm 0 var(--shadow);}
.callout p:first-of-type{margin-top:0;}.callout p:last-child{margin-bottom:0;}
.callout-label{font-family:var(--mono);font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;font-weight:600;
  padding:1px 6px;margin-right:2.4mm;vertical-align:1px;border:1px solid var(--ink);}
.cl-note{background:var(--paper);color:var(--ink);}
.cl-tip{background:var(--signal);color:var(--ink);}
.cl-important{background:var(--ink);color:var(--signal);}
.cl-warning{background:var(--down);color:#fff;border-color:var(--down);}
.cl-note::before{content:"Note";}.cl-tip::before{content:"Tip";}.cl-important::before{content:"Key";}.cl-warning::before{content:"Risk";}

/* tables: white sheet, mono header, hairline rows */
table{border-collapse:collapse;width:100%;margin:5mm 0;font-size:8.6pt;background:var(--white);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);break-inside:auto;}
thead{display:table-header-group;}
th{text-align:left;padding:2.2mm 2.4mm;font-family:var(--mono);font-weight:500;font-size:6.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--ink);}
td{padding:2.2mm 2.4mm;border-top:1px solid var(--stone);vertical-align:top;}
tr{break-inside:avoid;}
td:first-child{font-weight:600;}

/* end mark */
.foot{margin:12mm 0 4mm;padding-top:3mm;border-top:1px solid var(--ink);display:flex;justify-content:space-between;
  font-family:var(--mono);font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);}
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
        return re.sub(r"\*\*|\[\[|\]\]|`", "", mm.group(1)).strip()
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
            out.append(f'[]{{.callout-label .cl-{ct}}}' + (f' **{ctitle}**' if ctitle else '') + '\n')
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
        text = re.sub(r"^\s*\d+\.\s+", "", mo.group(1))
        return f'<h2 data-n="{counter["n"]:02d} /">{text}</h2>'
    html_body = re.sub(r"<h2[^>]*>(.*?)</h2>", num_h2, html_body, flags=re.S)

    def embed(mo):
        fp = urllib.parse.unquote(mo.group(1))
        mime = "png" if fp.lower().endswith(".png") else "jpeg"
        return f'src="data:image/{mime};base64,{base64.b64encode(pathlib.Path(fp).read_bytes()).decode()}"'
    html_body = re.sub(r'src="([^"]+\.(?:jpg|jpeg|png))"', embed, html_body)

    # The cover shows the theme; "TradeVantage Class:" and the trailing "(date)" are implied by the page.
    theme = re.sub(r"^TradeVantage Class:\s*", "", title)
    theme = re.sub(r"\s*\(\d{4}-\d{2}-\d{2}\)\s*$", "", theme)
    syms = [x.strip().strip('"').replace("!", "") for x in re.sub(r"[\[\]]", "", fmv("symbols")).split(",") if x.strip()][:3]
    while len(syms) < 3: syms.append("")
    presenter = grab("Presenter").split(",")[0] or "Anthony Tjipto"
    rows = ""
    for i, (k, v) in enumerate([("Date", date_line), ("Duration", duration), ("Presenter", presenter), ("Platform", platform.split("(")[0].strip())], 1):
        if v: rows += f'<div class="row"><span class="n">{i:02d}</span><span class="k">{k}</span><span class="v">{v}</span></div>'
    lockup = f'data:image/svg+xml;base64,{b64(os.path.join(ASSETS, "lockup-paper.svg"))}'
    hero = f'data:image/jpeg;base64,{b64(os.path.join(ASSETS, "hero-desk.jpg"))}'
    # tags sit on the drawing's leader lines (positions measured on assets/hero-desk.jpg, 1440x800)
    tags = (f'<span class="tag" style="left:69%;top:5.4%"><span class="sig"></span>Class report<small>{date_line}</small></span>'
            f'<span class="tag" style="left:57.2%;top:20.6%">{syms[0]}</span>'
            f'<span class="tag" style="left:64.3%;top:34.4%">{syms[1]}</span>'
            f'<span class="tag" style="left:71.3%;top:46.4%">{syms[2]}</span>'
            f'<span class="tag" style="left:16.6%;top:33.4%;text-align:right;transform:translateX(-100%)">{duration}<small>on Zoom</small></span>')
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>{FONTS}
<style>{CSS}</style></head>
<body>
<section class="cover">
  <div class="topbar"><img src="{lockup}" alt="+vantage"><span class="lbl">tradevantage.gg</span></div>
  <div class="eyebrow">TradeVantage / Class report</div>
  <h1 class="title">{theme}</h1>
  <div class="rows">{rows}</div>
  <div class="hero"><img src="{hero}" alt="">{tags}</div>
</section>
<div class="page">
{html_body}
<div class="foot"><span>+vantage / tradevantage.gg</span><span>Class report / {date_line}</span></div>
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
