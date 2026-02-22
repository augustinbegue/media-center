#!/usr/bin/env bash
# Deploy the NUC agent to the Intel NUC at 192.168.1.106.
# Usage: ./scripts/deploy-agent.sh
#
# Builds a self-contained bundle, copies it over SSH, and restarts
# the agent. Requires ssh key auth to augus@192.168.1.106.

set -euo pipefail

NUC_HOST="${NUC_HOST:-augus@192.168.1.106}"
AGENT_REMOTE_DIR="C:\\Users\\augus"
BUNDLE="/tmp/nuc-agent.js"

# ── Build ─────────────────────────────────────────────────────────────────────
echo "[deploy] Building agent bundle..."
bun build apps/nuc-agent/src/index.ts \
  --target=bun \
  --outfile="$BUNDLE"

# ── Copy ──────────────────────────────────────────────────────────────────────
echo "[deploy] Copying bundle to NUC..."
scp "$BUNDLE" "${NUC_HOST}:${AGENT_REMOTE_DIR}\\nuc-agent.js"

# ── Write launcher ────────────────────────────────────────────────────────────
echo "[deploy] Updating start-agent.cmd on NUC..."
ssh "$NUC_HOST" 'powershell -Command "
$bat = @\"
@echo off
set UXPLAY_PATH=C:\msys64\ucrt64\bin\uxplay.exe
set UXPLAY_ARGS=-h265 -s 3840x2160 -fps 60 -as wasapisink -vs fakevideosink -vsync -taper -ca C:\Users\augus\cover.jpg -md C:\Users\augus\metadata.txt
set UXPLAY_ARTWORK_PATH=C:\Users\augus\cover.jpg
set UXPLAY_METADATA_PATH=C:\Users\augus\metadata.txt
set BONJOUR_SDK_HOME=C:\Program Files\Bonjour SDK
C:\Users\augus\.bun\bin\bun.exe C:\Users\augus\nuc-agent.js >> C:\Users\augus\nuc-agent.log 2>&1
\"@
Set-Content -Path \"C:\Users\augus\start-agent.cmd\" -Value \$bat
"'

# ── Restart ───────────────────────────────────────────────────────────────────
echo "[deploy] Restarting agent on NUC..."
ssh "$NUC_HOST" 'powershell -Command "Stop-Process -Name bun,uxplay -Force -ErrorAction SilentlyContinue; Start-Sleep 1"'
ssh "$NUC_HOST" 'C:\Users\augus\start-agent.cmd' &
SSH_PID=$!

sleep 3

# Verify it started
if ssh "$NUC_HOST" 'powershell -Command "Get-Process bun -ErrorAction SilentlyContinue | Select-Object Id,Name"' | grep -q bun; then
  echo "[deploy] Agent is running."
else
  echo "[deploy] WARNING: bun process not found after restart."
  echo "[deploy] Check NUC log: ssh $NUC_HOST 'Get-Content C:\\Users\\augus\\nuc-agent.log'"
fi

echo "[deploy] Done. WebSocket: ws://192.168.1.106:9100"
