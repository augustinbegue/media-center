# Media Center Dashboard

A custom dashboard for the Intel NUC TV setup, replacing the poor Android TV experience. Built with SvelteKit (deployed on k3s) + a local Bun/TS agent on the NUC.

## Architecture

```
                        NUC (Windows 11)
                ┌─────────────────────────────┐
                │  Chrome (kiosk mode)        │
                │  ┌───────────────────────┐  │
                │  │ Dashboard UI          │──│──── HTTPS ──► dashboard.server.begue.cc
                │  │ (SvelteKit on k8s)    │  │                      │
                │  └───────┬───────────────┘  │               Jellyfin, Sonarr,
                │          │ ws://localhost    │               Radarr, Open-Meteo
                │          ▼                  │
                │  ┌───────────────────────┐  │
                │  │ NUC Agent (Bun/TS)    │  │
                │  │ port 9100             │  │
                │  └───────┬───────────────┘  │
                │          │ spawns            │
                │          ▼                  │
                │      UxPlay.exe             │
                └─────────────────────────────┘
```

## Status

| Step | Feature | Status |
|------|---------|--------|
| 1 | Project scaffolding (monorepo, SvelteKit, Tailwind v4, Bun agent) | ✅ Done |
| 2 | Shared types package | ✅ Done |
| 3 | NUC agent (WebSocket server, UxPlay management) | ✅ Done |
| 4 | Dashboard global styles & GlassCard UI primitive | ✅ Done |
| 5 | Scene system & agent WebSocket connection | ✅ Done |
| 6 | Widgets (Clock, Weather, NowPlaying, Jellyfin, Upcoming) | ✅ Done |
| 7 | API routes (weather, jellyfin, sonarr, radarr) | ✅ Done |
| 8 | Scene layouts (Ambient, Dashboard, NowPlaying, Hidden) | ✅ Done |
| 9 | Deployment (Dockerfile, k8s manifests, NUC startup) | ✅ Done |

## Scenes

| Scene | Trigger | Content |
|-------|---------|---------|
| `ambient` | Night (23:00–07:00) / idle | Clock, weather, Immich backdrop |
| `dashboard` | Daytime default | Widget grid (media, weather) |
| `nowPlaying` | UxPlay audio active | Album art, track info |
| `hidden` | UxPlay video active | Black screen |

## Local Development

```bash
# Install deps
bun install

# Run dashboard dev server
bun run dev

# Run NUC agent (separate terminal)
cd apps/nuc-agent && bun run dev
```

## Environment Variables

### Dashboard (`apps/dashboard/.env`)
```
PUBLIC_AGENT_WS_URL=ws://localhost:9100
PUBLIC_WEATHER_LAT=48.8566
PUBLIC_WEATHER_LON=2.3522
JELLYFIN_URL=https://jellyfin.server.begue.cc
JELLYFIN_PUBLIC_URL=https://jellyfin.server.begue.cc
JELLYFIN_API_KEY=<from OpenBao>
SONARR_URL=https://sonarr.server.begue.cc
SONARR_PUBLIC_URL=https://sonarr.server.begue.cc
SONARR_API_KEY=<from OpenBao>
RADARR_URL=https://radarr.server.begue.cc
RADARR_PUBLIC_URL=https://radarr.server.begue.cc
RADARR_API_KEY=<from OpenBao>
PUBLIC_AMBIENT_START=23:00
PUBLIC_AMBIENT_END=07:00
```

### NUC Agent
```
UXPLAY_PATH=C:\path\to\uxplay.exe
UXPLAY_ARGS=
WS_PORT=9100
```

## Deployment

```bash
# Build Docker image
docker build -t dashboard apps/dashboard

# Apply k8s manifests
kubectl apply -k k8s/
```

## Roadmap

- [ ] Immich photo slideshow backdrop in ambient scene
- [ ] Calendar widget (Google Calendar / CalDAV)
- [ ] Remote control support (gamepad / IR)
- [ ] Multi-user Jellyfin profiles
- [ ] Sonarr/Radarr download status widget
- [ ] System health monitoring
