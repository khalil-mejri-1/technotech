/**
 * TechnoTech Security Service
 * Handles unauthorized login attempt logging, notifications retrieval,
 * and security alert management.
 */

import { API_BASE_URL } from '../config/api.js';

const BASE = (API_BASE_URL || '/api/technotech').replace(/\/+$/, '');

export const securityService = {
  /**
   * Log an unauthorized login attempt immediately to the backend
   * @param {Object} data
   * @param {string} data.attemptedCode - The passcode entered by the user
   */
  logAttempt: async ({ attemptedCode = '' } = {}) => {
    try {
      const res = await fetch(`${BASE}/security/log-attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptedCode,
          clientTimestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('⚠️ [Security Service] Réponse échec enregistrement :', errData.error || res.status);
        return { success: false, status: res.status };
      }

      return await res.json();
    } catch (err) {
      console.warn('⚠️ [Security Service] Impossible d\'enregistrer la tentative :', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get all security notifications for the admin dashboard
   */
  getNotifications: async () => {
    try {
      const res = await fetch(`${BASE}/security/notifications`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        success: true,
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
        totalCount: typeof data.totalCount === 'number' ? data.totalCount : 0,
      };
    } catch (err) {
      console.warn('⚠️ [Security Service] Erreur récupération notifications :', err.message);
      return {
        success: false,
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        error: err.message,
      };
    }
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id) => {
    try {
      const res = await fetch(`${BASE}/security/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('Erreur marquer comme lu :', err);
      throw err;
    }
  },

  /**
   * Mark all security notifications as read
   */
  markAllAsRead: async () => {
    try {
      const res = await fetch(`${BASE}/security/notifications/read-all`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('Erreur tout marquer comme lu :', err);
      throw err;
    }
  },

  /**
   * Delete a single security notification
   */
  deleteNotification: async (id) => {
    try {
      const res = await fetch(`${BASE}/security/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('Erreur suppression notification :', err);
      throw err;
    }
  },

  /**
   * Clear all security notifications
   */
  clearAll: async () => {
    try {
      const res = await fetch(`${BASE}/security/notifications/clear-all`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('Erreur suppression historique :', err);
      throw err;
    }
  },
};
