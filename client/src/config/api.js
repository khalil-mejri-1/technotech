/**
 * Configuration de l'API Backend TechnoTech
 */
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/technotech\/?$/, '').replace(/\/api\/?$/, '')
    : 'https://technotech-api.vercel.app');

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `${BACKEND_URL}/api/technotech`;

/**
 * Fonction universelle pour résoudre et corriger automatiquement les URLs d'images.
 * - Convertit 'http://localhost:5001' ou 'http://localhost:5000' vers l'URL en ligne (https://technotech-api.vercel.app).
 * - Préfixe les chemins relatifs '/uploads/...' avec le domaine backend.
 */
export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return '/images/logo.png';
  if (url.startsWith('data:') || url.startsWith('/images/')) return url;

  const backend = (BACKEND_URL || 'https://technotech-api.vercel.app').replace(/\/+$/, '');

  // Remplacer localhost:5001 ou 5000 par le backend de production
  if (/https?:\/\/(localhost|127\.0\.0\.1):(5001|5000)/.test(url)) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):(5001|5000)/, backend);
  }

  // Préfixer les chemins relatifs vers uploads
  if (url.startsWith('/uploads/')) {
    return `${backend}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${backend}/${url}`;
  }

  return url;
}

export default API_BASE_URL;
