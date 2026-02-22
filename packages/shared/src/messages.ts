import type { UxPlayState, SystemStats } from './types.js';

// Agent → Dashboard
export type AgentMessage =
  | { type: 'uxplay:state'; data: UxPlayState }
  | { type: 'system:stats'; data: SystemStats }
  | { type: 'pong' };

// Dashboard → Agent
export type DashboardMessage =
  | { type: 'uxplay:command'; data: { action: 'start' | 'stop' | 'restart' } }
  | { type: 'ping' };
