# Class recap bot

Zoom cloud recording of the TradeVantage class -> recap report + branded PDF -> Drive -> tradevantage.gg -> Telegram.
Runs as Dokploy app `tradevantage-class-recap` on the TradeVantage VPS, polls Zoom every 30 min. See the docstring in
`recap.py` for the steps. One-time setup (secrets, chat ids, example recap on the volume): `.claude/class-recap-setup.sh`
on Dio's Mac.

- `/data/example-report.md` (volume, not in the image): a past recap the writer copies the format from.
- `/codex` = the worker's Codex volume `tradevantage-worker-codex` (same ChatGPT login as news ingestion, `codex:login` in the worker). If it gets signed out, re-run the worker's codex:login.
- `/data/state.json`: processed Zoom meetings. Delete an entry to reprocess that class.
- Run one pass by hand: `docker exec -it <container> python3 /app/recap.py --once`. `DRY_RUN=1` builds the PDF only.
- Needs Zoom "Audio transcript" on; without a transcript 8h after the class it alerts the admin chat and retries.
