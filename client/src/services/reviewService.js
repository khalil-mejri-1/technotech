import { API_BASE_URL } from '../config/api.js';
import { getStoredReviews, saveStoredReviews, INITIAL_REVIEWS } from '../data/reviewsData.js';

const REVIEWS_ENDPOINT = `${API_BASE_URL}/reviews`;

export const reviewService = {
  /**
   * Get all customer reviews and screenshots from MongoDB
   */
  async getAll() {
    try {
      const res = await fetch(REVIEWS_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = data.filter((item) => {
          const key = item.id || item._id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        saveStoredReviews(unique);
        return unique;
      }
      return getStoredReviews();
    } catch (err) {
      console.warn('API non joignable, chargement des avis en cache local :', err.message);
      return getStoredReviews();
    }
  },

  /**
   * Save (create or update) a customer review in MongoDB
   */
  async save(reviewData) {
    const isUpdate = Boolean(reviewData._id || (reviewData.id && !String(reviewData.id).startsWith('rev-new-')));
    const targetId = reviewData._id || reviewData.id;

    try {
      const url = isUpdate ? `${REVIEWS_ENDPOINT}/${targetId}` : REVIEWS_ENDPOINT;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) {
        // If update failed with 404, fallback to POST creation
        if (isUpdate && res.status === 404) {
          const createRes = await fetch(REVIEWS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData),
          });
          if (createRes.ok) {
            const created = await createRes.json();
            this._syncLocal(created, false);
            return created;
          }
        }
        throw new Error(`HTTP error ${res.status}`);
      }

      const saved = await res.json();
      this._syncLocal(saved, isUpdate, targetId);
      return saved;
    } catch (err) {
      console.warn('Sauvegarde hors-ligne de l’avis client :', err.message);
      const fallback = {
        ...reviewData,
        id: targetId || `rev-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      this._syncLocal(fallback, isUpdate, targetId);
      return fallback;
    }
  },

  /**
   * Save multiple customer reviews at once to MongoDB (Batch Append)
   */
  async saveMany(reviewsList) {
    if (!Array.isArray(reviewsList) || reviewsList.length === 0) return [];
    try {
      const res = await fetch(`${REVIEWS_ENDPOINT}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewsList),
      });
      if (res.ok) {
        const inserted = await res.json();
        const current = getStoredReviews();
        const updated = [...inserted, ...current];
        saveStoredReviews(updated);
        return inserted;
      }
    } catch (err) {
      console.warn('Erreur batch save BD :', err.message);
    }
    // Fallback: save one by one
    const results = [];
    for (const r of reviewsList) {
      const saved = await this.save(r);
      results.push(saved);
    }
    return results;
  },

  /**
   * Helper to sync local storage and trigger real-time window events
   */
  _syncLocal(savedItem, isUpdate, originalId) {
    const current = getStoredReviews();
    const idToMatch = originalId || savedItem.id || savedItem._id;
    let updated;
    if (isUpdate) {
      updated = current.map((item) => ((item.id === idToMatch || item._id === idToMatch) ? savedItem : item));
    } else {
      updated = [savedItem, ...current];
    }
    saveStoredReviews(updated);
  },

  /**
   * Delete a customer review from MongoDB
   */
  async delete(reviewId) {
    try {
      await fetch(`${REVIEWS_ENDPOINT}/${reviewId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Suppression API échouée, suppression locale :', err.message);
    }
    const current = getStoredReviews();
    const updated = current.filter((item) => item.id !== reviewId && item._id !== reviewId);
    saveStoredReviews(updated);
    return true;
  },

  /**
   * Delete all customer reviews from MongoDB
   */
  async deleteAll() {
    try {
      await fetch(REVIEWS_ENDPOINT, { method: 'DELETE' });
    } catch (err) {
      console.warn('Suppression globale locale :', err.message);
    }
    saveStoredReviews([]);
    return true;
  },

  /**
   * Reset reviews to initial defaults in MongoDB
   */
  async reset() {
    try {
      const res = await fetch(`${REVIEWS_ENDPOINT}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        saveStoredReviews(data || []);
        return data || [];
      }
    } catch (err) {
      console.warn('Reset local des avis :', err.message);
    }
    saveStoredReviews([]);
    return [];
  },
};

export default reviewService;
