import type { AgentMessage, UxPlayState, SystemStats } from '@media-center/shared';
import { AGENT_WS_URL } from '$lib/config';
import { scene } from './scene.svelte';

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 10000;

function createAgentStore() {
  let connected = $state(false);
  let uxplay = $state<UxPlayState>({ status: 'idle' });
  let stats = $state<SystemStats | null>(null);

  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (typeof window === 'undefined') return;

    ws = new WebSocket(AGENT_WS_URL);

    ws.onopen = () => {
      connected = true;
      pingTimer = setInterval(() => {
        ws?.send(JSON.stringify({ type: 'ping' }));
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (ev) => {
      let msg: AgentMessage;
      try {
        msg = JSON.parse(ev.data as string) as AgentMessage;
      } catch {
        return;
      }
      if (msg.type === 'uxplay:state') {
        uxplay = msg.data;
        scene.setUxPlayStatus(msg.data.status);
      } else if (msg.type === 'system:stats') {
        stats = msg.data;
      }
    };

    ws.onclose = () => {
      connected = false;
      cleanup();
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function cleanup() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  function send(msg: import('@media-center/shared').DashboardMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  return {
    get connected() {
      return connected;
    },
    get uxplay() {
      return uxplay;
    },
    get stats() {
      return stats;
    },
    connect,
    send,
  };
}

export const agent = createAgentStore();
