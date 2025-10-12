import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../config/appSettings';

function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source || {})) {
    const sv = source[key];
    const tv = out[key];
    if (Array.isArray(sv)) out[key] = [...sv];
    else if (typeof sv === 'object' && sv !== null) out[key] = deepMerge(tv || {}, sv);
    else out[key] = sv;
  }
  return out;
}

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings(deepMerge(DEFAULT_SETTINGS, parsed));
      }
    } catch {
      // noop
    }
    setLoading(false);
  }, []);

  const save = useCallback((patch) => {
    setSettings((prev) => {
      const merged = deepMerge(prev, patch);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // noop
      }
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(SETTINGS_STORAGE_KEY); } catch { /* noop */ }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, loading, save, reset };
}
