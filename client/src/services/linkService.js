import { API_BASE_URL } from '../config/api.js';

const LINKS_ENDPOINT = `${API_BASE_URL}/links`;

export const linkService = {
  /**
   * Fetch all links and statistics directly from MongoDB
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.productName) query.append('productName', params.productName);
    if (params.status) query.append('status', params.status);

    const url = `${LINKS_ENDPOINT}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur serveur (${response.status}) lors du chargement des liens`);
    }
    return await response.json();
  },

  /**
   * Register ready links directly in MongoDB
   */
  async addLinks({ productName, productId = '', urls, notes = '' }) {
    let urlList = [];
    if (Array.isArray(urls)) {
      urlList = urls.map((u) => String(u).trim()).filter((u) => u.length > 0);
    } else if (typeof urls === 'string') {
      urlList = urls.split(/[\r\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0);
    }

    if (urlList.length === 0) {
      throw new Error('Veuillez fournir au moins un lien valide.');
    }

    const response = await fetch(LINKS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, productId, urls: urlList, notes }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l’enregistrement des liens dans la base de données');
    }
    return data;
  },

  /**
   * Claim / Import ready link(s) directly from MongoDB
   */
  async claimLink({ productName = 'Gemini Pro', count = 1, productId = '', orderNumber = '' } = {}) {
    const response = await fetch(`${LINKS_ENDPOINT}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, count, productId, orderNumber }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Aucun lien disponible pour ce produit dans la base de données.');
    }
    return data;
  },

  /**
   * Delete single link from MongoDB
   */
  async deleteLink(id) {
    const response = await fetch(`${LINKS_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la suppression du lien dans la base de données');
    }
    return data;
  },

  /**
   * Clean up used links from MongoDB
   */
  async clearUsedLinks(productName = '') {
    const query = productName ? `?productName=${encodeURIComponent(productName)}` : '';
    const response = await fetch(`${LINKS_ENDPOINT}/cleanup/used${query}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du nettoyage des liens dans la base de données');
    }
    return data;
  },
};

