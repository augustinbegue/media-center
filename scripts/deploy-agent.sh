#!/usr/bin/env bash
# Full setup & deploy script for the NUC agent and Chrome kiosk.
#
# Usage:
#   ./scripts/deploy-agent.sh          # build, copy, and run full setup
#   ./scripts/deploy-agent.sh --agent  # rebuild + restart agent only (fast update)
#
# Requires SSH key auth to NUC_HOST (default: augus@192.168.1.106).

set -euo pipefail

NUC_HOST="${NUC_HOST:-augus@192.168.1.106}"
BUNDLE="/tmp/nuc-agent.js"
SETUP_SCRIPT="/tmp/nuc-setup.ps1"
FAST_MODE=0
[[ "${1:-}" == "--agent" ]] && FAST_MODE=1

# ── 1. Build bundle ────────────────────────────────────────────────────────────
echo "[deploy] Building agent bundle..."
bun build apps/nuc-agent/src/index.ts \
  --target=bun \
  --outfile="$BUNDLE"
echo "[deploy] Bundle: $(du -sh "$BUNDLE" | cut -f1)"

# ── 2. Copy bundle ─────────────────────────────────────────────────────────────
echo "[deploy] Copying bundle to NUC..."
scp "$BUNDLE" "${NUC_HOST}:C:\\Users\\augus\\nuc-agent.js"

if [[ $FAST_MODE -eq 1 ]]; then
  echo "[deploy] Fast mode: restarting agent only..."
  ssh "$NUC_HOST" 'powershell -Command "Stop-Process -Name bun,uxplay -Force -ErrorAction SilentlyContinue; Start-Sleep 1; Start-ScheduledTask -TaskName MediaCenter-Agent"'
  echo "[deploy] Done."
  exit 0
fi

# ── 3. Write PowerShell setup script ──────────────────────────────────────────
cat > "$SETUP_SCRIPT" << 'POWERSHELL'
$ErrorActionPreference = "Stop"
$NUC_USER = $env:USERNAME

Write-Host "[setup] Running as: $NUC_USER"

# ── Install Bun ───────────────────────────────────────────────────────────────
$bunExe = "$env:USERPROFILE\.bun\bin\bun.exe"
if (-not (Test-Path $bunExe)) {
  Write-Host "[setup] Installing Bun..."
  irm bun.sh/install.ps1 | iex
} else {
  $bunVer = & $bunExe --version 2>$null
  Write-Host "[setup] Bun already installed: $bunVer"
}

# ── Write agent launcher ───────────────────────────────────────────────────────
Write-Host "[setup] Writing start-agent.cmd..."
$agentCmd = @"
@echo off
set UXPLAY_PATH=C:\msys64\ucrt64\bin\uxplay.exe
set UXPLAY_ARGS=-h265 -s 3840x2160 -fps 60 -as wasapisink -vs fakevideosink -vsync -taper -ca C:\Users\augus\cover.jpg -md C:\Users\augus\metadata.txt
set UXPLAY_ARTWORK_PATH=C:\Users\augus\cover.jpg
set UXPLAY_METADATA_PATH=C:\Users\augus\metadata.txt
set BONJOUR_SDK_HOME=C:\Program Files\Bonjour SDK
"$env:USERPROFILE\.bun\bin\bun.exe" "$env:USERPROFILE\nuc-agent.js" >> "$env:USERPROFILE\nuc-agent.log" 2>&1
"@
Set-Content -Path "$env:USERPROFILE\start-agent.cmd" -Value $agentCmd

# ── Scheduled task: Agent ─────────────────────────────────────────────────────
Write-Host "[setup] Registering MediaCenter-Agent task..."
$agentAction = New-ScheduledTaskAction `
  -Execute "cmd.exe" `
  -Argument "/C `"$env:USERPROFILE\start-agent.cmd`""

$agentTrigger = New-ScheduledTaskTrigger -AtLogOn -User $NUC_USER

$agentSettings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew `
  -RestartCount 5 `
  -RestartInterval (New-TimeSpan -Minutes 1)

$agentPrincipal = New-ScheduledTaskPrincipal `
  -UserId $NUC_USER `
  -LogonType Interactive `
  -RunLevel Highest

Register-ScheduledTask `
  -TaskName "MediaCenter-Agent" `
  -Action $agentAction `
  -Trigger $agentTrigger `
  -Settings $agentSettings `
  -Principal $agentPrincipal `
  -Force | Out-Null

Write-Host "[setup] MediaCenter-Agent task registered."

# ── Scheduled task: Chrome kiosk ──────────────────────────────────────────────
Write-Host "[setup] Registering MediaCenter-Chrome task..."
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
  $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

$chromeArgs = (
  "--kiosk",
  "--noerrdialogs",
  "--disable-infobars",
  "--disable-session-crashed-bubble",
  "--disable-features=TranslateUI",
  "--no-first-run",
  "--disable-restore-session-state",
  "--start-fullscreen",
  "https://media.server.begue.cc"
) -join " "

$chromeAction = New-ScheduledTaskAction `
  -Execute $chromePath `
  -Argument $chromeArgs

# Trigger at logon with a 10-second delay (lets agent start first)
$chromeTrigger = New-ScheduledTaskTrigger -AtLogOn -User $NUC_USER
$chromeTrigger.Delay = "PT10S"

$chromeSettings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew

$chromePrincipal = New-ScheduledTaskPrincipal `
  -UserId $NUC_USER `
  -LogonType Interactive `
  -RunLevel Highest

Register-ScheduledTask `
  -TaskName "MediaCenter-Chrome" `
  -Action $chromeAction `
  -Trigger $chromeTrigger `
  -Settings $chromeSettings `
  -Principal $chromePrincipal `
  -Force | Out-Null

Write-Host "[setup] MediaCenter-Chrome task registered."

# ── Start tasks now ───────────────────────────────────────────────────────────
Write-Host "[setup] Stopping any running agent..."
Stop-Process -Name bun,uxplay -Force -ErrorAction SilentlyContinue
Start-Sleep 1

Write-Host "[setup] Starting MediaCenter-Agent..."
Start-ScheduledTask -TaskName "MediaCenter-Agent"
Start-Sleep 3

$bunRunning = Get-Process bun -ErrorAction SilentlyContinue
if ($bunRunning) {
  Write-Host "[setup] Agent running (PID $($bunRunning.Id))."
} else {
  Write-Warning "[setup] Agent did not start. Check: $env:USERPROFILE\nuc-agent.log"
}

Write-Host ""
Write-Host "[setup] Setup complete."
Write-Host "  Agent task:  MediaCenter-Agent  (starts at logon, auto-restart x5)"
Write-Host "  Chrome task: MediaCenter-Chrome (starts at logon +10s)"
Write-Host "  Dashboard:   https://media.server.begue.cc"
Write-Host ""
Write-Host "  To start Chrome kiosk now:"
Write-Host "    Start-ScheduledTask -TaskName MediaCenter-Chrome"
POWERSHELL

# ── 4. Copy and run setup ──────────────────────────────────────────────────────
echo "[deploy] Copying setup script to NUC..."
scp "$SETUP_SCRIPT" "${NUC_HOST}:C:\\Users\\augus\\nuc-setup.ps1"

echo "[deploy] Running setup on NUC..."
ssh "$NUC_HOST" "powershell -ExecutionPolicy Bypass -File C:\\Users\\augus\\nuc-setup.ps1"

echo ""
echo "[deploy] All done."
echo "  Reboot NUC (or log off/on) to test full startup sequence."
echo "  Fast updates: ./scripts/deploy-agent.sh --agent"
