#!/bin/bash
# Runs on Dio's Mac (launchd agent gg.tradevantage.class-upload, installed by mac-install.sh).
# Uploads each class recording saved to ~/TradeVantage Class to the Drive inbox the VPS bot polls.
# A class = GMT<date>-<time>_Recording*.mp4 plus its GMT..._Recording.transcript.vtt (Zoom's download names).
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
DIR="$HOME/TradeVantage Class"
INBOX="gdrive:TradeVantage Class Inbox"
DONE="$DIR/.uploaded"
mkdir -p "$DONE"
shopt -s nullglob
for mp4 in "$DIR"/GMT*_Recording*.mp4; do
  stem=$(basename "$mp4" | sed -E 's/^(GMT[0-9]{8}-[0-9]{6}).*/\1/')
  vtt="$DIR/${stem}_Recording.transcript.vtt"
  [ -e "$DONE/$stem" ] && continue
  [ -f "$vtt" ] || { echo "$stem: waiting for the transcript file"; continue; }
  # still downloading? the size must hold for 15 s
  s1=$(stat -f %z "$mp4"); sleep 15; s2=$(stat -f %z "$mp4")
  [ "$s1" = "$s2" ] || { echo "$stem: still downloading"; continue; }
  echo "$stem: uploading"
  rclone copyto "$mp4" "$INBOX/$stem/video.mp4" && rclone copyto "$vtt" "$INBOX/$stem/transcript.vtt" \
    && rclone touch "$INBOX/$stem/.ready" && touch "$DONE/$stem" \
    && osascript -e "display notification \"Uploaded $stem, the recap posts in about 30 min\" with title \"TradeVantage class\"" \
    || echo "$stem: upload failed, will retry"
done
