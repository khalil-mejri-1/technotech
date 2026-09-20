import { API_BASE_URL } from '../config/api.js';

const SETTINGS_KEY = 'technotech_site_settings';
export const DEFAULT_SITE_SETTINGS = {
  disableInspect: true,
  disableRightClick: true,
  disableImageDragging: true,
  protectInAdmin: false,
  whatsappNumber: '96086581',
  imgbbApiKey: import.meta.env.VITE_IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff',
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
   * Returns current active WhatsApp number for links and display
   */
  getWhatsAppNumber() {
    const s = this.getLocalSettings();
    return s.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber;
  },

  /**
   * Returns current active ImgBB API key
   */
  getImgbbApiKey() {
    const s = this.getLocalSettings();
    return s.imgbbApiKey || DEFAULT_SITE_SETTINGS.imgbbApiKey;
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
            whatsappNumber: (data.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber).toString().trim(),
            imgbbApiKey: (data.imgbbApiKey || DEFAULT_SITE_SETTINGS.imgbbApiKey).toString().trim(),
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
      whatsappNumber: (newSettings.whatsappNumber !== undefined ? newSettings.whatsappNumber : current.whatsappNumber).toString().trim(),
      imgbbApiKey: (newSettings.imgbbApiKey !== undefined ? newSettings.imgbbApiKey : current.imgbbApiKey).toString().trim(),
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
          whatsappNumber: (saved.whatsappNumber || merged.whatsappNumber).toString().trim(),
          imgbbApiKey: (saved.imgbbApiKey || merged.imgbbApiKey).toString().trim(),
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
