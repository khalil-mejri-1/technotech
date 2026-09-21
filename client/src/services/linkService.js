import { API_BASE_URL } from '../config/api.js';

const LINKS_ENDPOINT = `${API_BASE_URL}/links`;
const LOCAL_STORAGE_KEY = 'technotech_links_cache';

export const linkService = {
  /**
   * Helper to retrieve cached links from localStorage
   */
  _getLocalLinks() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Helper to save links to localStorage
   */
  _saveLocalLinks(links) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
    } catch (e) {
      console.warn('Erreur cache local liens:', e);
    }
  },

  /**
   * Fetch all links and statistics
   */
  async getAll(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.productName) query.append('productName', params.productName);
      if (params.status) query.append('status', params.status);

      const url = `${LINKS_ENDPOINT}${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const data = await response.json();
      if (Array.isArray(data.links)) {
        this._saveLocalLinks(data.links);
      }
      return data;
    } catch (err) {
      console.warn('API non disponible, utilisation du cache local pour les liens :', err.message);
      const localLinks = this._getLocalLinks();
      const available = localLinks.filter((l) => !l.isUsed);
      const used = localLinks.filter((l) => l.isUsed);

      // Local breakdown
      const byProductMap = {};
      localLinks.forEach((l) => {
        if (!byProductMap[l.productName]) {
          byProductMap[l.productName] = {
            productName: l.productName,
            productId: l.productId || '',
            totalCount: 0,
            availableCount: 0,
            usedCount: 0,
            lastAdded: l.createdAt,
          };
        }
        byProductMap[l.productName].totalCount += 1;
        if (l.isUsed) byProductMap[l.productName].usedCount += 1;
        else byProductMap[l.productName].availableCount += 1;
      });

      return {
        links: localLinks,
        stats: {
          totalLinks: localLinks.length,
          availableCount: available.length,
          usedCount: used.length,
          byProduct: Object.values(byProductMap),
        },
      };
    }
  },

  /**
   * Register ready links (Bulk or single)
   */
  async addLinks({ productName, productId = '', urls, notes = '' }) {
    try {
      const response = await fetch(LINKS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productId, urls, notes }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement des liens');
      }
      return data;
    } catch (err) {
      console.warn('Fallback local pour l’ajout de liens :', err.message);
      let urlList = [];
      if (Array.isArray(urls)) {
        urlList = urls.map((u) => String(u).trim()).filter((u) => u.length > 0);
      } else if (typeof urls === 'string') {
        urlList = urls.split(/[\r\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0);
      }

      const localLinks = this._getLocalLinks();
      const newItems = urlList.map((url) => ({
        _id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        productName: productName.trim(),
        productId: productId.trim(),
        url,
        notes: notes.trim(),
        isUsed: false,
        createdAt: new Date().toISOString(),
      }));

      const updated = [...newItems, ...localLinks];
      this._saveLocalLinks(updated);

      const availableCount = updated.filter(
        (l) => l.productName === productName.trim() && !l.isUsed
      ).length;

      return {
        success: true,
        message: `${newItems.length} lien(s) enregistré(s) en local.`,
        count: newItems.length,
        availableCount,
        totalAvailable: updated.filter((l) => !l.isUsed).length,
      };
    }
  },

  /**
   * Claim / Import a ready link (جلب رابط وإنقاص الكمية)
   */
  async claimLink({ productName = '', productId = '', orderNumber = '' } = {}) {
    try {
      const response = await fetch(`${LINKS_ENDPOINT}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productId, orderNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Aucun lien disponible pour ce produit.');
      }
      return data;
    } catch (err) {
      console.warn('Fallback local pour l’importation de lien :', err.message);
      const localLinks = this._getLocalLinks();
      const idx = localLinks.findIndex((l) => {
        if (l.isUsed) return false;
        if (productName && l.productName.toLowerCase() !== productName.toLowerCase().trim()) {
          return false;
        }
        return true;
      });

      if (idx === -1) {
        throw new Error(
          productName
            ? `Aucun lien disponible pour "${productName}". La quantité est épuisée (0).`
            : 'Aucun lien disponible en stock.'
        );
      }

      const claimed = {
        ...localLinks[idx],
        isUsed: true,
        usedAt: new Date().toISOString(),
        usedByOrderNumber: orderNumber || '',
      };
      localLinks[idx] = claimed;
      this._saveLocalLinks(localLinks);

      const remainingCount = localLinks.filter(
        (l) => l.productName === claimed.productName && !l.isUsed
      ).length;
      const totalAvailable = localLinks.filter((l) => !l.isUsed).length;

      return {
        success: true,
        message: 'Lien importé avec succès ! (Mode local)',
        link: claimed,
        remainingCount,
        totalAvailable,
      };
    }
  },

  /**
   * Delete single link
   */
  async deleteLink(id) {
    try {
      const response = await fetch(`${LINKS_ENDPOINT}/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      return data;
    } catch (err) {
      console.warn('Suppression en local :', err.message);
      const localLinks = this._getLocalLinks().filter((l) => l._id !== id);
      this._saveLocalLinks(localLinks);
      return { success: true, message: 'Lien supprimé en local', id };
    }
  },

  /**
   * Clean up used links
   */
  async clearUsedLinks(productName = '') {
    try {
      const query = productName ? `?productName=${encodeURIComponent(productName)}` : '';
      const response = await fetch(`${LINKS_ENDPOINT}/cleanup/used${query}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du nettoyage');
      }
      return data;
    } catch (err) {
      console.warn('Nettoyage en local :', err.message);
      const localLinks = this._getLocalLinks().filter((l) => {
        if (!l.isUsed) return true;
        if (productName && l.productName.toLowerCase() === productName.toLowerCase().trim()) {
          return false;
        }
        return false;
      });
      this._saveLocalLinks(localLinks);
      return { success: true, message: 'Liens nettoyés en local' };
    }
  },
};
