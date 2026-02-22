import type { ServerWebSocket } from 'bun';
import type { AgentMessage, DashboardMessage } from '@media-center/shared';
import { config } from './config.js';
import { UxPlayManager } from './uxplay.js';
import { getSystemStats } from './system.js';

const clients = new Set<ServerWebSocket<unknown>>();

function broadcast(msg: AgentMessage) {
  const json = JSON.stringify(msg);
  for (const ws of clients) {
    ws.send(json);
  }
}

const uxplay = new UxPlayManager(config.uxplayPath, config.uxplayArgs, (state) => {
  broadcast({ type: 'uxplay:state', data: state });
}, config.uxplayArtworkPath || undefined, config.uxplayMetadataPath || undefined);

uxplay.start();

// Periodic stats broadcast
setInterval(() => {
  broadcast({ type: 'system:stats', data: getSystemStats() });
}, config.statsIntervalMs);

const server = Bun.serve({
  port: config.wsPort,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response('NUC Agent — WebSocket on ws://localhost:' + config.wsPort, {
      status: 200,
    });
  },
  websocket: {
    open(ws) {
      clients.add(ws);
      console.log(`[ws] Client connected (${clients.size} total)`);
      // Send current state immediately
      ws.send(JSON.stringify({ type: 'uxplay:state', data: uxplay.getState() } satisfies AgentMessage));
      ws.send(JSON.stringify({ type: 'system:stats', data: getSystemStats() } satisfies AgentMessage));
    },
    message(ws, raw) {
      let msg: DashboardMessage;
      try {
        msg = JSON.parse(raw as string) as DashboardMessage;
      } catch {
        return;
      }
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' } satisfies AgentMessage));
        return;
      }
      if (msg.type === 'uxplay:command') {
        const { action } = msg.data;
        if (action === 'start') uxplay.start();
        if (action === 'stop') uxplay.stop();
        if (action === 'restart') uxplay.restart();
      }
    },
    close(ws) {
      clients.delete(ws);
      console.log(`[ws] Client disconnected (${clients.size} remaining)`);
    },
  },
});

console.log(`[agent] WebSocket server listening on ws://localhost:${server.port}`);
