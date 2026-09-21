/**
 * Configuration de l'API Backend TechnoTech
 * La configuration est définie UNIQUEMENT dans le fichier .env via VITE_API_URL
 */

// الرابط يتم جلبه من .env أو الرابط الافتراضي للإنتاج
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://technotech-api.vercel.app/api/technotech';

// استخراج دومين السيرفر تلقائياً من رابط API_BASE_URL المحدد في .env
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (API_BASE_URL ? API_BASE_URL.replace(/\/api\/technotech\/?$/, '').replace(/\/api\/?$/, '') : 'https://technotech-api.vercel.app');

/**
 * دالة لتصحيح روابط الصور تلقائياً بالاعتماد على رابط السيرفر المحدد في .env
 */
export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('/images/')) return url;

  const backend = BACKEND_URL ? BACKEND_URL.replace(/\/+$/, '') : '';
  if (!backend) return url;

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
