import { API_BASE_URL } from '../config/api.js';

const ORDERS_ENDPOINT = `${API_BASE_URL}/orders`;
const LOCAL_STORAGE_KEY = 'technotech_orders_cache';

export const orderService = {
  /**
   * Submit a new customer order to MongoDB Atlas
   */
  async create(orderData) {
    try {
      const response = await fetch(ORDERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Erreur de commande (${response.status})`);
      }

      // Sync local cache
      this._saveToLocalCache(data);
      return data;
    } catch (err) {
      console.warn('API non disponible, sauvegarde locale de la commande :', err.message);
      // Fallback local storage for offline resilience
      const fallbackOrder = {
        _id: 'local-' + Date.now(),
        orderNumber: 'CMD-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900),
        ...orderData,
        status: 'en_attente',
        createdAt: new Date().toISOString(),
        isLocal: true,
      };
      this._saveToLocalCache(fallbackOrder);
      return fallbackOrder;
    }
  },

  /**
   * Fetch all orders (real-time polling friendly)
   */
  async getAll() {
    try {
      const response = await fetch(ORDERS_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const remoteOrders = await response.json();
      if (Array.isArray(remoteOrders)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteOrders));
        return remoteOrders;
      }
      return [];
    } catch (err) {
      // Return cached orders on network failure
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    try {
      const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur mise à jour statut');
      }
      return await response.json();
    } catch (err) {
      console.warn('Erreur mise à jour en ligne, fallback local :', err.message);
      // Update local storage
      const cached = this._getLocalOrders();
      const updated = cached.map((o) => (o._id === orderId ? { ...o, status } : o));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return { _id: orderId, status };
    }
  },

  /**
   * Delete order
   */
  async delete(orderId) {
    try {
      const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur suppression');
      }
    } catch (err) {
      console.warn('Erreur suppression serveur :', err.message);
    }
    // Remove from local cache
    const cached = this._getLocalOrders();
    const updated = cached.filter((o) => o._id !== orderId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return { id: orderId };
  },

  /**
   * Delete ALL orders
   */
  async deleteAll() {
    try {
      const response = await fetch(`${ORDERS_ENDPOINT}/all`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur suppression de toutes les commandes');
      }
    } catch (err) {
      console.warn('Erreur suppression serveur :', err.message);
    }
    // Clear local storage cache
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return { success: true };
  },

  _getLocalOrders() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _saveToLocalCache(newOrder) {
    const list = this._getLocalOrders();
    const filtered = list.filter((o) => o._id !== newOrder._id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newOrder, ...filtered]));
  },
};
