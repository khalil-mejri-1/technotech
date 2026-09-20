import { API_BASE_URL } from '../config/api.js';
import { getStoredOffers, saveStoredOffers, INITIAL_OFFERS } from '../data/offersData.js';

const OFFERS_ENDPOINT = `${API_BASE_URL}/offers`;

export const offerService = {
  /**
   * Get all active offers for public display or all for admin
   */
  async getAll(includeAll = false) {
    try {
      const url = includeAll ? `${OFFERS_ENDPOINT}?all=true` : OFFERS_ENDPOINT;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredOffers(data);
        return data;
      }
      return getStoredOffers();
    } catch (err) {
      console.warn('API non joignable, chargement des offres en cache local :', err.message);
      return getStoredOffers();
    }
  },

  /**
   * Save or update an offer
   */
  async save(offerData) {
    const isUpdate = Boolean(offerData._id || offerData.id);
    const id = offerData._id || offerData.id;

    try {
      const url = isUpdate ? `${OFFERS_ENDPOINT}/${id}` : OFFERS_ENDPOINT;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const saved = await res.json();

      // Sync local cache
      const current = getStoredOffers();
      const updated = isUpdate
        ? current.map((item) => (item.id === id || item._id === id ? saved : item))
        : [saved, ...current];
      saveStoredOffers(updated);
      return saved;
    } catch (err) {
      console.warn('Sauvegarde hors ligne de l’offre :', err.message);
      const current = getStoredOffers();
      const fallbackOffer = {
        ...offerData,
        id: id || `offer-local-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      const updated = isUpdate
        ? current.map((item) => (item.id === id || item._id === id ? fallbackOffer : item))
        : [fallbackOffer, ...current];
      saveStoredOffers(updated);
      return fallbackOffer;
    }
  },

  /**
   * Delete an offer
   */
  async delete(offerId) {
    try {
      await fetch(`${OFFERS_ENDPOINT}/${offerId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Suppression locale :', err.message);
    }
    const current = getStoredOffers();
    const updated = current.filter((item) => item.id !== offerId && item._id !== offerId);
    saveStoredOffers(updated);
    return true;
  },

  /**
   * Delete ALL offers
   */
  async deleteAll() {
    try {
      await fetch(OFFERS_ENDPOINT, { method: 'DELETE' });
    } catch (err) {
      console.warn('Suppression globale des offres :', err.message);
    }
    saveStoredOffers([]);
    return true;
  },

  /**
   * Reset offers to initial defaults
   */
  async reset() {
    try {
      const res = await fetch(OFFERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INITIAL_OFFERS),
      });
      if (res.ok) {
        const data = await res.json();
        saveStoredOffers(data);
        return data;
      }
    } catch (err) {
      console.warn('Reset local des offres :', err.message);
    }
    saveStoredOffers(INITIAL_OFFERS);
    return INITIAL_OFFERS;
  },
};

export default offerService;
