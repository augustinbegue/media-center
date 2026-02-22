type LiquidSettings = {
  shadowColor: string;
  shadowBlur: number;
  shadowSpread: number;
  tintColor: string;
  tintOpacity: number;
  frostBlur: number;
  noiseFrequency: number;
  distortionStrength: number;
  backgroundUrl: string;
};

const STORAGE_KEY = 'dashboard-liquid-settings-v1';

const DEFAULTS: LiquidSettings = {
  shadowColor: '#ffffff',
  shadowBlur: 20,
  shadowSpread: -5,
  tintColor: '#ffffff',
  tintOpacity: 4,
  frostBlur: 2,
  noiseFrequency: 0.008,
  distortionStrength: 77,
  backgroundUrl: '',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseHexRgb(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [255, 255, 255] as const;
  const parts = clean.match(/.{1,2}/g);
  if (!parts || parts.length !== 3) return [255, 255, 255] as const;
  return parts.map((p) => Number.parseInt(p, 16)) as [number, number, number];
}

function sanitize(raw: Partial<LiquidSettings>): LiquidSettings {
  return {
    shadowColor: /^#[0-9a-fA-F]{6}$/.test(raw.shadowColor ?? '') ? (raw.shadowColor as string) : DEFAULTS.shadowColor,
    shadowBlur: clamp(Number(raw.shadowBlur ?? DEFAULTS.shadowBlur), 0, 20),
    shadowSpread: clamp(Number(raw.shadowSpread ?? DEFAULTS.shadowSpread), -10, 10),
    tintColor: /^#[0-9a-fA-F]{6}$/.test(raw.tintColor ?? '') ? (raw.tintColor as string) : DEFAULTS.tintColor,
    tintOpacity: clamp(Number(raw.tintOpacity ?? DEFAULTS.tintOpacity), 0, 100),
    frostBlur: clamp(Number(raw.frostBlur ?? DEFAULTS.frostBlur), 0, 30),
    noiseFrequency: clamp(Number(raw.noiseFrequency ?? DEFAULTS.noiseFrequency), 0, 0.03),
    distortionStrength: clamp(Number(raw.distortionStrength ?? DEFAULTS.distortionStrength), 0, 200),
    backgroundUrl: String(raw.backgroundUrl ?? '').trim(),
  };
}

function createLiquidSettingsStore() {
  let settings = $state<LiquidSettings>({ ...DEFAULTS });

  function hydrate() {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<LiquidSettings>;
      settings = sanitize(parsed);
    } catch {
      settings = { ...DEFAULTS };
    }
  }

  function persist() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function set<K extends keyof LiquidSettings>(key: K, value: LiquidSettings[K]) {
    settings = sanitize({ ...settings, [key]: value });
    persist();
  }

  function reset() {
    settings = { ...DEFAULTS };
    persist();
  }

  function cssVars() {
    const [tr, tg, tb] = parseHexRgb(settings.tintColor);
    return [
      `--liquid-shadow-color: ${settings.shadowColor}`,
      `--liquid-shadow-blur: ${settings.shadowBlur}px`,
      `--liquid-shadow-spread: ${settings.shadowSpread}px`,
      `--liquid-tint-rgb: ${tr}, ${tg}, ${tb}`,
      `--liquid-tint-opacity: ${settings.tintOpacity / 100}`,
      `--liquid-frost-blur: ${settings.frostBlur}px`,
      `--liquid-noise-frequency: ${settings.noiseFrequency}`,
      `--liquid-distortion-strength: ${settings.distortionStrength}`,
    ].join('; ');
  }

  return {
    defaults: DEFAULTS,
    get settings() {
      return settings;
    },
    hydrate,
    set,
    reset,
    cssVars,
  };
}

export const liquidSettings = createLiquidSettingsStore();
