const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/technotech';

export const productService = {
  /**
   * Fetch all products from MongoDB Atlas
   */
  async getAll() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Impossible de joindre le serveur MongoDB, utilisation du cache local :', error.message);
      throw error;
    }
  },

  /**
   * Upload a single image file to backend server
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('images', file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur chargement image (${response.status})`);
    }
    const data = await response.json();
    return data.urls?.[0] || data.files?.[0];
  },

  /**
   * Upload multiple image files to backend server
   */
  async uploadMultipleImages(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur chargement images (${response.status})`);
    }
    const data = await response.json();
    return data.urls || [];
  },

  /**
   * Upload a base64 image (e.g. transparent PNG) to backend server
   */
  async uploadBase64(base64String, filename) {
    const response = await fetch(`${API_BASE_URL}/upload-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: base64String, filename }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur sauvegarde image (${response.status})`);
    }
    const data = await response.json();
    return data.url || data.path;
  },

  /**
   * Create a new product in MongoDB
   */
  async create(productData) {
    // Clean out temporary client id if present
    const { _id, id, ...payload } = productData;
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur création produit (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Update a product in MongoDB
   */
  async update(productId, productData) {
    const response = await fetch(`${API_BASE_URL}/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur modification produit (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Delete a product from MongoDB
   */
  async delete(productId) {
    const response = await fetch(`${API_BASE_URL}/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur suppression produit (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Reset collection in MongoDB with default products
   */
  async reset(defaultProducts) {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultProducts),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur réinitialisation produits (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Fetch all hero carousel slides from MongoDB Atlas
   */
  async getHeroSlides() {
    try {
      const response = await fetch(`${API_BASE_URL}/hero-slides`);
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Impossible de joindre les slides Hero distants, utilisation du cache local :', error.message);
      throw error;
    }
  },

  /**
   * Save all hero carousel slides to MongoDB Atlas
   */
  async saveHeroSlides(slides) {
    const response = await fetch(`${API_BASE_URL}/hero-slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slides),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur sauvegarde carrousel (${response.status})`);
    }

    return await response.json();
  },
};

