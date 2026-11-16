#!/usr/bin/env python3
"""Class recap bot: class recording -> recap report + PDF -> Drive -> tradevantage.gg -> Telegram.

Polls the Drive inbox every POLL_MINUTES (Dio's Mac uploads each class there, see mac-watch.sh), then per class:
  1. downloads the MP4 and Zoom's own transcript (VTT)
  2. runs the Codex CLI (ChatGPT subscription) headless to read the transcript, pull chart frames and write report.md + summary.txt
  3. renders the branded +vantage PDF
  4. uploads MP4 + PDF to Drive, shares both "anyone with the link"
  5. inserts the video (video_modules) and the recap (class_reports) on tradevantage.gg
  6. posts the PDF with the summary to the members Telegram group
Failures DM TELEGRAM_ADMIN_CHAT_ID and retry next poll, up to MAX_ATTEMPTS.

Run once (no loop): recap.py --once.  Dry run (no Drive, DB or Telegram): DRY_RUN=1.
"""
import base64, datetime as dt, json, os, re, shutil, subprocess, sys, time, traceback, urllib.parse
from zoneinfo import ZoneInfo

import psycopg2
import requests

E = os.environ.get
DATA = E("DATA_DIR", "/data")
STATE = os.path.join(DATA, "state.json")
WIB = ZoneInfo("Asia/Jakarta")
HERE = os.path.dirname(os.path.abspath(__file__))
DRY = E("DRY_RUN") == "1"
MAX_ATTEMPTS = 3
FOLDER = E("DRIVE_FOLDER", "Trading Floor Reports")
SITE = E("SITE_URL", "https://tradevantage.gg")


def log(*a):
    print(dt.datetime.now(WIB).strftime("%Y-%m-%d %H:%M:%S"), *a, flush=True)


def run(cmd, **kw):
    log("$", " ".join(cmd)[:200])
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw).stdout


# ---------- state ----------
def load_state():
    try:
        return json.load(open(STATE))
    except FileNotFoundError:
        return {}


def save_state(s):
    tmp = STATE + ".tmp"
    json.dump(s, open(tmp, "w"), indent=1)
    os.replace(tmp, STATE)


# ---------- telegram ----------
def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{E('TELEGRAM_BOT_TOKEN')}/{method}", timeout=120, **kw)
    if not r.ok:
        raise RuntimeError(f"telegram {method}: {r.status_code} {r.text[:300]}")
    return r.json()


def alert(text):
    log("ALERT", text)
    if E("TELEGRAM_ADMIN_CHAT_ID") and E("TELEGRAM_BOT_TOKEN"):
        try:
            tg("sendMessage", data={"chat_id": E("TELEGRAM_ADMIN_CHAT_ID"), "text": f"Class recap: {text}"[:4000]})
        except Exception as e:  # never let the alert path crash the loop
            log("alert failed", e)


# ---------- inbox ----------
# Dio's Mac uploads each class recording to INBOX/<zoom file stem>/ (video.mp4, transcript.vtt, then .ready).
# The university Zoom account can't have API apps, so Zoom itself is never polled.
INBOX = f"gdrive:{E('DRIVE_INBOX', 'TradeVantage Class Inbox')}"


def inbox_ready():
    try:
        dirs = [d.rstrip("/") for d in run(["rclone", "lsf", INBOX, "--dirs-only"]).split()]
    except subprocess.CalledProcessError:
        return []  # inbox not created yet
    return [d for d in dirs if ".ready" in run(["rclone", "lsf", f"{INBOX}/{d}"]).split()]


def class_start(stem):
    """GMT20261116-085941 (Zoom's UTC start) -> aware datetime in WIB."""
    m = re.search(r"GMT(\d{8})-(\d{6})", stem)
    if not m:
        raise RuntimeError(f"can't read a start time from {stem!r}")
    return dt.datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S").replace(tzinfo=dt.timezone.utc).astimezone(WIB)


# ---------- report ----------
PROMPT = """You are writing the TradeVantage class recap for the class on {date} ({minutes} minutes on Zoom, presenter Anthony Tjipto, Zoom topic "{topic}").
Nobody is watching this run: do not ask questions, just finish. Files in the current directory:
- video.mp4: the recording
- transcript.vtt: Zoom's own transcript, Indonesian mixed with English, rough spelling
- example-report.md: a previous recap. Match its structure, depth, tone and formatting closely.

1. Read transcript.vtt fully. List the topics with their timestamps.
2. For each topic extract chart frames with
   ffmpeg -y -ss <seconds> -i video.mp4 -frames:v 1 -q:v 3 frames/{date}-NN-<short-label>.jpg -loglevel error
   (NN = 01, 02, ...). Read every frame you keep and read prices and levels off the chart. Prices come from the frames,
   exact as shown, never guessed or rounded. Use your image viewing tool on each frame. Keep 12 to 25 frames; delete the ones you don't use.
3. Write report.md in the example's format: frontmatter (type analysis, title "TradeVantage Class: <theme> ({date})",
   date {date}, symbols, timeframe multi, session daily, bias, tags, sources ["frames/"]); Meeting Overview where Date
   and Duration share ONE bullet exactly like "- **Date:** {date} · **Duration:** ~{minutes} minutes"; numbered topic
   sections with ![[frame-file.jpg]] embeds and an italic caption under each; callouts; a watchlist table; key lessons;
   concepts referenced. Write in English. If the transcript is unclear on something, say so instead of inventing it.
4. Write summary.txt, the Telegram caption for members: plain text, no markdown, at most 650 characters. First line is the
   report title. Then 3 to 5 lines starting with "• " giving the main calls (instrument, bias, key level).
Never use em dashes or en dashes anywhere in report.md or summary.txt; use commas, colons or "to".
"""


def write_report(work, date, minutes, topic):
    # The example is a real paid-class recap, so it lives on the data volume, not in the (public) image.
    example = os.path.join(DATA, "example-report.md")
    if not os.path.exists(example):
        raise RuntimeError(f"missing {example}: copy a past class recap there (see README)")
    shutil.copy(example, os.path.join(work, "example-report.md"))
    os.makedirs(os.path.join(work, "frames"), exist_ok=True)
    prompt = PROMPT.format(date=date, minutes=minutes, topic=topic)
    # Codex CLI on the ChatGPT subscription, sharing the worker's login (CODEX_HOME=/codex = worker volume).
    # ponytail: the CLI doesn't take the worker's refresh lock; a refresh race at the same second would sign one out. Own login if that ever happens.
    # The container is the sandbox, so Codex's own sandbox is off.
    subprocess.run(
        ["codex", "exec", "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check", "-C", work,
         *(["-m", E("CODEX_MODEL")] if E("CODEX_MODEL") else []), "-"],
        input=prompt, check=True, timeout=60 * 60, text=True,
    )
    rep, summ = os.path.join(work, "report.md"), os.path.join(work, "summary.txt")
    if not (os.path.exists(rep) and os.path.exists(summ)):
        raise RuntimeError("codex finished without report.md and summary.txt")
    body = open(rep).read()
    missing = [f for f in re.findall(r"!\[\[([^\]|]+)", body) if not os.path.exists(os.path.join(work, "frames", f))]
    if missing:
        raise RuntimeError(f"report embeds frames that don't exist: {missing[:5]}")
    for p in (rep, summ):  # house rule: no em or en dashes
        t = open(p).read().replace(" — ", ", ").replace("—", ", ").replace(" – ", " to ").replace("–", " to ")
        open(p, "w").write(t)
    return open(rep).read(), open(summ).read().strip()


def title_of(report):
    m = re.search(r'^title:\s*"?(.*?)"?\s*$', report, re.M)
    return m.group(1) if m else "TradeVantage Class"


# ---------- drive ----------
def drive_put(src, name):
    dest = f"gdrive:{FOLDER}/{name}"
    run(["rclone", "copyto", src, dest])
    fid = run(["rclone", "lsf", dest, "--format", "i"]).strip()
    # rclone link = Drive "anyone with the link" reader; members can't play or open it otherwise.
    run(["rclone", "link", dest])
    return fid


# ---------- site ----------
def publish_site(date, start, title, summary, minutes, video_id, pdf_id):
    slug = f"{date}-tradevantage-class"
    with psycopg2.connect(E("DATABASE_URL")) as db, db.cursor() as c:
        c.execute(
            """insert into video_modules (slug, title, description, category, provider, video_id, duration, published)
               values (%s, %s, %s, 'session', 'drive', %s, %s, true)
               on conflict (slug) do update set video_id = excluded.video_id, updated_at = now()""",
            (slug, f"{date} TradeVantage Class", title, video_id, f"{minutes} min"),
        )
        c.execute(
            """insert into class_reports (slug, title, summary, drive_id, published_at, published)
               values (%s, %s, %s, %s, %s, true)
               on conflict (slug) do update set title = excluded.title, summary = excluded.summary,
                 drive_id = excluded.drive_id, updated_at = now()""",
            (slug, title, summary, pdf_id, start),
        )


# ---------- pipeline ----------
def process(stem):
    start = class_start(stem)
    date = start.strftime("%Y-%m-%d")
    work = os.path.join(DATA, "work", stem)
    os.makedirs(work, exist_ok=True)
    run(["rclone", "copy", f"{INBOX}/{stem}", work, "--exclude", ".ready"])
    video = os.path.join(work, "video.mp4")
    if not (os.path.exists(video) and os.path.exists(os.path.join(work, "transcript.vtt"))):
        raise RuntimeError("inbox folder is missing video.mp4 or transcript.vtt")
    minutes = round(float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video])) / 60)

    report, summary = write_report(work, date, minutes, "TradeVantage Class")
    title = title_of(report)
    pdf = os.path.join(work, f"{date} TradeVantage Class.pdf")
    run(["python3", os.path.join(HERE, "build_pdf_tv.py"), os.path.join(work, "report.md"), pdf, "--imgdir", os.path.join(work, "frames")])

    if DRY:
        log("DRY_RUN: built", pdf, "\n" + summary)
        return "done", "dry run"

    video_id = drive_put(video, f"{date} TradeVantage Class.mp4")
    pdf_id = drive_put(pdf, f"{date} TradeVantage Class.pdf")
    drive_put(os.path.join(work, "report.md"), f"{date} TradeVantage Class.md")  # for the vault, private use

    publish_site(date, start, title, summary, minutes, video_id, pdf_id)

    caption = (f"{summary}\n\nRecording: https://drive.google.com/file/d/{video_id}/view"
               f"\nOn the site: {SITE}/app/education/reports")[:1024]
    with open(pdf, "rb") as f:
        tg("sendDocument", data={"chat_id": E("TELEGRAM_CHAT_ID"), "caption": caption},
           files={"document": (os.path.basename(pdf), f, "application/pdf")})

    run(["rclone", "purge", f"{INBOX}/{stem}"])  # to Drive trash; the video now lives in the reports folder
    shutil.rmtree(work, ignore_errors=True)  # the VPS disk is small
    return "done", f"video {video_id} pdf {pdf_id}"


def poll():
    state = load_state()
    for stem in inbox_ready():
        st = state.get(stem, {"attempts": 0})
        if st.get("status") == "done" or st.get("attempts", 0) >= MAX_ATTEMPTS:
            continue
        log("class", stem)
        try:
            status, note = process(stem)
        except Exception as e:
            st["attempts"] = st.get("attempts", 0) + 1
            status, note = "failed", f"{type(e).__name__}: {e}"
            traceback.print_exc()
            alert(f"{stem} attempt {st['attempts']}/{MAX_ATTEMPTS} failed: {note}")
        st.update(status=status, note=note, at=dt.datetime.now(WIB).isoformat())
        state[stem] = st
        save_state(state)
        log(status, note)


def main():
    os.makedirs(DATA, exist_ok=True)
    while True:
        try:
            poll()
        except Exception as e:
            traceback.print_exc()
            alert(f"poll failed: {type(e).__name__}: {e}")
        if "--once" in sys.argv:
            return
        time.sleep(int(E("POLL_MINUTES", "30")) * 60)


if __name__ == "__main__":
    main()
