/**
 * Configuration de l'API Backend TechnoTech
 * En production, les requêtes passent par le Reverse Proxy (/api/technotech)
 * afin de masquer complètement l'adresse du serveur backend auprès des visiteurs et des DevTools.
 */

// الرابط النسبي عبر Reverse Proxy لإخفاء رابط الخادم تماماً
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api/technotech';

// رابط السيرفر الأساسي (فارغ في الإنتاج حتى تظل كل الطلبات عبر دومين المتجر)
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (API_BASE_URL && !API_BASE_URL.startsWith('/')
    ? API_BASE_URL.replace(/\/api\/technotech\/?$/, '').replace(/\/api\/?$/, '')
    : '');

/**
 * دالة لتصحيح روابط الصور دون كشف رابط السيرفر الخارجي
 */
export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('/images/')) return url;

  const backend = BACKEND_URL ? BACKEND_URL.replace(/\/+$/, '') : '';
  if (!backend) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `/api${url}`;
    if (url.startsWith('uploads/')) return `/api/${url}`;
    return url;
  }

  // استبدال localhost برابط السيرفر المحدد في .env
  if (/https?:\/\/(localhost|127\.0\.0\.1):(5001|5000)/.test(url)) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):(5001|5000)/, backend);
  }

  // إضافة دومين السيرفر للمسارات النسبية
  if (url.startsWith('/uploads/')) {
    return `${backend}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${backend}/${url}`;
  }

  return url;
}

export default API_BASE_URL;
