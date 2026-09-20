import { API_BASE_URL } from '../config/api.js';

const SETTINGS_KEY = 'technotech_site_settings';
export const DEFAULT_SITE_SETTINGS = {
  disableInspect: true,
  disableRightClick: true,
  disableImageDragging: true,
  protectInAdmin: false,
};

export const settingsService = {
  /**
   * Get cached local settings immediately without network delay
   */
  getLocalSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage settings:', e);
    }
    return DEFAULT_SITE_SETTINGS;
  },

  /**
   * Fetch site settings from server, falls back to local cache
   */
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const merged = {
            ...DEFAULT_SITE_SETTINGS,
            disableInspect: Boolean(data.disableInspect),
            disableRightClick: Boolean(data.disableRightClick),
            disableImageDragging: Boolean(data.disableImageDragging),
            protectInAdmin: Boolean(data.protectInAdmin),
          };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('API settings non joignable, fallback local:', err.message);
    }
    return this.getLocalSettings();
  },

  /**
   * Update site settings on server and in local cache
   */
  async updateSettings(newSettings) {
    const current = this.getLocalSettings();
    const merged = {
      ...current,
      ...newSettings,
    };
    // Save to local cache first for instant UI response
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (res.ok) {
        const saved = await res.json();
        const finalData = {
          ...merged,
          disableInspect: Boolean(saved.disableInspect),
          disableRightClick: Boolean(saved.disableRightClick),
          disableImageDragging: Boolean(saved.disableImageDragging),
          protectInAdmin: Boolean(saved.protectInAdmin),
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalData));
        return finalData;
      }
    } catch (err) {
      console.warn('Erreur sauvegarde API settings:', err.message);
    }
    return merged;
  },
};
