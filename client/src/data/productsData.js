// Products Data and LocalStorage Manager for TechnoTech (French Edition)
import { getImageUrl } from '../config/api.js';

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-chatgpt',
    name: 'ChatGPT Plus — Abonnement Officiel',
    category: 'ai-tools',
    badge: 'Bestseller 🔥',
    description: 'Accès illimité à GPT-4o, Sora et au mode vocal avancé avec analyse de documents en temps réel et activation instantanée garantie.',
    price: 20,
    originalPrice: 28,
    sourceBot: '@AI_Sub_Bot',
    images: [
      '/images/black_jacket.png'
    ],
    plans: [
      { id: 'plan-1m', duration: '1 Mois', price: 20 },
      { id: 'plan-3m', duration: '3 Mois', price: 54 },
      { id: 'plan-6m', duration: '6 Mois', price: 99 },
      { id: 'plan-1y', duration: '1 An Complet', price: 185 },
    ],
  },
  {
    id: 'prod-canva',
    name: 'Canva Pro — Éducation & Entreprise',
    category: 'design',
    badge: 'Activation Immédiate ⚡',
    description: 'Accès complet à la bibliothèque Canva Pro avec des millions de modèles, outils Magic Studio IA et 1 To de stockage cloud.',
    price: 15,
    originalPrice: 24,
    sourceBot: '@CanvaEnterprise_Bot',
    images: [
      '/images/orange_jacket.png'
    ],
    plans: [
      { id: 'canva-3m', duration: '3 Mois', price: 15 },
      { id: 'canva-6m', duration: '6 Mois', price: 28 },
      { id: 'canva-1y', duration: '1 An', price: 49 },
      { id: 'canva-life', duration: 'À Vie (Lifetime)', price: 79 },
    ],
  },
  {
    id: 'prod-windows',
    name: 'Windows 11 Pro + Pack Office 365',
    category: 'licenses',
    badge: 'Garantie à Vie 🛡️',
    description: 'Clé de licence 100% authentique pour Windows 11 Pro avec la suite Office 365 complète valable sur 5 appareils et stockage OneDrive.',
    price: 29,
    originalPrice: 45,
    sourceBot: '@MS_LicenseKey_Bot',
    images: [
      '/images/cream_jacket.png'
    ],
    plans: [
      { id: 'win-retail', duration: '1 PC (À Vie)', price: 29 },
      { id: 'win-family', duration: '3 PCs (Pack Famille)', price: 65 },
      { id: 'win-business', duration: '5 PCs (Professionnel)', price: 95 },
    ],
  },
  {
    id: 'prod-jacket-noir',
    name: 'Doudoune Puffer — Signature TechnoTech',
    category: 'apparel',
    badge: 'Édition Exclusive 🌟',
    description: 'Doudoune d’hiver haute performance imperméable et coupe-vent, rembourrée en duvet thermique avec finition lustrée élégante.',
    price: 149,
    originalPrice: 199,
    sourceBot: 'Atelier Textile Direct',
    images: [
      '/images/orange_jacket.png',
      '/images/black_jacket.png',
      '/images/cream_jacket.png'
    ],
    plans: [
      { id: 'jacket-std', duration: 'Taille Standard (36 - 38)', price: 149 },
      { id: 'jacket-large', duration: 'Grande Taille (40 - 42)', price: 159 },
    ],
  },
];

const STORAGE_KEY = 'technotech_products_fr_v2';

// Robust helper to safely write to localStorage without crashing when quota is reached
const safeLocalStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Check if error is QuotaExceededError
    const isQuotaError =
      err.name === 'QuotaExceededError' ||
      err.code === 22 ||
      err.code === 1014 ||
      (err.message && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.warn(`Quota localStorage dépassé lors de l'enregistrement de "${key}". Nettoyage du cache...`);
      try {
        // Clean up legacy keys
        localStorage.removeItem('technotech_products');
        localStorage.removeItem('technotech_hero_slides');
        localStorage.removeItem('technotech_products_fr');
        localStorage.removeItem('technotech_hero_slides_fr');
      } catch (cleanErr) {}

      // Retry direct write
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (secondErr) {
        // Still full: let the caller provide an optimized/compact payload
        return false;
      }
    }
    console.error(`Erreur inattendue localStorage pour "${key}":`, err);
    return false;
  }
};

export const getStoredProducts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images.map(getImageUrl) : [],
        }));
      }
    }
  } catch (err) {
    console.warn('Impossible de lire les produits stockés localement :', err);
  }
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products) => {
  if (!Array.isArray(products)) return;
  const rawString = JSON.stringify(products);
  if (safeLocalStorageSet(STORAGE_KEY, rawString)) {
    return;
  }

  // If localStorage quota exceeded, optimize products by stripping large base64 image strings (> 50KB)
  // MongoDB Atlas is the source of truth for full-res data
  try {
    const compactProducts = products.map((p) => {
      const sanitizedImages = (p.images || []).map((img) => {
        if (typeof img === 'string' && img.startsWith('data:') && img.length > 50000) {
          return '/images/logo.png'; // lightweight fallback in local cache
        }
        return img;
      });
      return { ...p, images: sanitizedImages };
    });
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(compactProducts));
  } catch (optErr) {
    console.warn('Impossible d’enregistrer la version compacte des produits :', optErr);
  }
};

export const INITIAL_HERO_SLIDES = [
  {
    id: 'slide-orange',
    productId: 'prod-jacket-noir',
    name: 'Doudoune Puffer — Terre Cuite',
    description: 'Doudoune d’hiver haute performance imperméable et coupe-vent, rembourrée en duvet thermique avec finition lustrée élégante.',
    price: 149,
    originalPrice: 199,
    image: '/images/orange_jacket.png',
    bgColor: '#e25816',
    order: 0,
  },
  {
    id: 'slide-black',
    productId: 'prod-jacket-noir',
    name: 'Doudoune Puffer — Noir Intense',
    description: 'Doudoune d’hiver haute performance imperméable et coupe-vent, rembourrée en duvet thermique avec finition lustrée élégante.',
    price: 149,
    originalPrice: 199,
    image: '/images/black_jacket.png',
    bgColor: '#140b08',
    order: 1,
  },
  {
    id: 'slide-cream',
    productId: 'prod-jacket-noir',
    name: 'Doudoune Puffer — Crème Alpine',
    description: 'Doudoune d’hiver haute performance imperméable et coupe-vent, rembourrée en duvet thermique avec finition lustrée élégante.',
    price: 149,
    originalPrice: 199,
    image: '/images/cream_jacket.png',
    bgColor: '#8c4314',
    order: 2,
  },
];

const HERO_STORAGE_KEY = 'technotech_hero_slides_fr_v2';

export const getStoredHeroSlides = (availableProducts = []) => {
  try {
    const data = localStorage.getItem(HERO_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-hydrate any compact slides if image was stored as reference
        return parsed.map((slide) => {
          let img = slide.image;
          if (slide.image === '__product_image_ref__' || slide.isCompactRef) {
            const prod = availableProducts.find((p) => (p._id || p.id) === slide.productId);
            img =
              prod?.images?.[slide.selectedImageIndex || 0] ||
              prod?.images?.[0] ||
              '/images/logo.png';
          }
          return { ...slide, image: getImageUrl(img) };
        });
      }
    }
  } catch (err) {
    console.warn('Impossible de lire les slides Hero stockés localement :', err);
  }
  return INITIAL_HERO_SLIDES;
};

export const saveStoredHeroSlides = (slides) => {
  if (!Array.isArray(slides)) return;

  // 1. Try direct save
  const rawString = JSON.stringify(slides);
  if (safeLocalStorageSet(HERO_STORAGE_KEY, rawString)) {
    return;
  }

  // 2. If quota exceeded, save compact version (large base64 replaced with product reference)
  // The full resolution image remains safe in MongoDB Atlas
  try {
    const compactSlides = slides.map((slide) => {
      const isLargeBase64 =
        typeof slide.image === 'string' &&
        slide.image.startsWith('data:') &&
        slide.image.length > 10000;

      if (isLargeBase64) {
        return {
          ...slide,
          image: '__product_image_ref__',
          isCompactRef: true,
        };
      }
      return slide;
    });

    safeLocalStorageSet(HERO_STORAGE_KEY, JSON.stringify(compactSlides));
  } catch (compactErr) {
    console.warn('Impossible d’enregistrer les slides compacts :', compactErr);
  }
};


