import { API_BASE_URL, getImageUrl } from '../config/api.js';
import { settingsService } from './settingsService.js';

const FALLBACK_IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Envoie un fichier image ou une chaîne base64 directement vers l'API ImgBB.
 * Retourne le lien direct HTTPS permanent (ex: https://i.ibb.co/...)
 * Ce lien est ensuite enregistré dans la base de données MongoDB Atlas.
 */
async function uploadToImgBB(fileOrBase64, filename) {
  const activeKey = settingsService.getImgbbApiKey() || FALLBACK_IMGBB_API_KEY;
  const formData = new FormData();
  formData.append('key', activeKey);

  if (typeof fileOrBase64 === 'string') {
    // Si c'est une chaîne base64 (ex: data:image/png;base64,...), extraire les données pures
    const base64Clean = fileOrBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    formData.append('image', base64Clean);
    if (filename) formData.append('name', filename);
  } else {
    formData.append('image', fileOrBase64);
    if (fileOrBase64.name) formData.append('name', fileOrBase64.name);
  }

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur ImgBB (${response.status})`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    // Lien direct CDN de l'image prête à être enregistrée en base de données
    return result.data.display_url || result.data.url;
  }
  throw new Error('Réponse invalide reçue de ImgBB');
}

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
      if (!Array.isArray(data)) return [];
      return data.map((prod) => ({
        ...prod,
        images: Array.isArray(prod.images) ? prod.images.map(getImageUrl) : [],
      }));
    } catch (error) {
      console.warn('Impossible de joindre le serveur MongoDB, utilisation du cache local :', error.message);
      throw error;
    }
  },

  /**
   * Upload a single image file to ImgBB and return direct CDN link
   */
  async uploadImage(file) {
    try {
      return await uploadToImgBB(file);
    } catch (err) {
      console.warn('Téléversement ImgBB direct échoué, tentative via le serveur :', err.message);
      const formData = new FormData();
      formData.append('images', file);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw err;
      const data = await response.json();
      return getImageUrl(data.urls?.[0] || data.files?.[0]);
    }
  },

  /**
   * Upload multiple image files to ImgBB and return array of direct CDN links
   */
  async uploadMultipleImages(files) {
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadToImgBB(file);
        urls.push(url);
      }
      return urls;
    } catch (err) {
      console.warn('Téléversement ImgBB multiple échoué, fallback serveur :', err.message);
      const formData = new FormData();
      for (const file of files) {
        formData.append('images', file);
      }
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw err;
      const data = await response.json();
      return (data.urls || []).map(getImageUrl);
    }
  },

  /**
   * Upload a base64 image (e.g. transparent PNG) to ImgBB
   */
  async uploadBase64(base64String, filename) {
    try {
      return await uploadToImgBB(base64String, filename);
    } catch (err) {
      console.warn('Téléversement ImgBB base64 échoué, fallback serveur :', err.message);
      const response = await fetch(`${API_BASE_URL}/upload-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64String, filename }),
      });
      if (!response.ok) throw err;
      const data = await response.json();
      return getImageUrl(data.url || data.path);
    }
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

    const created = await response.json();
    return {
      ...created,
      images: Array.isArray(created.images) ? created.images.map(getImageUrl) : [],
    };
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

    const updated = await response.json();
    return {
      ...updated,
      images: Array.isArray(updated.images) ? updated.images.map(getImageUrl) : [],
    };
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

    const seeded = await response.json();
    if (!Array.isArray(seeded)) return [];
    return seeded.map((prod) => ({
      ...prod,
      images: Array.isArray(prod.images) ? prod.images.map(getImageUrl) : [],
    }));
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
      if (!Array.isArray(data)) return [];
      return data.map((slide) => ({
        ...slide,
        image: getImageUrl(slide.image),
        thumbnailImage: slide.thumbnailImage ? getImageUrl(slide.thumbnailImage) : '',
      }));
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

    const saved = await response.json();
    if (!Array.isArray(saved)) return [];
    return saved.map((slide) => ({
      ...slide,
      image: getImageUrl(slide.image),
      thumbnailImage: slide.thumbnailImage ? getImageUrl(slide.thumbnailImage) : '',
    }));
  },
};
