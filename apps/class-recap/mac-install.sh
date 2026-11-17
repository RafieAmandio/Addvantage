#!/bin/bash
# Installs the Mac side of the class recap: a launchd agent watching ~/TradeVantage Class.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)/mac-watch.sh"
BIN="$HOME/.local/bin/tv-class-upload.sh"
PL="$HOME/Library/LaunchAgents/gg.tradevantage.class-upload.plist"
mkdir -p "$HOME/.local/bin" "$HOME/TradeVantage Class" "$HOME/Library/Logs"
cp "$SRC" "$BIN" && chmod +x "$BIN"
cat > "$PL" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>gg.tradevantage.class-upload</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$BIN</string></array>
  <key>WatchPaths</key><array><string>$HOME/TradeVantage Class</string></array>
  <key>StartInterval</key><integer>600</integer>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/tv-class-upload.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/tv-class-upload.log</string>
</dict></plist>
PLIST
launchctl bootout "gui/$(id -u)/gg.tradevantage.class-upload" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PL"
echo "installed: save class recordings (mp4 + transcript.vtt) into ~/TradeVantage Class"
