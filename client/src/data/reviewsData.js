// Data manager for customer reviews & screenshots (TechnoTech)
// Empty by default: user adds real customer reviews & proofs from Admin dashboard

export const INITIAL_REVIEWS = [];

const STORAGE_KEY_REVIEWS = 'technotech_customer_reviews_cache';

export const getStoredReviews = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const unique = parsed.filter((r) => {
      const k = r.id || r._id;
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return unique;
  } catch {
    return [];
  }
};

export const saveStoredReviews = (reviews) => {
  try {
    if (Array.isArray(reviews)) {
      const seen = new Set();
      const unique = reviews.filter((r) => {
        const k = r.id || r._id;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(unique));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('technotech_reviews_updated', { detail: unique }));
      }
    }
  } catch (e) {
    console.warn('Erreur lors de la sauvegarde des avis clients :', e);
  }
};

export const addStoredReview = (newReview) => {
  try {
    const current = getStoredReviews();
    const updated = [newReview, ...current];
    saveStoredReviews(updated);
    return updated;
  } catch {
    return getStoredReviews();
  }
};

export const updateStoredReview = (reviewId, updatedData) => {
  try {
    const current = getStoredReviews();
    const updated = current.map((r) => ((r.id || r._id) === reviewId ? { ...r, ...updatedData } : r));
    saveStoredReviews(updated);
    return updated;
  } catch {
    return getStoredReviews();
  }
};

export const deleteStoredReview = (reviewId) => {
  try {
    const current = getStoredReviews();
    const updated = current.filter((r) => (r.id || r._id) !== reviewId);
    saveStoredReviews(updated);
    return updated;
  } catch {
    return getStoredReviews();
  }
};

export const resetStoredReviews = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('technotech_reviews_updated', { detail: [] }));
    }
    return [];
  } catch {
    return [];
  }
};
