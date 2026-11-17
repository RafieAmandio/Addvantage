# Class recap bot

Class recording -> recap report + Paper desk PDF -> Drive -> tradevantage.gg -> Telegram channel.
Runs as Dokploy app `tradevantage-class-recap` on the TradeVantage VPS and polls the Drive folder `TradeVantage Class Inbox` every 30 min.
Dio's Mac feeds the inbox: `mac-install.sh` adds a launchd agent that uploads every `GMT..._Recording*.mp4` + `GMT..._Recording.transcript.vtt`
pair saved into `~/TradeVantage Class` (not ~/Downloads: macOS blocks background jobs there). Zoom API is not used (the university account can't have apps). See the docstring in
`recap.py` for the steps. One-time setup (secrets, chat ids, example recap on the volume): `.claude/class-recap-setup.sh`
on Dio's Mac.

- `/data/example-report.md` (volume, not in the image): a past recap the writer copies the format from.
- `/codex` = the worker's Codex volume `tradevantage-worker-codex` (same ChatGPT login as news ingestion, `codex:login` in the worker). If it gets signed out, re-run the worker's codex:login.
- `/data/state.json`: processed Zoom meetings. Delete an entry to reprocess that class.
- Run one pass by hand: `docker exec -it <container> python3 /app/recap.py --once`. `DRY_RUN=1` builds the PDF only.
- Download both the recording and the audio transcript from Zoom; the Mac waits for the pair.
- `assets/`: Paper desk cover art (hero desk from the landing, labels hidden) and the paper lockup.
