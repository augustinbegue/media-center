export const config = {
  wsPort: parseInt(process.env.WS_PORT ?? '9100'),
  uxplayPath: process.env.UXPLAY_PATH ?? 'uxplay',
  uxplayArgs: (process.env.UXPLAY_ARGS ?? '').split(' ').filter(Boolean),
  uxplayArtworkPath: process.env.UXPLAY_ARTWORK_PATH ?? '',
  uxplayMetadataPath: process.env.UXPLAY_METADATA_PATH ?? '',
  statsIntervalMs: parseInt(process.env.STATS_INTERVAL_MS ?? '5000'),
};
