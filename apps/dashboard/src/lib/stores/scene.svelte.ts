import type { SceneType } from '@media-center/shared';
import { isAmbientTime } from '$lib/config';

type SceneOverride = SceneType | null;

function createSceneStore() {
  let current = $state<SceneType>('dashboard');
  let override = $state<SceneOverride>(null);
  let uxplayStatus = $state<'idle' | 'audio' | 'video'>('idle');

  function resolve(): SceneType {
    // Priority: UxPlay video > UxPlay audio > override > time schedule
    if (uxplayStatus === 'video') return 'hidden';
    if (uxplayStatus === 'audio') return 'nowPlaying';
    if (override) return override;
    return isAmbientTime() ? 'ambient' : 'dashboard';
  }

  function sync() {
    current = resolve();
  }

  return {
    get current() {
      return current;
    },
    setUxPlayStatus(status: 'idle' | 'audio' | 'video') {
      uxplayStatus = status;
      sync();
    },
    setOverride(scene: SceneOverride) {
      override = scene;
      sync();
    },
    sync,
  };
}

export const scene = createSceneStore();
