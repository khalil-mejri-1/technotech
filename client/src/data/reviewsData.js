// Data manager and realistic customer reviews for TechnoTech
// Features authentic WhatsApp and Facebook Messenger screenshots & conversations

export const INITIAL_REVIEWS = [
  {
    id: 'rev-wa-1',
    platform: 'whatsapp',
    customerName: 'Yassine Ben Salem',
    customerPhone: '+216 28 ••• •32',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
    productName: 'ChatGPT Plus — Abonnement Officiel',
    productDuration: '1 Mois',
    productPrice: 20,
    rating: 5,
    date: "Aujourd'hui à 14:18",
    timeStr: '14:18',
    verified: true,
    badgeText: 'Client VIP 🔥',
    screenshotUrl: null,
    messages: [
      {
        id: 'm1',
        sender: 'customer',
        text: '3aslema khoya, el compte ChatGPT Plus yemchi 10/10 ya3tik essaha 3al vitesse w service tayara barcha 😍🔥',
        time: '14:15',
        status: 'read'
      },
      {
        id: 'm2',
        sender: 'store',
        text: '3aslema khoya Yassine ! Marhba bik avec grand plaisir 🙏✨ Tout est officiel et garanti. N\'hésite surtout pas si tu as la moindre question !',
        time: '14:16',
        status: 'read'
      },
      {
        id: 'm3',
        sender: 'customer',
        text: '3aychek wlh rani recommentek l shabi fel fac, sérieux w thabtou fel wa9t 👌 Merci TechnoTech',
        time: '14:18',
        status: 'read'
      }
    ]
  },
  {
    id: 'rev-fb-1',
    platform: 'facebook',
    customerName: 'Mariem Trabelsi',
    customerCity: 'Tunis',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    productName: 'Canva Pro — Éducation & Entreprise (3 Ans)',
    productDuration: '3 Ans',
    productPrice: 30,
    rating: 5,
    date: 'Hier à 19:42',
    timeStr: '19:42',
    verified: true,
    badgeText: 'Avis Vérifié ✅',
    screenshotUrl: null,
    messages: [
      {
        id: 'fb1',
        sender: 'customer',
        text: 'Bonjour l’équipe TechnoTech ! Je viens de tester mon compte Canva Pro, les fonctionnalités Magic Studio IA et les templates pro sont bien activés. Merci pour votre rapidité et gentillesse ! 🎨✨',
        time: '19:38'
      },
      {
        id: 'fb2',
        sender: 'store',
        text: 'Bonjour Mariem ! 🌸 Nous sommes ravis que tout soit à la hauteur de vos attentes. Excellente création à vous et merci pour votre confiance !',
        time: '19:40'
      },
      {
        id: 'fb3',
        sender: 'customer',
        text: 'C\'est la 2ème fois que je commande chez vous, toujours le top ! Je vous mets 5 étoiles bien méritées ⭐⭐⭐⭐⭐',
        time: '19:42'
      }
    ]
  },
  {
    id: 'rev-wa-2',
    platform: 'whatsapp',
    customerName: 'Amine Gharbi',
    customerPhone: '+216 94 ••• •10',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
    productName: 'Windows 11 Pro + Pack Office 365',
    productDuration: 'Licence à Vie',
    productPrice: 29,
    rating: 5,
    date: 'Il y a 2 jours à 11:05',
    timeStr: '11:05',
    verified: true,
    badgeText: 'Activation Immédiate ⚡',
    screenshotUrl: null,
    messages: [
      {
        id: 'wa2_1',
        sender: 'customer',
        text: 'Salam khoya, el clé Windows 11 activée sans aucun souci w Office 365 yemchi 5/5 m3a el 1 To OneDrive !',
        time: '11:02',
        status: 'read'
      },
      {
        id: 'wa2_2',
        sender: 'store',
        text: 'Marhba bik khoya Amine ! Saha lik licence à vie officielle liée à ta carte mère 👌 Bel barka',
        time: '11:04',
        status: 'read'
      },
      {
        id: 'wa2_3',
        sender: 'customer',
        text: 'Ya3tik essaha khoya a9al men 5 d9aye9 wasletni el clé, service pro barcha wlh ! 🔥',
        time: '11:05',
        status: 'read'
      }
    ]
  },
  {
    id: 'rev-fb-2',
    platform: 'facebook',
    customerName: 'Kmar Khemiri',
    customerCity: 'Sousse',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    productName: 'Pack Duo IA : ChatGPT Plus + Gemini Pro',
    productDuration: 'Formule Spéciale',
    productPrice: 224,
    rating: 5,
    date: 'Il y a 3 jours à 22:15',
    timeStr: '22:15',
    verified: true,
    badgeText: 'Pack Bestseller 🔥',
    screenshotUrl: null,
    messages: [
      {
        id: 'fb2_1',
        sender: 'customer',
        text: 'Bonsoir ! Je voulais juste vous remercier pour le pack Duo IA. Les deux comptes fonctionnent impeccablement, le support m\'a guidée pas à pas pour la connexion. Vraiment bravo ! 🙌',
        time: '22:11'
      },
      {
        id: 'fb2_2',
        sender: 'store',
        text: 'Bonsoir Kmar ! C’est un immense plaisir de vous accompagner. Très bon usage de ChatGPT et Gemini Pro pour vos projets ! 🚀',
        time: '22:14'
      },
      {
        id: 'fb2_3',
        sender: 'customer',
        text: 'Merci infiniment pour votre disponibilité même à cette heure tardive ❤️',
        time: '22:15'
      }
    ]
  },
  {
    id: 'rev-wa-3',
    platform: 'whatsapp',
    customerName: 'Mohamed Ali Dridi',
    customerPhone: '+216 52 ••• •99',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    productName: 'CapCut Pro VIP (Abonnement 1 Mois)',
    productDuration: '1 Mois VIP',
    productPrice: 15,
    rating: 5,
    date: 'Il y a 4 jours à 16:30',
    timeStr: '16:30',
    verified: true,
    badgeText: 'Client Fidèle 💎',
    screenshotUrl: null,
    messages: [
      {
        id: 'wa3_1',
        sender: 'customer',
        text: 'Salem khouya, Capcut pro activé mriguel ! Kol chay 4K w effects pro maftouhin jawhoum behi ❤️',
        time: '16:26',
        status: 'read'
      },
      {
        id: 'wa3_2',
        sender: 'store',
        text: '3aslema Med Ali ! Hamdoullah khoya, montage mezyen w ay haja test7a9ha ahna lehna 💪',
        time: '16:28',
        status: 'read'
      },
      {
        id: 'wa3_3',
        sender: 'customer',
        text: 'Asra3 service client ritou fi tounes wlh ya3tikom saha 👏',
        time: '16:30',
        status: 'read'
      }
    ]
  },
  {
    id: 'rev-fb-3',
    platform: 'facebook',
    customerName: 'Sonia Cherif',
    customerCity: 'Sfax',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    productName: 'Canva Pro — Formule À Vie (Lifetime)',
    productDuration: 'À Vie',
    productPrice: 79,
    rating: 5,
    date: 'Il y a 5 jours à 18:20',
    timeStr: '18:20',
    verified: true,
    badgeText: 'Avis Vérifié ✅',
    screenshotUrl: null,
    messages: [
      {
        id: 'fb3_1',
        sender: 'customer',
        text: 'Bonjour TechnoTech, confirmation reçue et invitation acceptée en 2 minutes chrono ! C\'est un gain de temps énorme pour mon agence.',
        time: '18:16'
      },
      {
        id: 'fb3_2',
        sender: 'store',
        text: 'Bonjour Sonia ! C\'est exactement notre mission : vous faire gagner du temps et vous offrir le meilleur matériel au tarif le plus juste 🌟',
        time: '18:18'
      },
      {
        id: 'fb3_3',
        sender: 'customer',
        text: 'Excellente continuation à vous, vous méritez largement le succès ! ✨',
        time: '18:20'
      }
    ]
  },
  {
    id: 'rev-wa-4',
    platform: 'whatsapp',
    customerName: 'Hamza Mansour',
    customerPhone: '+216 21 ••• •44',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    productName: 'NordVPN 2 Ans + CyberSec',
    productDuration: '2 Ans',
    productPrice: 45,
    rating: 5,
    date: 'Il y a 6 jours à 20:10',
    timeStr: '20:10',
    verified: true,
    badgeText: 'Sécurité & VPN 🛡️',
    screenshotUrl: null,
    messages: [
      {
        id: 'wa4_1',
        sender: 'customer',
        text: 'Salam khoya, connexion NordVPN stable barcha w serveur tounes w fransa yemchiw tayara !',
        time: '20:07',
        status: 'read'
      },
      {
        id: 'wa4_2',
        sender: 'store',
        text: 'Marhba bik Hamza ! Navigation sécurisée w débit max garanti 🚀 Merci pour ta confiance',
        time: '20:08',
        status: 'read'
      },
      {
        id: 'wa4_3',
        sender: 'customer',
        text: 'Bravo pour le professionnalisme, 3malt 9ahwa 3al khidma!',
        time: '20:10',
        status: 'read'
      }
    ]
  },
  {
    id: 'rev-fb-4',
    platform: 'facebook',
    customerName: 'Farouk Riahi',
    customerCity: 'Nabeul',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
    productName: 'Pack Créateur : Canva Pro (3 Ans) + CapCut Pro (1 Mois)',
    productDuration: 'Formule Duo',
    productPrice: 30,
    rating: 5,
    date: 'Il y a 1 semaine à 15:45',
    timeStr: '15:45',
    verified: true,
    badgeText: 'Pack Duo 🎨',
    screenshotUrl: null,
    messages: [
      {
        id: 'fb4_1',
        sender: 'customer',
        text: 'Service client exemplaire ! J\'avais un petit souci pour lier mon compte Canva, ils m\'ont appelé en 3 minutes et tout a été réglé avec le sourire.',
        time: '15:40'
      },
      {
        id: 'fb4_2',
        sender: 'store',
        text: 'Bonjour Farouk ! Le service après-vente est notre priorité absolue. Nous sommes toujours là pour vous guider ! 🤝',
        time: '15:42'
      },
      {
        id: 'fb4_3',
        sender: 'customer',
        text: 'Recommandé les yeux fermés ! Vendeur de confiance 💯',
        time: '15:45'
      }
    ]
  }
];

const STORAGE_KEY_REVIEWS = 'technotech_customer_reviews_cache';

export const getStoredReviews = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) return INITIAL_REVIEWS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_REVIEWS;
    const seen = new Set();
    const unique = parsed.filter((r) => {
      const k = r.id || r._id;
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return unique.length > 0 ? unique : INITIAL_REVIEWS;
  } catch {
    return INITIAL_REVIEWS;
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
      window.dispatchEvent(new CustomEvent('technotech_reviews_updated', { detail: INITIAL_REVIEWS }));
    }
    return INITIAL_REVIEWS;
  } catch {
    return INITIAL_REVIEWS;
  }
};

