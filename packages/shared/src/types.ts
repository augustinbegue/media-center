export type SceneType = 'ambient' | 'dashboard' | 'nowPlaying' | 'hidden';

export type UxPlayStatus = 'idle' | 'audio' | 'video';

export interface UxPlayMetadata {
  title: string;
  artist: string;
  album: string;
  genre?: string;
  artwork?: string;
}

export interface UxPlayState {
  status: UxPlayStatus;
  metadata?: UxPlayMetadata;
}

export interface SystemStats {
  cpuPercent: number;
  memUsedMb: number;
  memTotalMb: number;
  uptime: number;
}
