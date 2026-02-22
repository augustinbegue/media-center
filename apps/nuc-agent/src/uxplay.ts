import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import type { UxPlayState } from '@media-center/shared';

type StateChangeCallback = (state: UxPlayState) => void;

export class UxPlayManager {
  private proc: ChildProcess | null = null;
  private state: UxPlayState = { status: 'idle' };
  private onStateChange: StateChangeCallback;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private artworkDebounce: ReturnType<typeof setTimeout> | null = null;
  private metadataDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly path: string,
    private readonly args: string[],
    onStateChange: StateChangeCallback,
    private readonly artworkPath?: string,
    private readonly metadataPath?: string,
  ) {
    this.onStateChange = onStateChange;
  }

  getState(): UxPlayState {
    return this.state;
  }

  start() {
    this.stopped = false;
    this.spawn();
    this.watchArtwork();
    this.watchMetadata();
  }

  stop() {
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.artworkPath) fs.unwatchFile(this.artworkPath);
    if (this.metadataPath) fs.unwatchFile(this.metadataPath);
    this.proc?.kill();
    this.proc = null;
    this.setState({ status: 'idle' });
  }

  restart() {
    this.proc?.kill();
  }

  private spawn() {
    if (this.stopped) return;

    console.log(`[uxplay] Spawning: ${this.path} ${this.args.join(' ')}`);

    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(this.path, this.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      console.error(`[uxplay] Failed to spawn: ${(err as Error).message}`);
      if (!this.stopped) {
        console.log('[uxplay] Retrying in 3s...');
        this.restartTimer = setTimeout(() => this.spawn(), 3000);
      }
      return;
    }

    this.proc = proc;

    const onData = (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n')) {
        this.parseLine(line.trim());
      }
    };
    proc.stdout?.on('data', onData);
    proc.stdout?.on('error', () => {});
    proc.stderr?.on('data', onData);
    proc.stderr?.on('error', () => {});

    proc.on('error', (err) => {
      console.error(`[uxplay] Process error: ${err.message}`);
      this.proc = null;
      this.setState({ status: 'idle' });
      if (!this.stopped) {
        console.log('[uxplay] Restarting in 3s...');
        this.restartTimer = setTimeout(() => this.spawn(), 3000);
      }
    });

    proc.on('exit', (code) => {
      if (this.proc !== proc) return;
      console.log(`[uxplay] Exited with code ${code}`);
      this.proc = null;
      this.setState({ status: 'idle' });
      if (!this.stopped) {
        console.log('[uxplay] Restarting in 3s...');
        this.restartTimer = setTimeout(() => this.spawn(), 3000);
      }
    });
  }

  // --- Artwork file watcher ---

  private watchArtwork() {
    if (!this.artworkPath) return;
    this.loadArtwork();
    fs.watchFile(this.artworkPath, { persistent: false, interval: 500 }, (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs && curr.size > 0) {
        if (this.artworkDebounce) clearTimeout(this.artworkDebounce);
        this.artworkDebounce = setTimeout(() => this.loadArtwork(), 150);
      }
    });
  }

  private loadArtwork() {
    if (!this.artworkPath || this.state.status !== 'audio') return;
    try {
      const data = fs.readFileSync(this.artworkPath);
      if (data.length < 500) return; // skip uxplay's 1×1 placeholder PNG
      const meta = { ...(this.state.metadata ?? { title: '', artist: '', album: '' }) };
      meta.artwork = `data:image/jpeg;base64,${data.toString('base64')}`;
      this.setState({ status: 'audio', metadata: meta });
    } catch {
      // file not ready, ignore
    }
  }

  // --- Metadata file watcher (-md flag) ---

  private watchMetadata() {
    if (!this.metadataPath) return;
    fs.watchFile(this.metadataPath, { persistent: false, interval: 300 }, (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs) {
        if (this.metadataDebounce) clearTimeout(this.metadataDebounce);
        this.metadataDebounce = setTimeout(() => this.loadMetadata(), 100);
      }
    });
  }

  private loadMetadata() {
    if (!this.metadataPath || this.state.status !== 'audio') return;
    let text: string;
    try {
      text = fs.readFileSync(this.metadataPath, 'utf8');
    } catch {
      return;
    }
    if (text.trim() === 'no data') return;

    const meta = { ...(this.state.metadata ?? { title: '', artist: '', album: '' }) };
    for (const line of text.split('\n')) {
      const m = line.match(/^(\w[\w\s]*):\s+(.+)$/);
      if (!m) continue;
      const key = m[1].trim().toLowerCase();
      const value = m[2].trim();
      if (key === 'title') meta.title = value;
      else if (key === 'artist') meta.artist = value;
      else if (key === 'album') meta.album = value;
      else if (key === 'genre') meta.genre = value;
    }
    this.setState({ status: 'audio', metadata: meta });
  }

  // --- Stdout/stderr line parser (session state only) ---

  private parseLine(line: string) {
    if (!line) return;

    if (line.includes('raop_rtp_mirror starting mirroring')) {
      this.setState({ status: 'video' });
      return;
    }

    if (line.includes('start audio connection')) {
      if (this.state.status !== 'video') {
        this.setState({ status: 'audio', metadata: { title: '', artist: '', album: '' } });
      }
      return;
    }

    if (line.includes('Connection closed on socket')) {
      this.setState({ status: 'idle' });
      return;
    }
  }

  private setState(state: UxPlayState) {
    const prev = JSON.stringify(this.state);
    this.state = state;
    if (JSON.stringify(state) !== prev) {
      this.onStateChange(state);
    }
  }
}
