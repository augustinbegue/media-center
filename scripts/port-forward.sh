#!/usr/bin/env bash
# Port-forward cluster media services to localhost for local dashboard dev.
# Usage: ./scripts/port-forward.sh
# Stop with Ctrl-C — all child processes are cleaned up automatically.

set -euo pipefail

NAMESPACE=${NAMESPACE:-media}

# service-name -> local:remote port
declare -A SERVICES=(
  [jellyfin]="8096:8096"
  [sonarr]="8989:8989"
  [radarr]="7878:7878"
)

PIDS=()

cleanup() {
  echo ""
  echo "Stopping port-forwards..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait
  echo "Done."
}
trap cleanup EXIT INT TERM

for svc in "${!SERVICES[@]}"; do
  ports="${SERVICES[$svc]}"
  local_port="${ports%%:*}"
  echo "  Forwarding $svc -> http://localhost:$local_port"
  kubectl port-forward "svc/$svc" "$ports" -n "$NAMESPACE" &>/dev/null &
  PIDS+=($!)
done

cat <<EOF

Port-forwards active. Add to apps/dashboard/.env.local:

  JELLYFIN_URL=http://localhost:8096
  SONARR_URL=http://localhost:8989
  RADARR_URL=http://localhost:7878

Press Ctrl-C to stop.
EOF

wait
