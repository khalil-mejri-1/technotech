import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Bell,
  ArrowRight,
  Trash2,
  Edit3,
  Upload,
  X,
  Check,
  ArrowLeft,
  Layers,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Eye,
  Bot,
  Lock,
  Loader2,
  AlertTriangle,
  Sparkles,
  Package,
  Palette,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Flame,
  Gift,
  EyeOff,
  Tag,
  Calculator,
  Search,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MousePointer,
  Terminal,
  Save,
  Unlock,
  Key,
  MessageCircle,
  Phone,
  Link2
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../data/productsData.js';
import { productService } from '../services/productService.js';
import { orderService } from '../services/orderService.js';
import { offerService } from '../services/offerService.js';
import { linkService } from '../services/linkService.js';
import { getImageUrl } from '../config/api.js';
import { resolveOfferItemImage } from '../data/offersData.js';
import OrdersManager, { playOrderChime } from './OrdersManager.jsx';
import LinksManager from './LinksManager.jsx';
import { securityService } from '../services/securityService.js';
import SecurityNotificationCenter, { playSecurityAlertChime } from './SecurityNotificationCenter.jsx';

const getThumbnailLabel = (name = '') => {
  if (!name) return '';
  return name.length > 12 ? `${name.substring(0, 11)}...` : name;
};

export default function AdminDashboard({
  products,
  onUpdateProducts,
  heroSlides = [],
  onUpdateHeroSlides,
  offers = [],
  onUpdateOffers,
  onNavigateStore,
  onLogout,
  siteSettings = {},
  onUpdateSettings
}) {
  const [activeTab, setActiveTab] = useState('products');
  // TechnoTech Security Notifications State
  const [isSecurityCenterOpen, setIsSecurityCenterOpen] = useState(false);
  const [securityNotifications, setSecurityNotifications] = useState([]);
  const [unreadSecurityCount, setUnreadSecurityCount] = useState(0);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const lastUnreadSecurityRef = useRef(null);
  const isFirstSecurityLoadRef = useRef(true); // 'products' | 'hero' | 'orders' | 'offers' | 'security' | 'links'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusNotice, setStatusNotice] = useState(null);
  const [availableLinksCount, setAvailableLinksCount] = useState(0);

  // Background polling for available links count badge
  useEffect(() => {
    let isMounted = true;
    const fetchLinksCount = async () => {
      try {
        const res = await linkService.getAll();
        if (isMounted && res?.stats?.availableCount !== undefined) {
          setAvailableLinksCount(res.stats.availableCount);
        }
      } catch (e) {
        // silent
      }
    };
    fetchLinksCount();
    const timer = setInterval(fetchLinksCount, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeTab]);

  // ============================================================================
  // TECHNOTECH SECURITY NOTIFICATIONS LOGIC & SMART POLLING
  // ============================================================================
  const fetchSecurityNotifications = async (isSilent = false) => {
    if (!isSilent) setIsLoadingSecurity(true);
    try {
      const res = await securityService.getNotifications();
      if (res && res.success) {
        setSecurityNotifications(res.notifications || []);
        const unread = res.unreadCount || 0;

        // Play audio alert & notify if new unread security notifications arrive
        if (!isFirstSecurityLoadRef.current && lastUnreadSecurityRef.current !== null && unread > lastUnreadSecurityRef.current) {
          playSecurityAlertChime();
          notify('🚨 ALERTE SÉCURITÉ : Tentative d\'accès non autorisée détectée !');
        }

        lastUnreadSecurityRef.current = unread;
        setUnreadSecurityCount(unread);
      }
    } catch (e) {
      console.warn('Erreur récupération alertes sécurité :', e);
    } finally {
      if (!isSilent) setIsLoadingSecurity(false);
      isFirstSecurityLoadRef.current = false;
    }
  };

  useEffect(() => {
    fetchSecurityNotifications(false);

    // Smart polling every 15 seconds
    const intervalId = setInterval(() => {
      fetchSecurityNotifications(true);
    }, 15000);

    // Also refresh when tab gains focus
    const handleFocus = () => {
      fetchSecurityNotifications(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleMarkSecurityAsRead = async (id) => {
    try {
      await securityService.markAsRead(id);
      setSecurityNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadSecurityCount((prev) => Math.max(0, prev - 1));
      if (lastUnreadSecurityRef.current !== null) {
        lastUnreadSecurityRef.current = Math.max(0, lastUnreadSecurityRef.current - 1);
      }
    } catch (e) {
      notify('Erreur lors de la mise à jour de l\'alerte');
    }
  };

  const handleMarkAllSecurityAsRead = async () => {
    try {
      await securityService.markAllAsRead();
      setSecurityNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadSecurityCount(0);
      lastUnreadSecurityRef.current = 0;
      notify('Toutes les alertes ont été marquées comme lues');
    } catch (e) {
      notify('Erreur lors de la mise à jour des alertes');
    }
  };

  const handleDeleteSecurity = async (id) => {
    try {
      await securityService.deleteNotification(id);
      setSecurityNotifications((prev) => prev.filter((n) => n._id !== id));
      // Re-fetch count
      const count = securityNotifications.filter((n) => n._id !== id && !n.isRead).length;
      setUnreadSecurityCount(count);
      lastUnreadSecurityRef.current = count;
      notify('Alerte de sécurité supprimée');
    } catch (e) {
      notify('Erreur lors de la suppression de l\'alerte');
    }
  };

  const handleClearAllSecurity = async () => {
    try {
      await securityService.clearAll();
      setSecurityNotifications([]);
      setUnreadSecurityCount(0);
      lastUnreadSecurityRef.current = 0;
      notify('Historique de sécurité effacé');
    } catch (e) {
      notify('Erreur lors de l\'effacement de l\'historique');
    }
  };

  // Security & Content Protection Settings State
  const [securityForm, setSecurityForm] = useState({
    disableInspect: siteSettings?.disableInspect ?? true,
    disableRightClick: siteSettings?.disableRightClick ?? true,
    disableImageDragging: siteSettings?.disableImageDragging ?? true,
    protectInAdmin: siteSettings?.protectInAdmin ?? false,
    whatsappNumber: siteSettings?.whatsappNumber || '96086581',
    imgbbApiKey: siteSettings?.imgbbApiKey || import.meta.env.VITE_IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff',
  });
  const [showImgbbKey, setShowImgbbKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setSecurityForm({
        disableInspect: siteSettings.disableInspect ?? true,
        disableRightClick: siteSettings.disableRightClick ?? true,
        disableImageDragging: siteSettings.disableImageDragging ?? true,
        protectInAdmin: siteSettings.protectInAdmin ?? false,
        whatsappNumber: siteSettings.whatsappNumber || '96086581',
        imgbbApiKey: siteSettings.imgbbApiKey || import.meta.env.VITE_IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff',
      });
    }
  }, [siteSettings]);

  const handleSaveSecuritySettings = async () => {
    setIsSavingSettings(true);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings(securityForm);
      }
      notify('Paramètres de sécurité enregistrés avec succès ! La protection est désormais active.');
    } catch (err) {
      notify('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleAllSecurity = (enable) => {
    setSecurityForm((prev) => ({
      ...prev,
      disableInspect: enable,
      disableRightClick: enable,
      disableImageDragging: enable,
    }));
  };

  // Orders & Unseen Orders Badge State
  const [orders, setOrders] = useState([]);
  const [unseenOrdersCount, setUnseenOrdersCount] = useState(0);
  const lastUnseenCountRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Calculate unseen orders
  const calculateUnseenOrders = (ordersList) => {
    if (!Array.isArray(ordersList) || ordersList.length === 0) return 0;
    try {
      const raw = localStorage.getItem('technotech_seen_orders');
      if (!raw) {
        return ordersList.filter((o) => o.status === 'en_attente').length;
      }
      const seenIds = new Set(JSON.parse(raw));
      return ordersList.filter((o) => {
        const id = o._id || o.orderNumber;
        return id && !seenIds.has(id) && o.status !== 'annulee';
      }).length;
    } catch {
      return ordersList.filter((o) => o.status === 'en_attente').length;
    }
  };

  // Mark all current orders as seen
  const markAllOrdersAsSeen = (targetOrders) => {
    const list = targetOrders || orders;
    if (!Array.isArray(list) || list.length === 0) {
      setUnseenOrdersCount(0);
      return;
    }
    try {
      const existingRaw = localStorage.getItem('technotech_seen_orders');
      const seenSet = new Set(existingRaw ? JSON.parse(existingRaw) : []);
      list.forEach((o) => {
        const id = o._id || o.orderNumber;
        if (id) seenSet.add(id);
      });
      localStorage.setItem('technotech_seen_orders', JSON.stringify(Array.from(seenSet)));
      setUnseenOrdersCount(0);
    } catch (e) {
      console.warn('Erreur sauvegarde commandes vues:', e);
      setUnseenOrdersCount(0);
    }
  };

  // Callback when OrdersManager updates orders
  const handleOrdersChange = (updatedOrders) => {
    const list = Array.isArray(updatedOrders) ? updatedOrders : [];
    setOrders(list);
    if (activeTab === 'orders') {
      markAllOrdersAsSeen(list);
    } else {
      setUnseenOrdersCount(calculateUnseenOrders(list));
    }
  };

  // Background polling for orders to update the unseen badge live
  useEffect(() => {
    let isMounted = true;

    const fetchOrdersBackground = async () => {
      try {
        const data = await orderService.getAll();
        if (!isMounted) return;
        const currentOrders = Array.isArray(data) ? data : [];
        setOrders(currentOrders);

        if (activeTab === 'orders') {
          markAllOrdersAsSeen(currentOrders);
        } else {
          const unseen = calculateUnseenOrders(currentOrders);
          if (!isFirstLoadRef.current && lastUnseenCountRef.current !== null && unseen > lastUnseenCountRef.current) {
            const diff = unseen - lastUnseenCountRef.current;
            playOrderChime();
            notify(`🔔 ${diff} nouvelle(s) commande(s) reçue(s) !`);
          }
          lastUnseenCountRef.current = unseen;
          setUnseenOrdersCount(unseen);
        }
        isFirstLoadRef.current = false;
      } catch (e) {
        // Silent error handling for background polling
      }
    };

    fetchOrdersBackground();
    const intervalId = setInterval(fetchOrdersBackground, 6000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeTab]);

  // When admin switches to 'orders' tab, mark all currently loaded orders as seen
  useEffect(() => {
    if (activeTab === 'orders' && orders.length > 0) {
      markAllOrdersAsSeen(orders);
    }
  }, [activeTab]);

  // Hero Carousel Management State
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroSlideIndex, setEditingHeroSlideIndex] = useState(null);
  const [heroForm, setHeroForm] = useState({
    productId: '',
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    selectedImageIndex: 0,
    bgColor: '#e25816',
  });

  // Custom Confirmation Modal State (Replaces native browser confirm alert)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    productName: '',
    confirmText: 'Supprimer',
    confirmType: 'danger',
    isProcessing: false,
    onConfirm: null,
  });



  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'ai-tools',
    badge: '',
    price: '',
    originalPrice: '',
    sourceBot: '',
    images: [],
    plans: [],
  });

  // Dynamic plan inputs
  const [newPlanDuration, setNewPlanDuration] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');

  const notify = (msg) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // ==========================================
  // HERO CAROUSEL SLIDES HANDLERS
  // ==========================================
  const handleHeroImageUpload = async (e, targetField) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      notify('Téléversement de la photo en cours... ⏳');
      let uploadedUrl;
      try {
        uploadedUrl = await productService.uploadImage(file);
      } catch {
        uploadedUrl = await compressImageFile(file);
      }
      if (uploadedUrl) {
        setHeroForm((prev) => ({
          ...prev,
          [targetField]: uploadedUrl,
        }));
        notify('Photo mise à jour pour ce slide ! ✨');
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      notify('Erreur lors du téléversement de la photo');
    }
  };

  const handleOpenAddHeroModal = () => {
    setEditingHeroSlideIndex(null);
    const firstProduct = products[0];
    if (firstProduct) {
      setHeroForm({
        productId: firstProduct._id || firstProduct.id,
        name: firstProduct.name,
        description: firstProduct.description || '',
        price: firstProduct.price,
        originalPrice: firstProduct.originalPrice || '',
        image: firstProduct.images && firstProduct.images.length > 0 ? firstProduct.images[0] : '/images/logo.png',
        thumbnailImage: firstProduct.images && firstProduct.images.length > 1 ? firstProduct.images[1] : (firstProduct.images?.[0] || '/images/logo.png'),
        selectedImageIndex: 0,
        bgColor: '#e25816',
      });
    } else {
      setHeroForm({
        productId: '',
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        image: '/images/logo.png',
        thumbnailImage: '/images/logo.png',
        selectedImageIndex: 0,
        bgColor: '#e25816',
      });
    }
    setIsHeroModalOpen(true);
  };

  const handleOpenEditHeroModal = (slide, index) => {
    setEditingHeroSlideIndex(index);
    const prod = products.find(
      (p) =>
        (p._id && (p._id === slide.productId || p._id === slide.id)) ||
        (p.id && (p.id === slide.productId || p.id === slide.id)) ||
        (p.name && slide.name && p.name.trim().toLowerCase() === slide.name.trim().toLowerCase())
    );
    const foundImgIdx = prod?.images ? prod.images.findIndex((img) => img === slide.image) : -1;
    const initialIndex = foundImgIdx >= 0 ? foundImgIdx : (slide.selectedImageIndex || 0);
    const resolvedImage = slide.image || (prod?.images && prod.images[initialIndex]) || '/images/logo.png';
    const resolvedThumb = slide.thumbnailImage || (prod?.images && prod.images.length > 1 ? prod.images[1] : resolvedImage);

    setHeroForm({
      productId: prod ? (prod._id || prod.id) : (slide.productId || slide.id),
      name: prod ? prod.name : slide.name,
      description: prod ? (prod.description || '') : (slide.description || ''),
      price: prod ? prod.price : slide.price,
      originalPrice: prod ? (prod.originalPrice || '') : (slide.originalPrice || ''),
      image: resolvedImage,
      thumbnailImage: resolvedThumb,
      selectedImageIndex: initialIndex,
      bgColor: slide.bgColor || '#e25816',
    });
    setIsHeroModalOpen(true);
  };

  const handleHeroProductSelect = (productId) => {
    const selected = products.find((p) => (p._id || p.id) === productId);
    if (!selected) return;
    const pImgs = selected.images && selected.images.length > 0 ? selected.images : ['/images/logo.png'];
    setHeroForm((prev) => ({
      ...prev,
      productId: selected._id || selected.id,
      name: selected.name,
      description: selected.description || '',
      price: selected.price,
      originalPrice: selected.originalPrice || '',
      image: pImgs[0],
      thumbnailImage: pImgs.length > 1 ? pImgs[1] : pImgs[0],
      selectedImageIndex: 0,
    }));
  };

  const handleSaveHeroSlide = async () => {
    if (!heroForm.productId) {
      alert('Veuillez sélectionner un produit du catalogue.');
      return;
    }
    if (!heroForm.image) {
      alert('Veuillez choisir une image pour ce produit.');
      return;
    }

    let slideImg = heroForm.image;
    if (slideImg && slideImg.startsWith('data:')) {
      try {
        const savedUrl = await productService.uploadBase64(slideImg, `hero-${Date.now()}.png`);
        if (savedUrl) slideImg = savedUrl;
      } catch (err) {
        console.warn('Erreur sauvegarde image hero :', err);
      }
    }

    let thumbImg = heroForm.thumbnailImage;
    if (thumbImg && thumbImg.startsWith('data:')) {
      try {
        const savedUrl = await productService.uploadBase64(thumbImg, `thumb-${Date.now()}.png`);
        if (savedUrl) thumbImg = savedUrl;
      } catch (err) {
        console.warn('Erreur sauvegarde vignette hero :', err);
      }
    }

    const prod = products.find(
      (p) =>
        (p._id && (p._id === heroForm.productId || p._id === heroForm.id)) ||
        (p.id && (p.id === heroForm.productId || p.id === heroForm.id)) ||
        (p.name && heroForm.name && p.name.trim().toLowerCase() === heroForm.name.trim().toLowerCase())
    );

    const slideToSave = {
      id: editingHeroSlideIndex !== null ? heroSlides[editingHeroSlideIndex]?.id || `slide-${Date.now()}` : `slide-${Date.now()}`,
      productId: prod ? (prod._id || prod.id) : heroForm.productId,
      name: prod ? prod.name : heroForm.name,
      description: prod ? (prod.description || '') : heroForm.description,
      price: prod?.price !== undefined ? Number(prod.price) : Number(heroForm.price),
      originalPrice: (prod?.originalPrice !== undefined && prod?.originalPrice !== null) ? Number(prod.originalPrice) : (heroForm.originalPrice ? Number(heroForm.originalPrice) : null),
      plans: prod?.plans || [],
      image: slideImg,
      thumbnailImage: thumbImg || slideImg,
      selectedImageIndex: heroForm.selectedImageIndex !== undefined ? heroForm.selectedImageIndex : 0,
      bgColor: heroForm.bgColor || '#e25816',
      order: editingHeroSlideIndex !== null ? editingHeroSlideIndex : heroSlides.length,
    };

    let updatedSlides;
    if (editingHeroSlideIndex !== null) {
      updatedSlides = [...heroSlides];
      updatedSlides[editingHeroSlideIndex] = slideToSave;
      notify('Slide du carrousel mis à jour avec succès ! ✨');
    } else {
      updatedSlides = [...heroSlides, slideToSave];
      notify('Produit ajouté au carrousel de la page d’accueil ! 🚀');
    }

    if (onUpdateHeroSlides) {
      onUpdateHeroSlides(updatedSlides);
    }
    setIsHeroModalOpen(false);
  };

  const handleDeleteHeroSlide = (index) => {
    const slideToDelete = heroSlides[index];
    setConfirmModal({
      isOpen: true,
      title: 'Retirer du carrousel ?',
      message: `Êtes-vous sûr de vouloir retirer "${slideToDelete.name}" du carrousel de la page d'accueil ?`,
      productName: slideToDelete.name,
      confirmText: 'Oui, retirer du carrousel',
      confirmType: 'danger',
      isProcessing: false,
      onConfirm: () => {
        const updated = heroSlides.filter((_, i) => i !== index);
        if (onUpdateHeroSlides) {
          onUpdateHeroSlides(updated);
        }
        setConfirmModal({ isOpen: false, isProcessing: false });
        notify('Produit retiré du carrousel avec succès.');
      },
    });
  };

  const handleMoveHeroSlide = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    const updated = [...heroSlides];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    if (onUpdateHeroSlides) {
      onUpdateHeroSlides(updated);
    }
    notify('Ordre du carrousel mis à jour ! 🔄');
  };

  // ==========================================
  // OFFERS & PACKS MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [selectedOfferProductIds, setSelectedOfferProductIds] = useState([]);
  const [selectedProductPlans, setSelectedProductPlans] = useState({});
  const [offerCombinerSearch, setOfferCombinerSearch] = useState('');
  const [offerForm, setOfferForm] = useState({
    title: '',
    subtitle: '',
    type: 'duo',
    badge: 'PACK DUO ÉCONOMIQUE',
    itemsText: '',
    itemImages: [],
    price: '',
    originalPrice: '',
    duration: '1 Mois',
    image: '/images/logo.png',
    bgColor: '#ff5722',
    featuresText: '',
    isActive: true,
  });

  const handleOpenAddOfferModal = () => {
    setEditingOfferId(null);
    setSelectedOfferProductIds([]);
    setSelectedProductPlans({});
    setOfferCombinerSearch('');
    setOfferForm({
      title: '',
      subtitle: '2 abonnements complets réunis en un seul pack à tarif réduit.',
      type: 'duo',
      badge: 'PACK DUO ÉCONOMIQUE',
      itemsText: '',
      itemImages: [],
      price: '',
      originalPrice: '',
      duration: '1 Mois',
      image: '/images/logo.png',
      bgColor: '#ff5722',
      featuresText: 'Accès officiel individuel et garanti\nActivation instantanée sur votre email\nSupport client prioritaire 7j/7',
      isActive: true,
    });
    setIsOfferModalOpen(true);
  };

  const handleOpenEditOfferModal = (offer) => {
    setEditingOfferId(offer.id || offer._id);
    setOfferCombinerSearch('');

    // Détecter automatiquement les produits composant cette offre
    const offerTitleLower = (offer.title || '').toLowerCase();
    const offerItemsStr = Array.isArray(offer.items)
      ? offer.items.map((i) => String(i).toLowerCase()).join(' ')
      : String(offer.items || '').toLowerCase();

    const matchedProductIds = products
      .filter((p) => {
        const pName = (p.name || '').toLowerCase().trim();
        if (!pName) return false;
        const cleanName = pName.split(/[-—–]/)[0].trim();
        return (
          (cleanName && (offerTitleLower.includes(cleanName) || offerItemsStr.includes(cleanName))) ||
          offerTitleLower.includes(pName) ||
          offerItemsStr.includes(pName)
        );
      })
      .map((p) => String(p._id || p.id));

    setSelectedOfferProductIds(matchedProductIds);

    // Détecter la durée / formule de chaque produit sélectionné
    const initialPlans = {};
    matchedProductIds.forEach((pId) => {
      const prod = products.find((p) => String(p._id || p.id) === pId);
      if (prod && Array.isArray(prod.plans) && prod.plans.length > 0) {
        const combinedText = `${offer.title || ''} ${(offer.items || []).join(' ')}`.toLowerCase();
        const matchedPlan = prod.plans.find((pl) =>
          pl.duration && combinedText.includes(pl.duration.toLowerCase().trim())
        );
        initialPlans[pId] = matchedPlan || prod.plans[0];
      }
    });
    setSelectedProductPlans(initialPlans);

    const rawItems = Array.isArray(offer.items)
      ? offer.items
      : (offer.items ? offer.items.split(/[\n\r]+/).filter(Boolean) : []);

    let initialItemImages = Array.isArray(offer.itemImages) ? [...offer.itemImages] : [];
    if (initialItemImages.length < rawItems.length) {
      initialItemImages = rawItems.map((item, idx) => {
        return initialItemImages[idx] || resolveOfferItemImage(item, idx, offer, products);
      });
    }

    setOfferForm({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      type: offer.type || 'duo',
      badge: offer.badge || '',
      itemsText: rawItems.join('\n'),
      itemImages: initialItemImages,
      price: offer.price !== undefined ? offer.price : '',
      originalPrice: offer.originalPrice !== undefined ? offer.originalPrice : '',
      duration: offer.duration || '1 Mois',
      image: offer.image || initialItemImages[0] || '/images/logo.png',
      bgColor: offer.bgColor || '#ff5722',
      featuresText: Array.isArray(offer.features) ? offer.features.join('\n') : (offer.features || ''),
      isActive: offer.isActive !== false,
    });
    setIsOfferModalOpen(true);
  };

  // Helper pour obtenir le plan / la durée effective choisie pour un produit
  const getProductEffectivePlan = (prod, plansMap = selectedProductPlans) => {
    if (!prod) return { duration: '1 Mois', price: 0, originalPrice: 0 };
    const pId = String(prod._id || prod.id);
    if (plansMap && plansMap[pId]) {
      return plansMap[pId];
    }
    if (Array.isArray(prod.plans) && prod.plans.length > 0) {
      return prod.plans[0];
    }
    return {
      duration: prod.duration || '1 Mois',
      price: Number(prod.price) || 0,
      originalPrice: Number(prod.originalPrice) || Number(prod.price) || 0,
    };
  };

  // Recalcul automatique de l'offre (titre, contenu, prix sans remise, durée) selon les produits et durées choisis
  const recalculateOfferFromProducts = (selectedIds, plansMap) => {
    const prods = products.filter((p) => selectedIds.includes(String(p._id || p.id)));
    if (prods.length === 0) return;

    // Prix cumulés exacts sans remise selon les plans choisis
    const sumCur = prods.reduce((acc, p) => {
      const eff = getProductEffectivePlan(p, plansMap);
      return acc + (Number(eff.price) || Number(p.price) || 0);
    }, 0);

    const sumOrig = prods.reduce((acc, p) => {
      const eff = getProductEffectivePlan(p, plansMap);
      return acc + (Number(eff.originalPrice || eff.price || p.originalPrice || p.price) || 0);
    }, 0);

    // Contenu inclus avec mention claire de la durée choisie
    const itemsList = prods
      .map((p) => {
        const eff = getProductEffectivePlan(p, plansMap);
        return eff.duration ? `${p.name} (${eff.duration})` : p.name;
      })
      .join('\n');

    // Titre combiné avec les durées
    const comboTitle = prods
      .map((p) => {
        const eff = getProductEffectivePlan(p, plansMap);
        return eff.duration ? `${p.name} (${eff.duration})` : p.name;
      })
      .join(' + ');

    // Détermination de la durée globale recommandée de l'offre
    const distinctDurations = [
      ...new Set(prods.map((p) => getProductEffectivePlan(p, plansMap).duration).filter(Boolean)),
    ];
    const recommendedDuration =
      distinctDurations.length === 1
        ? distinctDurations[0]
        : (prods.length >= 2 ? 'Formule Spéciale' : (distinctDurations[0] || '1 Mois'));

    const featList =
      prods.map((p) => `Compte officiel et privé pour ${p.name}`).join('\n') +
      '\nSupport technique et garantie totale 7j/7';
    const collectedImages = prods.map((p) => p.images?.[0] || '/images/logo.png');
    const firstImg = collectedImages[0] || '/images/logo.png';

    setOfferForm((prev) => ({
      ...prev,
      title: comboTitle ? (prods.length >= 2 ? `Pack Duo : ${comboTitle}` : comboTitle) : prev.title,
      subtitle:
        prods.length >= 2
          ? `Combinaison exclusive : ${comboTitle} réunis à prix ultra avantageux.`
          : prev.subtitle,
      type: prods.length >= 2 ? 'duo' : 'promo',
      badge: prods.length >= 2 ? 'PACK DUO ÉCONOMIQUE' : 'SUPER PROMO',
      duration: recommendedDuration,
      itemsText: itemsList,
      itemImages: collectedImages,
      originalPrice: sumOrig > sumCur ? sumOrig : (sumCur > 0 ? Math.round(sumCur * 1.25) : ''),
      price: sumCur,
      image: prev.image && prev.image !== '/images/logo.png' ? prev.image : firstImg,
      featuresText: featList,
    }));
  };

  const handleSelectProductPlan = (prod, plan) => {
    const pId = String(prod._id || prod.id);
    const nextPlans = {
      ...selectedProductPlans,
      [pId]: plan,
    };
    setSelectedProductPlans(nextPlans);
    recalculateOfferFromProducts(selectedOfferProductIds, nextPlans);
  };

  const handleToggleProductInOffer = (prod) => {
    const prodId = String(prod._id || prod.id);
    let nextSelected;
    let nextPlans = { ...selectedProductPlans };

    if (selectedOfferProductIds.includes(prodId)) {
      nextSelected = selectedOfferProductIds.filter((id) => id !== prodId);
      delete nextPlans[prodId];
    } else {
      nextSelected = [...selectedOfferProductIds, prodId];
      if (Array.isArray(prod.plans) && prod.plans.length > 0) {
        nextPlans[prodId] = prod.plans[0];
      }
    }
    setSelectedOfferProductIds(nextSelected);
    setSelectedProductPlans(nextPlans);
    recalculateOfferFromProducts(nextSelected, nextPlans);
  };

  // Calcul automatique du total des abonnements de l'offre (selon les formules de durées sélectionnées)
  const currentOfferProducts = useMemo(() => {
    if (selectedOfferProductIds.length > 0) {
      return products.filter((p) => selectedOfferProductIds.includes(String(p._id || p.id)));
    }
    const searchTarget = `${offerForm.title || ''} ${offerForm.itemsText || ''}`.toLowerCase();
    if (!searchTarget.trim()) return [];
    return products.filter((p) => {
      const pName = (p.name || '').toLowerCase().trim();
      if (!pName) return false;
      const cleanName = pName.split(/[-—–]/)[0].trim();
      return (
        (cleanName && searchTarget.includes(cleanName)) ||
        searchTarget.includes(pName)
      );
    });
  }, [selectedOfferProductIds, products, offerForm.title, offerForm.itemsText]);

  const selectedProductsSum = useMemo(() => {
    return currentOfferProducts.reduce((acc, p) => {
      const eff = getProductEffectivePlan(p);
      return acc + (Number(eff.price) || Number(p.price) || 0);
    }, 0);
  }, [currentOfferProducts, selectedProductPlans]);

  const selectedProductsOrigSum = useMemo(() => {
    return currentOfferProducts.reduce((acc, p) => {
      const eff = getProductEffectivePlan(p);
      return acc + (Number(eff.originalPrice || eff.price || p.originalPrice || p.price) || 0);
    }, 0);
  }, [currentOfferProducts, selectedProductPlans]);

  // Produits sélectionnés ayant plusieurs durées / options de plans
  const selectedProductsWithMultiplePlans = useMemo(() => {
    return products.filter(
      (p) =>
        selectedOfferProductIds.includes(String(p._id || p.id)) &&
        Array.isArray(p.plans) &&
        p.plans.length > 1
    );
  }, [products, selectedOfferProductIds]);

  // Liste des abonnements de l'offre (pour l'éditeur d'images et la prévisualisation)
  const displayOfferItems = useMemo(() => {
    const fromText = (offerForm.itemsText || '')
      .split(/[\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromText.length > 0) return fromText;
    if (currentOfferProducts.length > 0) return currentOfferProducts.map((p) => p.name);
    if (offerForm.title.trim()) return [offerForm.title.trim()];
    return [];
  }, [offerForm.itemsText, currentOfferProducts, offerForm.title]);

  // Tous les abonnements filtrables pour la sélection rapide
  const filteredCombinerProducts = useMemo(() => {
    if (!offerCombinerSearch.trim()) return products;
    const q = offerCombinerSearch.toLowerCase().trim();
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [products, offerCombinerSearch]);

  const handleOfferImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      notify('Téléversement de l\'image de l\'offre... ⏳');
      let uploadedUrl;
      try {
        uploadedUrl = await productService.uploadImage(file);
      } catch {
        uploadedUrl = await compressImageFile(file);
      }
      if (uploadedUrl) {
        setOfferForm((prev) => ({ ...prev, image: uploadedUrl }));
        notify('Image de l\'offre enregistrée ! ✨');
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      notify('Erreur lors du téléversement de l\'image');
    }
  };

  const handleItemImageUpload = async (file, index) => {
    if (!file) return;
    try {
      notify(`Téléversement de l'image de l'abonnement ${index + 1}... ⏳`);
      let uploadedUrl;
      try {
        uploadedUrl = await productService.uploadImage(file);
      } catch {
        uploadedUrl = await compressImageFile(file);
      }
      if (uploadedUrl) {
        setOfferForm((prev) => {
          const nextItemImages = [...(prev.itemImages || [])];
          nextItemImages[index] = uploadedUrl;
          return {
            ...prev,
            itemImages: nextItemImages,
            image: index === 0 && (!prev.image || prev.image === '/images/logo.png') ? uploadedUrl : prev.image,
          };
        });
        notify(`Image de l'abonnement ${index + 1} mise à jour ! ✨`);
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      notify("Erreur lors du téléversement de l'image");
    }
  };

  const handleItemImageUrlChange = (url, index) => {
    setOfferForm((prev) => {
      const nextItemImages = [...(prev.itemImages || [])];
      nextItemImages[index] = url;
      return {
        ...prev,
        itemImages: nextItemImages,
      };
    });
  };

  const handleSaveOffer = async (e) => {
    e?.preventDefault();
    if (!offerForm.title.trim() || !offerForm.price) {
      alert('Veuillez renseigner au moins le titre et le prix de l\'offre.');
      return;
    }

    const items = offerForm.itemsText
      ? offerForm.itemsText.split(/[\n\r]+/).map((s) => s.trim()).filter(Boolean)
      : [];
    const features = offerForm.featuresText
      ? offerForm.featuresText.split(/[\n\r]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const resolvedItemImages = items.map((item, idx) => {
      return (
        offerForm.itemImages?.[idx] ||
        resolveOfferItemImage(item, idx, offerForm, products) ||
        '/images/logo.png'
      );
    });

    const offerData = {
      id: editingOfferId || `offer-${Date.now()}`,
      title: offerForm.title.trim(),
      subtitle: offerForm.subtitle.trim(),
      type: offerForm.type || 'duo',
      badge: offerForm.badge.trim(),
      items: items.length > 0 ? items : [offerForm.title.trim()],
      itemImages: resolvedItemImages,
      price: Number(offerForm.price),
      originalPrice: offerForm.originalPrice ? Number(offerForm.originalPrice) : null,
      duration: offerForm.duration.trim() || '1 Mois',
      image: offerForm.image || resolvedItemImages[0] || '/images/logo.png',
      bgColor: offerForm.bgColor || '#ff5722',
      features: features.length > 0 ? features : ['Accès complet garanti', 'Activation express'],
      isActive: offerForm.isActive !== false,
      order: 0,
    };

    try {
      setIsSaving(true);
      const saved = await offerService.save(offerData);
      let updatedOffers;
      const existingIdx = offers.findIndex((o) => (o.id || o._id) === (saved.id || saved._id));
      if (existingIdx >= 0) {
        updatedOffers = [...offers];
        updatedOffers[existingIdx] = saved;
      } else {
        updatedOffers = [saved, ...offers];
      }
      if (onUpdateOffers) {
        onUpdateOffers(updatedOffers);
      }
      setIsOfferModalOpen(false);
      notify('Offre spéciale enregistrée avec succès ! 🎉');
    } catch (err) {
      console.error('Erreur sauvegarde offre:', err);
      alert('Erreur lors de la sauvegarde de l\'offre : ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOfferActive = async (offer) => {
    try {
      const updated = { ...offer, isActive: !offer.isActive };
      const saved = await offerService.save(updated);
      const nextList = offers.map((o) => ((o.id || o._id) === (saved.id || saved._id) ? saved : o));
      if (onUpdateOffers) {
        onUpdateOffers(nextList);
      }
      notify(saved.isActive ? 'Offre activée et visible par les clients ! ✅' : 'Offre masquée du site. 👁️‍🗨️');
    } catch (err) {
      console.error('Erreur toggle offre:', err);
      notify('Erreur lors de la mise à jour de l\'offre');
    }
  };

  const handleDeleteOffer = (targetOffer) => {
    const offerId = targetOffer?.id || targetOffer?._id;
    const offerTitle = targetOffer?.title || 'Offre';
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer cette offre ?',
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'offre "${offerTitle}" ?`,
      productName: offerTitle,
      confirmText: 'Oui, supprimer l\'offre',
      confirmType: 'danger',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          if (targetOffer?._id) {
            await offerService.delete(targetOffer._id);
          }
          if (targetOffer?.id && targetOffer?.id !== targetOffer?._id) {
            await offerService.delete(targetOffer.id);
          }
          const nextList = offers.filter(
            (o) => o.id !== targetOffer?.id && o._id !== targetOffer?._id && (o.id || o._id) !== offerId
          );
          if (onUpdateOffers) {
            onUpdateOffers(nextList);
          }
          setConfirmModal({ isOpen: false, isProcessing: false });
          notify('Offre supprimée avec succès ! 🗑️');
        } catch (err) {
          console.error('Erreur suppression offre:', err);
          setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
          notify('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleDeleteAllOffers = () => {
    if (!offers || offers.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer TOUTES les offres ?',
      message: `Attention : Êtes-vous sûr de vouloir supprimer définitivement les ${offers.length} offres configurées ? Cette action videra complètement la vitrine des offres.`,
      productName: `${offers.length} offres`,
      confirmText: 'Oui, tout supprimer définitivement',
      confirmType: 'danger',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          await offerService.deleteAll();
          if (onUpdateOffers) {
            onUpdateOffers([]);
          }
          setConfirmModal({ isOpen: false, isProcessing: false });
          notify('Toutes les offres ont été supprimées avec succès ! 🗑️');
        } catch (err) {
          console.error('Erreur suppression totale des offres:', err);
          setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
          notify('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleResetOffers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restaurer les 4 offres d\'origine ?',
      message: 'Voulez-vous réinitialiser les 4 packs et offres promotionnelles d\'origine ?',
      productName: 'Offres officielles',
      confirmText: 'Oui, restaurer les packs',
      confirmType: 'primary',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          const restored = await offerService.reset();
          if (onUpdateOffers) {
            onUpdateOffers(restored);
          }
          setConfirmModal({ isOpen: false, isProcessing: false });
          notify('Packs et offres d\'origine restaurés avec succès ! ✨');
        } catch (err) {
          console.error('Erreur restauration offres:', err);
          setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
          notify('Erreur lors de la restauration');
        }
      },
    });
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      description: '',
      category: 'ai-tools',
      badge: 'Nouveau ✨',
      price: 20,
      originalPrice: 30,
      sourceBot: '',
      displayMode: 'carousel',
      selectedImageIndex: 0,
      images: ['/images/logo.png'],
      plans: [
        { id: `plan-${Date.now()}-1`, duration: '1 Mois', price: 20 },
        { id: `plan-${Date.now()}-2`, duration: '1 An Complet', price: 180 },
      ],
    });
    setNewPlanDuration('');
    setNewPlanPrice('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    const pImages = product.images && product.images.length > 0 ? [...product.images] : ['/images/logo.png'];
    const pDisplayMode = product.displayMode || (pImages.length > 1 ? 'carousel' : 'single');
    const pSelectedIdx =
      typeof product.selectedImageIndex === 'number' &&
      product.selectedImageIndex >= 0 &&
      product.selectedImageIndex < pImages.length
        ? product.selectedImageIndex
        : 0;

    setFormData({
      id: product._id || product.id,
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'ai-tools',
      badge: product.badge || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      sourceBot: product.sourceBot || '',
      displayMode: pDisplayMode,
      selectedImageIndex: pSelectedIdx,
      images: pImages,
      plans: product.plans ? product.plans.map((p) => ({ ...p })) : [],
    });
    setNewPlanDuration('');
    setNewPlanPrice('');
    setIsModalOpen(true);
  };

  // Helper to remove black background from an image using edge flood-fill
  const removeBlackBgFromImage = (imageSrc, threshold = 40) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          const visited = new Uint8Array(w * h);
          const queue = [];

          // Enqueue all 4 outer border pixels
          for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
          }
          for (let y = 0; y < h; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
          }

          let head = 0;
          while (head < queue.length) {
            const cx = queue[head++];
            const cy = queue[head++];
            const idx = cy * w + cx;
            if (visited[idx]) continue;
            visited[idx] = 1;

            const pIdx = idx * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            const a = data[pIdx + 3];

            // If the outer pixel is dark/black, make it completely transparent
            if (a > 0 && r <= threshold && g <= threshold && b <= threshold) {
              data[pIdx + 3] = 0;

              // Expand to adjacent pixels
              if (cx > 0) queue.push(cx - 1, cy);
              if (cx < w - 1) queue.push(cx + 1, cy);
              if (cy > 0) queue.push(cx, cy - 1);
              if (cy < h - 1) queue.push(cx, cy + 1);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('Erreur canvas fond transparent :', err);
          resolve(imageSrc);
        }
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Helper to compress uploaded images while preserving 100% transparency for PNG and WebP
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const isPng = file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png');
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
      const isGif = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');
      const isWebp = file.type === 'image/webp' || file.name?.toLowerCase().endsWith('.webp');

      if (isSvg || isGif) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Ensure transparent buffer (alpha = 0)
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // CRITICAL: PNG and WebP preserve 100% transparency!
          // NEVER use image/jpeg for PNG because JPEG replaces transparent alpha with solid black!
          if (isPng) {
            resolve(canvas.toDataURL('image/png'));
          } else if (isWebp) {
            resolve(canvas.toDataURL('image/webp', 0.9));
          } else {
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          }
        };
        img.onerror = () => resolve(uploadEvent.target.result);
        img.src = uploadEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Uploading multiple images from computer directly to database & server
  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      notify(`Enregistrement de ${files.length} photo(s) sur le serveur... ⏳`);
      let uploadedUrls = [];
      try {
        uploadedUrls = await productService.uploadMultipleImages(files);
      } catch (uploadErr) {
        console.warn('Upload serveur a échoué, fallback compression locale :', uploadErr);
        uploadedUrls = await Promise.all(
          files.map((file) => compressImageFile(file))
        );
      }

      setFormData((prev) => {
        const existingImages = prev.images.filter((img) => img !== '/images/logo.png');
        return {
          ...prev,
          images: [...existingImages, ...uploadedUrls],
        };
      });

      notify(`${files.length} photo(s) enregistrée(s) dans la base de données ! ✨`);
    } catch (err) {
      console.error('Erreur chargement photos :', err);
    }
  };

  const handleMakeImageTransparent = async (indexToTransform) => {
    const target = formData.images[indexToTransform];
    if (!target) return;
    notify('Suppression du fond noir en cours... ⏳');
    try {
      const transparentUrl = await removeBlackBgFromImage(target);
      let finalUrl = transparentUrl;
      try {
        const saved = await productService.uploadBase64(transparentUrl, `trans-${Date.now()}.png`);
        if (saved) finalUrl = saved;
      } catch (uploadErr) {
        console.warn('Sauvegarde serveur échouée, conservation en mémoire :', uploadErr);
      }

      setFormData((prev) => {
        const next = [...prev.images];
        next[indexToTransform] = finalUrl;
        return { ...prev, images: next };
      });
      notify('Fond transparent généré et enregistré avec succès ! ✨');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newSelected = prev.selectedImageIndex || 0;
      if (newImages.length === 0) {
        newSelected = 0;
      } else if (newSelected >= newImages.length) {
        newSelected = Math.max(0, newImages.length - 1);
      } else if (newSelected > indexToRemove) {
        newSelected = newSelected - 1;
      }
      return {
        ...prev,
        images: newImages,
        selectedImageIndex: newSelected,
      };
    });
  };

  const handleSelectCardImage = (imgIdx) => {
    setFormData((prev) => ({
      ...prev,
      selectedImageIndex: imgIdx,
    }));
    notify(`Photo #${imgIdx + 1} sélectionnée pour le card ! 📸`);
  };

  const handleMoveImage = (currentIndex, direction) => {
    setFormData((prev) => {
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const updatedImages = [...prev.images];
      const [moved] = updatedImages.splice(currentIndex, 1);
      updatedImages.splice(targetIndex, 0, moved);

      let newSelected = prev.selectedImageIndex ?? 0;
      if (newSelected === currentIndex) {
        newSelected = targetIndex;
      } else if (currentIndex < targetIndex && newSelected > currentIndex && newSelected <= targetIndex) {
        newSelected -= 1;
      } else if (currentIndex > targetIndex && newSelected >= targetIndex && newSelected < currentIndex) {
        newSelected += 1;
      }

      return {
        ...prev,
        images: updatedImages,
        selectedImageIndex: newSelected,
      };
    });
  };

  // Adding a duration plan
  const handleAddPlan = () => {
    if (!newPlanDuration.trim() || !newPlanPrice) {
      alert('Veuillez renseigner le nom de la durée et son prix.');
      return;
    }

    const newPlan = {
      id: `plan-${Date.now()}`,
      duration: newPlanDuration.trim(),
      price: parseFloat(newPlanPrice) || 0,
    };

    setFormData((prev) => ({
      ...prev,
      plans: [...prev.plans, newPlan],
    }));

    setNewPlanDuration('');
    setNewPlanPrice('');
  };

  const handleRemovePlan = (planId) => {
    setFormData((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.id !== planId),
    }));
  };

  // Save product (Add or Edit) to MongoDB Atlas
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Veuillez entrer le nom du produit.');
      return;
    }

    const numericPrice = parseFloat(formData.price) || 0;
    const numericOriginalPrice = parseFloat(formData.originalPrice) || 0;

    setIsSaving(true);
    try {
      // Ensure all images are saved to the server uploads folder and converted to clean URLs
      let finalImages = [...formData.images];
      if (finalImages.length > 0) {
        finalImages = await Promise.all(
          finalImages.map(async (img) => {
            if (typeof img === 'string' && img.startsWith('data:')) {
              try {
                const uploadedUrl = await productService.uploadBase64(img);
                return uploadedUrl || img;
              } catch (e) {
                console.warn('Erreur téléversement base64 :', e);
                return img;
              }
            }
            return img;
          })
        );
      }

      let safeSelectedImageIndex = parseInt(formData.selectedImageIndex, 10);
      if (isNaN(safeSelectedImageIndex) || safeSelectedImageIndex < 0 || safeSelectedImageIndex >= finalImages.length) {
        safeSelectedImageIndex = 0;
      }

      const finalProduct = {
        ...formData,
        price: numericPrice,
        originalPrice: numericOriginalPrice,
        images: finalImages.length > 0 ? finalImages : ['/images/logo.png'],
        displayMode: formData.displayMode || (finalImages.length > 1 ? 'carousel' : 'single'),
        selectedImageIndex: safeSelectedImageIndex,
      };
      if (editingProduct) {
        const idToUpdate = editingProduct._id || editingProduct.id;
        const updatedDoc = await productService.update(idToUpdate, finalProduct);
        const updatedList = products.map((p) => ((p._id || p.id) === idToUpdate ? updatedDoc : p));
        onUpdateProducts(updatedList);

        // 1. Synchronize Hero Slides (Home Page Carousel & Admin Hero Carousel Manager)
        if (heroSlides && heroSlides.length > 0 && onUpdateHeroSlides) {
          let hasSlideChanged = false;
          const updatedHeroSlides = heroSlides.map((slide) => {
            const isMatch =
              (slide.productId && (slide.productId === idToUpdate || slide.productId === editingProduct.id || slide.productId === editingProduct._id)) ||
              (slide.id && (slide.id === idToUpdate || slide.id === editingProduct.id || slide.id === editingProduct._id)) ||
              (slide.name && editingProduct.name && slide.name.trim().toLowerCase() === editingProduct.name.trim().toLowerCase());

            if (!isMatch) return slide;

            hasSlideChanged = true;

            // Resolve image for slide:
            let slideImg = slide.image;
            const newImages = updatedDoc.images && updatedDoc.images.length > 0 ? updatedDoc.images : [];
            let chosenIdx = slide.selectedImageIndex;

            if (newImages.length > 0) {
              if (chosenIdx !== undefined && newImages[chosenIdx]) {
                slideImg = newImages[chosenIdx];
              } else {
                const foundIdx = newImages.indexOf(slideImg);
                if (foundIdx >= 0) {
                  chosenIdx = foundIdx;
                } else {
                  chosenIdx = 0;
                  slideImg = newImages[0];
                }
              }
            }

            return {
              ...slide,
              productId: idToUpdate,
              name: updatedDoc.name,
              description: updatedDoc.description || '',
              price: Number(updatedDoc.price),
              originalPrice: updatedDoc.originalPrice ? Number(updatedDoc.originalPrice) : null,
              plans: updatedDoc.plans && updatedDoc.plans.length > 0 ? updatedDoc.plans : [],
              image: slideImg,
              selectedImageIndex: chosenIdx !== undefined ? chosenIdx : 0,
            };
          });

          if (hasSlideChanged) {
            onUpdateHeroSlides(updatedHeroSlides);
          }
        }

        // 2. Synchronize modal 'Mettre en avant un produit dans le carrousel d’accueil' state
        setHeroForm((prev) => {
          const isMatch =
            (prev.productId && (prev.productId === idToUpdate || prev.productId === editingProduct.id || prev.productId === editingProduct._id)) ||
            (prev.name && editingProduct.name && prev.name.trim().toLowerCase() === editingProduct.name.trim().toLowerCase());

          if (!isMatch) return prev;

          let formImg = prev.image;
          const newImages = updatedDoc.images && updatedDoc.images.length > 0 ? updatedDoc.images : [];
          let chosenIdx = prev.selectedImageIndex;

          if (newImages.length > 0) {
            if (chosenIdx !== undefined && newImages[chosenIdx]) {
              formImg = newImages[chosenIdx];
            } else {
              const foundIdx = newImages.indexOf(formImg);
              if (foundIdx >= 0) {
                chosenIdx = foundIdx;
              } else {
                chosenIdx = 0;
                formImg = newImages[0];
              }
            }
          }

          return {
            ...prev,
            productId: idToUpdate,
            name: updatedDoc.name,
            description: updatedDoc.description || '',
            price: Number(updatedDoc.price),
            originalPrice: updatedDoc.originalPrice ? Number(updatedDoc.originalPrice) : '',
            image: formImg,
            selectedImageIndex: chosenIdx !== undefined ? chosenIdx : 0,
          };
        });

        notify('Produit et Carrousel d\'Accueil synchronisés avec succès ! ✅');
      } else {
        const createdDoc = await productService.create(finalProduct);
        const updatedList = [createdDoc, ...products];
        onUpdateProducts(updatedList);
        notify('Nouveau produit enregistré dans la base de données ! 🎉');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur MongoDB :', err);
      alert('Erreur lors de la sauvegarde dans la base de données : ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Delete Confirmation Modal (Replaces window.confirm)
  const handleOpenDeleteModal = (productId, productName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le produit ?',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement cet élément de la base de données ?',
      productName: productName,
      confirmText: 'Oui, supprimer définitivement',
      confirmType: 'danger',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          await productService.delete(productId);
          const updatedList = products.filter((p) => (p._id || p.id) !== productId);
          onUpdateProducts(updatedList);
          setConfirmModal({ isOpen: false, isProcessing: false });
          notify('Produit supprimé avec succès de la base de données. 🗑️');
        } catch (err) {
          console.error('Erreur suppression MongoDB :', err);
          setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
          notify(`Erreur de suppression : ${err.message}`);
        }
      },
    });
  };

  // Custom Reset Confirmation Modal (Replaces window.confirm)
  const handleOpenResetModal = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Réinitialiser la base de données ?',
      message: 'Voulez-vous restaurer tous les produits aux valeurs d\'origine ?',
      productName: `${products.length} produit(s) actuellement enregistré(s)`,
      confirmText: 'Oui, réinitialiser tout',
      confirmType: 'warning',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          const resetData = await productService.reset(INITIAL_PRODUCTS);
          onUpdateProducts(resetData);
          setConfirmModal({ isOpen: false, isProcessing: false });
          notify('Base de données réinitialisée avec succès. 🔄');
        } catch (err) {
          console.error('Erreur réinitialisation MongoDB :', err);
          setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
          notify(`Erreur de réinitialisation : ${err.message}`);
        }
      },
    });
  };


  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-page-layout">
      {/* Admin Navigation Bar */}
      <header className="admin-top-bar">
        <div className="admin-brand-section">
          <img src="/images/technotech-logo-v2.png?v=20260922" alt="Logo" className="admin-logo-img" />
          <div>
            <h1 className="admin-page-title">Panneau d'Administration (Admin)</h1>
            <span className="admin-page-subtitle">Console de Gestion TechnoTech</span>
          </div>
        </div>

        <div className="admin-actions-group">
          {/* Security Notification Bell Icon */}
          <button
            type="button"
            className={`admin-security-bell-btn ${unreadSecurityCount > 0 ? 'has-alerts' : ''}`}
            onClick={() => setIsSecurityCenterOpen(true)}
            title={unreadSecurityCount > 0 ? `${unreadSecurityCount} alerte(s) de sécurité non lue(s)` : 'Centre de sécurité TechnoTech'}
            aria-label="Centre de sécurité"
          >
            <Bell size={18} className="bell-icon" />
            {unreadSecurityCount > 0 && (
              <span className="security-bell-badge">
                <span className="security-bell-ping" />
                <span>{unreadSecurityCount > 99 ? '99+' : unreadSecurityCount}</span>
              </span>
            )}
          </button>
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onNavigateStore}
          >
            <ArrowLeft size={17} />
            <span>Retour à la boutique</span>
          </button>

          {onLogout && (
            <button
              type="button"
              className="admin-btn secondary admin-logout-btn"
              onClick={onLogout}
              title="Verrouiller et fermer la session"
            >
              <Lock size={15} />
              <span>Déconnexion</span>
            </button>
          )}

          {activeTab === 'products' && (
            <button
              type="button"
              className="admin-btn primary"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} />
              <span>Ajouter un produit</span>
            </button>
          )}

          {activeTab === 'hero' && (
            <button
              type="button"
              className="admin-btn primary"
              onClick={handleOpenAddHeroModal}
            >
              <Plus size={18} />
              <span>Ajouter au Carrousel</span>
            </button>
          )}

          {activeTab === 'offers' && (
            <button
              type="button"
              className="admin-btn primary offers-admin-add-btn"
              onClick={handleOpenAddOfferModal}
            >
              <Plus size={18} />
              <span>Créer une Offre / Pack</span>
            </button>
          )}

          {activeTab === 'security' && (
            <button
              type="button"
              className="admin-btn primary security-save-top-btn"
              onClick={handleSaveSecuritySettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? <Loader2 size={17} className="btn-spinner-icon" /> : <Save size={17} />}
              <span>Enregistrer la Protection</span>
            </button>
          )}
        </div>
      </header>

      {/* Security Warning Banner when there are unread alerts */}
      {unreadSecurityCount > 0 && (
        <div className="admin-security-warning-banner">
          <div className="security-warning-content">
            <div className="security-warning-pulse-icon">
              <ShieldAlert size={18} />
            </div>
            <div className="security-warning-texts">
              <span className="security-warning-main">
                <strong>Alerte de Sécurité TechnoTech :</strong> {unreadSecurityCount} tentative(s) d'accès non autorisée(s) détectée(s) à la console d'administration.
              </span>
              <span className="security-warning-ar">
                (تنبيه أمني: تم رصد {unreadSecurityCount} محاولة دخول غير مصرح بها إلى لوحة التحكم)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="security-warning-action-btn"
            onClick={() => setIsSecurityCenterOpen(true)}
          >
            <span>Examiner les détails (معاينة)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="admin-navigation-tabs-wrapper">
        <div className="admin-tabs-list">
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={17} />
            <span>Catalogue des Produits</span>
            <span className="tab-count-badge">{products.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'hero' ? 'active' : ''}`}
            onClick={() => setActiveTab('hero')}
          >
            <Sparkles size={17} />
            <span>Carrousel de la Page d'Accueil (Hero 3D)</span>
            <span className="tab-count-badge hero-badge">{heroSlides.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            <Flame size={17} />
            <span>Packs & Offres Spéciaux</span>
            <span className="tab-count-badge offers-badge">{offers.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'orders' ? 'active' : ''} ${unseenOrdersCount > 0 ? 'has-unseen-orders' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              markAllOrdersAsSeen(orders);
            }}
          >
            <ShoppingBag size={17} />
            <span>Gestion de commande</span>
            {unseenOrdersCount > 0 ? (
              <span
                className="tab-count-badge orders-badge unseen-alert"
                title={`${unseenOrdersCount} nouvelle(s) commande(s) non consultée(s)`}
              >
                <span className="unseen-ping-dot" />
                <span>{unseenOrdersCount}</span>
              </span>
            ) : orders.length > 0 ? (
              <span
                className="tab-count-badge orders-badge"
                title={`${orders.length} commande(s) au total`}
              >
                {orders.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={17} />
            <span>Sécurité & Protection</span>
            <span
              className={`tab-count-badge ${securityForm.disableInspect || securityForm.disableRightClick ? 'security-badge-active' : 'security-badge-muted'}`}
            >
              {securityForm.disableInspect || securityForm.disableRightClick ? 'Protégé' : 'Inactif'}
            </span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <Link2 size={17} />
            <span>Stock Liens (Gemini Pro)</span>
            {availableLinksCount > 0 && (
              <span className="tab-count-badge links-badge" title={`${availableLinksCount} lien(s) disponible(s)`}>
                {availableLinksCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="admin-content-container">
        {/* Status Toast */}
        {statusNotice && (
          <div className="admin-status-toast">
            <Check size={18} />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* ================================================================
            HERO CAROUSEL MANAGER VIEW
            ================================================================ */}
        {activeTab === 'hero' && (
          <div className="hero-manager-wrapper">
            {/* Banner Guide */}
            <div className="hero-manager-banner">
              <div className="banner-icon-box">
                <Palette size={26} />
              </div>
              <div className="banner-text-box">
                <h2 className="banner-heading">Personnalisation du Carrousel d'Accueil (Hero 3D)</h2>
                <p className="banner-subtext">
                  Sélectionnez les produits qui défilent en haut de la page d'accueil, choisissez leur photo dédiée et définissez une couleur d'arrière-plan personnalisée avec transition fluide pour chaque produit.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn primary add-hero-slide-btn"
                onClick={handleOpenAddHeroModal}
              >
                <Plus size={18} />
                <span>Ajouter au Carrousel</span>
              </button>
            </div>

            {/* Slides List */}
            <div className="hero-slides-admin-grid">
              {heroSlides.length === 0 ? (
                <div className="hero-empty-state-card">
                  <Sparkles size={42} color="#ff7828" />
                  <h3>Aucun produit configuré pour le carrousel</h3>
                  <p>Sélectionnez un produit du catalogue pour le mettre en avant sur la page d'accueil avec sa couleur d'ambiance.</p>
                  <button
                    type="button"
                    className="admin-btn primary"
                    onClick={handleOpenAddHeroModal}
                  >
                    <Plus size={17} />
                    <span>Ajouter un premier produit</span>
                  </button>
                </div>
              ) : (
                heroSlides.map((slide, index) => {
                  const matchingProd = products.find(
                    (p) =>
                      (p._id && (p._id === slide.productId || p._id === slide.id)) ||
                      (p.id && (p.id === slide.productId || p.id === slide.id)) ||
                      (p.name && slide.name && p.name.trim().toLowerCase() === slide.name.trim().toLowerCase())
                  );
                  const displayTitle = matchingProd ? matchingProd.name : slide.name;
                  const displayCurrentPrice = matchingProd?.price !== undefined ? matchingProd.price : slide.price;
                  const displayOrigPrice = matchingProd?.originalPrice !== undefined ? matchingProd.originalPrice : slide.originalPrice;
                  const displayDescription = matchingProd ? (matchingProd.description || '') : (slide.description || 'Sans description');
                  const displayImg = getImageUrl(slide.image || (matchingProd?.images && matchingProd.images[0]) || '/images/logo.png');

                  return (
                    <div key={slide.id || index} className="hero-slide-card">
                      {/* Order & Reorder Controls */}
                      <div className="slide-order-sidebar">
                        <span className="slide-order-number">#{index + 1}</span>
                        <div className="reorder-btns-col">
                          <button
                            type="button"
                            className="reorder-btn"
                            disabled={index === 0}
                            onClick={() => handleMoveHeroSlide(index, -1)}
                            title="Déplacer vers le haut"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            className="reorder-btn"
                            disabled={index === heroSlides.length - 1}
                            onClick={() => handleMoveHeroSlide(index, 1)}
                            title="Déplacer vers le bas"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Image Preview with Color Glow */}
                      <div className="slide-img-preview-card" style={{ boxShadow: `0 0 24px ${slide.bgColor || '#ff7828'}33` }}>
                        <img
                          key={`slide-img-${slide.id || index}-${displayImg ? displayImg.slice(-20) : ''}`}
                          src={displayImg}
                          alt={displayTitle}
                          className="slide-thumb-img"
                          title="Vitrine principale"
                        />
                        {slide.thumbnailImage && slide.thumbnailImage !== slide.image && (
                          <div className="slide-card-thumb-badge" title="Miniature Carrousel">
                            <img src={getImageUrl(slide.thumbnailImage)} alt="Miniature" />
                            <span>Carrousel</span>
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="slide-details-area">
                        <div className="slide-title-row">
                          <h3 className="slide-title">{displayTitle}</h3>
                          <div className="slide-price-tag">
                            <span className="slide-price-current">{displayCurrentPrice} DT</span>
                            {displayOrigPrice && (
                              <span className="slide-price-original">{displayOrigPrice} DT</span>
                            )}
                          </div>
                        </div>

                        <p className="slide-description">{displayDescription}</p>

                      <div className="slide-meta-row">
                        {/* Color Swatch & Code */}
                        <div className="slide-color-indicator">
                          <span className="color-label">Couleur de fond :</span>
                          <div className="color-chip" style={{ background: slide.bgColor || '#e25816' }}>
                            <span className="color-chip-dot" />
                            <span className="color-hex-val">{slide.bgColor || '#e25816'}</span>
                          </div>
                        </div>

                        {/* Gradient Mini-Bar Preview */}
                        <div
                          className="slide-gradient-preview-bar"
                          style={{
                            background: `radial-gradient(ellipse 90% 75% at 50% 34%, ${slide.bgColor || '#e25816'} 0%, #060913 100%)`
                          }}
                          title="Aperçu du dégradé d'ambiance d'arrière-plan"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="slide-actions-area">
                      <button
                        type="button"
                        className="action-icon-btn edit"
                        onClick={() => handleOpenEditHeroModal(slide, index)}
                        title="Modifier la slide"
                      >
                        <Edit3 size={16} />
                        <span>Modifier</span>
                      </button>

                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => handleDeleteHeroSlide(index)}
                        title="Retirer du carrousel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        {/* ================================================================
            ORDERS MANAGEMENT VIEW (GESTION DE COMMANDE)
            ================================================================ */}
        {activeTab === 'orders' && (
          <OrdersManager notify={notify} onOrdersChange={handleOrdersChange} />
        )}

        {/* ================================================================
            READY LINKS & DIGITAL STOCK MANAGEMENT VIEW (قسم الأدمن)
            ================================================================ */}
        {activeTab === 'links' && (
          <LinksManager products={products} notify={notify} />
        )}

        {/* ================================================================
            OFFERS & PACKS MANAGEMENT VIEW
            ================================================================ */}
        {activeTab === 'offers' && (
          <div className="offers-manager-wrapper">
            {/* Banner Guide */}
            <div className="hero-manager-banner offers-manager-banner">
              <div className="banner-icon-box offers-icon-box">
                <Flame size={26} />
              </div>
              <div className="banner-text-box">
                <h2 className="banner-heading">Gestion des Packs & Offres Promotionnelles</h2>
                <p className="banner-subtext">
                  Configurez vos formules d'abonnements 2-en-1 ("Packs Duo") et promotions exclusives.
                  Combinez librement les abonnements de votre catalogue, ajustez la remise et publiez-les instantanément sur la vitrine.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="admin-btn primary add-offer-btn"
                  onClick={handleOpenAddOfferModal}
                >
                  <Plus size={18} />
                  <span>Créer une Offre / Pack</span>
                </button>
                {offers.length > 0 && (
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={handleDeleteAllOffers}
                    title="Supprimer définitivement toutes les offres configurées"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Supprimer tout ({offers.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="admin-control-strip offers-control-strip">
              <div className="admin-strip-stats">
                <span className="stats-pill">
                  Total des offres : <strong>{offers.length}</strong>
                </span>
                <span className="stats-pill">
                  Actives sur le site : <strong style={{ color: '#10b981' }}>{offers.filter((o) => o.isActive !== false).length}</strong>
                </span>
                <span className="stats-pill">
                  Packs Duo : <strong>{offers.filter((o) => o.type === 'duo').length}</strong>
                </span>
                <span className="stats-pill">
                  Super Promos : <strong>{offers.filter((o) => o.type === 'promo').length}</strong>
                </span>
              </div>
            </div>

            {/* Offers Grid */}
            <div className="offers-admin-grid">
              {offers.length === 0 ? (
                <div className="hero-empty-state-card" style={{ gridColumn: '1 / -1' }}>
                  <Flame size={44} color="#ff5722" />
                  <h3>Aucune offre configurée pour le moment</h3>
                  <p>Toutes les offres ont été supprimées. Vous pouvez créer de nouvelles offres personnalisées ou réinitialiser les packs par défaut.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-btn primary"
                      onClick={handleOpenAddOfferModal}
                    >
                      <Plus size={17} />
                      <span>Créer une première offre</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn secondary"
                      onClick={handleResetOffers}
                    >
                      <RefreshCw size={16} />
                      <span>Restaurer les packs par défaut</span>
                    </button>
                  </div>
                </div>
              ) : (
                offers.map((offer, index) => {
                  const offerId = offer.id || offer._id || `offer-${index}`;
                  const isDuo = offer.type === 'duo';
                  const savingsDT = offer.originalPrice && offer.originalPrice > offer.price
                    ? offer.originalPrice - offer.price
                    : 0;
                  const savingsPct = offer.originalPrice && offer.originalPrice > offer.price
                    ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
                    : 0;

                  return (
                    <div
                      key={offerId}
                      className={`admin-offer-card ${offer.isActive === false ? 'is-inactive' : ''}`}
                    >
                      {/* Card Header Tag */}
                      <div className="admin-offer-top">
                        <div className="admin-offer-tags-left">
                          <span className={`admin-offer-type-pill ${isDuo ? 'duo' : 'promo'}`}>
                            {isDuo ? '🤝 Pack Duo' : '⚡ Super Promo'}
                          </span>
                          {offer.badge && (
                            <span className="admin-offer-badge-pill">{offer.badge}</span>
                          )}
                        </div>
                        <div className="admin-offer-status-right">
                          <span className={`status-indicator-dot ${offer.isActive !== false ? 'active' : 'inactive'}`} />
                          <span className="status-indicator-text">
                            {offer.isActive !== false ? 'Actif' : 'Masqué'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="admin-offer-body">
                        <div className="admin-offer-thumb-wrap">
                          <img
                            src={getImageUrl(offer.image || '/images/logo.png')}
                            alt={offer.title}
                            className="admin-offer-thumb"
                          />
                        </div>
                        <div className="admin-offer-info">
                          <h3 className="admin-offer-title">{offer.title}</h3>
                          {offer.subtitle && (
                            <p className="admin-offer-subtitle">{offer.subtitle}</p>
                          )}
                          <div className="admin-offer-meta-row">
                            <span className="admin-offer-duration-tag">
                              ⏳ {offer.duration || '1 Mois'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Included Items breakdown */}
                      {Array.isArray(offer.items) && offer.items.length > 0 && (
                        <div className="admin-offer-items-box">
                          <span className="admin-offer-items-label">Contenu inclus :</span>
                          <div className="admin-offer-items-list">
                            {offer.items.map((item, i) => (
                              <div key={i} className="admin-offer-item-chip">
                                <Check size={12} color="#10b981" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Strip */}
                      <div className="admin-offer-pricing-strip">
                        <div className="admin-offer-prices">
                          <span className="admin-offer-price-val">{offer.price} DT</span>
                          {offer.originalPrice && (
                            <span className="admin-offer-price-orig">{offer.originalPrice} DT</span>
                          )}
                        </div>
                        {savingsDT > 0 && (
                          <div className="admin-offer-savings-pill">
                            <span>Économie : -{savingsDT} DT ({savingsPct}%)</span>
                          </div>
                        )}
                      </div>

                      {/* Actions footer */}
                      <div className="admin-offer-actions-footer">
                        <button
                          type="button"
                          className={`offer-action-btn toggle-visibility ${offer.isActive === false ? 'reactivate' : ''}`}
                          onClick={() => handleToggleOfferActive(offer)}
                          title={offer.isActive !== false ? "Masquer cette offre du site" : "Activer cette offre"}
                        >
                          {offer.isActive !== false ? <EyeOff size={15} /> : <Eye size={15} />}
                          <span>{offer.isActive !== false ? 'Masquer' : 'Activer'}</span>
                        </button>

                        <button
                          type="button"
                          className="offer-action-btn edit"
                          onClick={() => handleOpenEditOfferModal(offer)}
                          title="Modifier l'offre"
                        >
                          <Edit3 size={15} />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          className="offer-action-btn delete"
                          onClick={() => handleDeleteOffer(offer)}
                          title="Supprimer l'offre"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            SECURITY & ANTI-INSPECT PROTECTION VIEW
            ================================================================ */}
        {activeTab === 'security' && (
          <div className="security-manager-wrapper">
            {/* Guide & Status Banner */}
            <div className={`hero-manager-banner security-status-banner ${securityForm.disableInspect || securityForm.disableRightClick ? 'protection-enabled' : 'protection-disabled'}`}>
              <div className="banner-icon-box security-icon-box">
                {securityForm.disableInspect || securityForm.disableRightClick ? (
                  <ShieldCheck size={28} className="shield-icon-active" />
                ) : (
                  <ShieldAlert size={28} className="shield-icon-inactive" />
                )}
              </div>
              <div className="banner-text-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 className="banner-heading">Protection du Contenu & Sécurité Antivol</h2>
                  <span className={`security-live-pill ${securityForm.disableInspect || securityForm.disableRightClick ? 'live-on' : 'live-off'}`}>
                    {securityForm.disableInspect || securityForm.disableRightClick ? '● SYSTÈME ACTIF' : '○ SYSTÈME DÉSACTIVÉ'}
                  </span>
                </div>
                <p className="banner-subtext">
                  Verrouillez l'inspecteur web (F12 / DevTools) et le clic droit pour empêcher les visiteurs et concurrents de voler vos affiches, d'extraire les liens d'images ou d'analyser le code de TechnoTech.
                </p>
              </div>
              <div className="security-banner-actions">
                <button
                  type="button"
                  className="security-quick-btn active-all"
                  onClick={() => handleToggleAllSecurity(true)}
                  title="Activer toutes les protections en 1 clic"
                >
                  <Lock size={15} />
                  <span>Tout Activer</span>
                </button>
                <button
                  type="button"
                  className="security-quick-btn disable-all"
                  onClick={() => handleToggleAllSecurity(false)}
                  title="Désactiver temporairement les protections"
                >
                  <Unlock size={15} />
                  <span>Tout Désactiver</span>
                </button>
              </div>
            </div>

            {/* Security Settings Cards Grid */}
            <div className="security-cards-grid">
              {/* Card 1: Right Click Disable */}
              <div className={`security-feature-card ${securityForm.disableRightClick ? 'active' : 'inactive'}`}>
                <div className="card-top-header">
                  <div className="feature-icon-wrapper mouse-icon">
                    <MousePointer size={22} />
                  </div>
                  <div className="card-badge-status">
                    {securityForm.disableRightClick ? (
                      <span className="badge-chip chip-active"><Check size={12} /> Clic Droit Bloqué</span>
                    ) : (
                      <span className="badge-chip chip-inactive"><X size={12} /> Autorisé</span>
                    )}
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Blocage du Clic Droit (Anti-Copie d'Images)</h3>
                  <p className="feature-card-desc">
                    Désactive complètement le menu contextuel du clic droit sur tout le site public. Empêche les utilisateurs de faire un clic droit pour « Copier l'adresse de l'image », « Ouvrir dans un nouvel onglet » ou « Enregistrer l'image sous… ».
                  </p>
                </div>

                <div className="card-bottom-footer">
                  <label className="admin-switch-label">
                    <div
                      className={`admin-switch-track ${securityForm.disableRightClick ? 'on' : ''}`}
                      onClick={() => setSecurityForm((prev) => ({ ...prev, disableRightClick: !prev.disableRightClick }))}
                    >
                      <div className="admin-switch-thumb" />
                    </div>
                    <span className="switch-text-label">
                      {securityForm.disableRightClick ? 'Protection Clic Droit Active' : 'Clic Droit Désactivé (Autorisé)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Card 2: Inspect Element & DevTools Disable */}
              <div className={`security-feature-card ${securityForm.disableInspect ? 'active' : 'inactive'}`}>
                <div className="card-top-header">
                  <div className="feature-icon-wrapper terminal-icon">
                    <Terminal size={22} />
                  </div>
                  <div className="card-badge-status">
                    {securityForm.disableInspect ? (
                      <span className="badge-chip chip-active"><Check size={12} /> Inspecteur Bloqué</span>
                    ) : (
                      <span className="badge-chip chip-inactive"><X size={12} /> Accessible</span>
                    )}
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Verrouillage de l'Inspecteur (F12 & Raccourcis)</h3>
                  <p className="feature-card-desc">
                    Neutralise automatiquement la touche <strong>F12</strong>, les raccourcis <strong>Ctrl+Shift+I</strong>, <strong>Ctrl+Shift+J</strong> (Console), <strong>Ctrl+Shift+C</strong> (Inspecter l'élément), ainsi que <strong>Ctrl+U</strong> (Code source) et <strong>Ctrl+S</strong>.
                  </p>
                </div>

                <div className="card-bottom-footer">
                  <label className="admin-switch-label">
                    <div
                      className={`admin-switch-track ${securityForm.disableInspect ? 'on' : ''}`}
                      onClick={() => setSecurityForm((prev) => ({ ...prev, disableInspect: !prev.disableInspect }))}
                    >
                      <div className="admin-switch-thumb" />
                    </div>
                    <span className="switch-text-label">
                      {securityForm.disableInspect ? 'Inspecteur & DevTools Verrouillés' : 'Inspecteur Accessible'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Card 3: Disable Image Dragging */}
              <div className={`security-feature-card ${securityForm.disableImageDragging ? 'active' : 'inactive'}`}>
                <div className="card-top-header">
                  <div className="feature-icon-wrapper image-icon">
                    <ImageIcon size={22} />
                  </div>
                  <div className="card-badge-status">
                    {securityForm.disableImageDragging ? (
                      <span className="badge-chip chip-active"><Check size={12} /> Glisser Bloqué</span>
                    ) : (
                      <span className="badge-chip chip-inactive"><X size={12} /> Autorisé</span>
                    )}
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Protection Anti Glisser-Déposer des Images</h3>
                  <p className="feature-card-desc">
                    Empêche les visiteurs de faire glisser une affiche ou un logo avec la souris vers leur bureau ou vers la barre d'onglets pour obtenir le fichier original de l'image.
                  </p>
                </div>

                <div className="card-bottom-footer">
                  <label className="admin-switch-label">
                    <div
                      className={`admin-switch-track ${securityForm.disableImageDragging ? 'on' : ''}`}
                      onClick={() => setSecurityForm((prev) => ({ ...prev, disableImageDragging: !prev.disableImageDragging }))}
                    >
                      <div className="admin-switch-thumb" />
                    </div>
                    <span className="switch-text-label">
                      {securityForm.disableImageDragging ? 'Glisser-Déposer Bloqué' : 'Glisser-Déposer Autorisé'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Card 4: Protect Inside Admin */}
              <div className={`security-feature-card ${securityForm.protectInAdmin ? 'active' : 'inactive'}`}>
                <div className="card-top-header">
                  <div className="feature-icon-wrapper lock-icon">
                    <Lock size={22} />
                  </div>
                  <div className="card-badge-status">
                    {securityForm.protectInAdmin ? (
                      <span className="badge-chip chip-active">Bloqué dans Admin</span>
                    ) : (
                      <span className="badge-chip chip-neutral">Mode Développeur</span>
                    )}
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Protection à l'Intérieur du Dashboard (/admin)</h3>
                  <p className="feature-card-desc">
                    Par défaut désactivé pour vous permettre d'inspecter, tester et déboguer librement dans votre panneau d'administration sans blocage.
                  </p>
                </div>

                <div className="card-bottom-footer">
                  <label className="admin-switch-label">
                    <div
                      className={`admin-switch-track ${securityForm.protectInAdmin ? 'on' : ''}`}
                      onClick={() => setSecurityForm((prev) => ({ ...prev, protectInAdmin: !prev.protectInAdmin }))}
                    >
                      <div className="admin-switch-thumb" />
                    </div>
                    <span className="switch-text-label">
                      {securityForm.protectInAdmin ? 'Actif dans Admin' : 'Inactif dans Admin (Recommandé)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Card 5: WhatsApp Direct Number */}
              <div className="security-feature-card security-config-card active">
                <div className="card-top-header">
                  <div className="feature-icon-wrapper whatsapp-icon">
                    <MessageCircle size={22} />
                  </div>
                  <div className="card-badge-status">
                    <span className="badge-chip chip-whatsapp"><Check size={12} /> WhatsApp Officiel</span>
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Numéro WhatsApp de Contact & Commandes</h3>
                  <p className="feature-card-desc">
                    Numéro officiel utilisé sur tout le site (page Contact, page Offres, boutons de commande directe et pied de page). Les clients seront automatiquement redirigés vers ce numéro.
                  </p>

                  <div className="security-input-field-wrap">
                    <label className="security-field-label">Numéro de téléphone WhatsApp :</label>
                    <div className="security-input-container">
                      <span className="security-input-addon">🇹🇳 +216</span>
                      <input
                        type="text"
                        className="security-custom-input"
                        placeholder="ex: 96 086 581"
                        value={securityForm.whatsappNumber}
                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                      />
                    </div>
                    <span className="security-input-preview-text">
                      Lien direct généré : <code>https://wa.me/216{String(securityForm.whatsappNumber || '96086581').replace(/\D/g, '').replace(/^216/, '')}</code>
                    </span>
                  </div>
                </div>

                <div className="card-bottom-footer config-footer">
                  <span className="config-hint-badge">
                    <Phone size={13} />
                    <span>Modifiable à tout moment et synchronisé sur la vitrine</span>
                  </span>
                </div>
              </div>

              {/* Card 6: ImgBB Cloud Storage API Key */}
              <div className="security-feature-card security-config-card active">
                <div className="card-top-header">
                  <div className="feature-icon-wrapper key-icon">
                    <Key size={22} />
                  </div>
                  <div className="card-badge-status">
                    <span className="badge-chip chip-active"><Check size={12} /> Clé Active</span>
                  </div>
                </div>

                <div className="card-main-content">
                  <h3 className="feature-card-title">Clé API ImgBB (Stockage Cloud des Images)</h3>
                  <p className="feature-card-desc">
                    Clé d'API utilisée pour téléverser et stocker automatiquement toutes les images, affiches et logos sur le CDN rapide et gratuit ImgBB.
                  </p>

                  <div className="security-input-field-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <label className="security-field-label">Clé API (VITE_IMGBB_API_KEY) :</label>
                      <a
                        href="https://api.imgbb.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="security-get-key-link"
                      >
                        Obtenir une clé gratuite ↗
                      </a>
                    </div>
                    <div className="security-input-container">
                      <input
                        type={showImgbbKey ? "text" : "password"}
                        className="security-custom-input key-font"
                        placeholder="Entrez votre clé API ImgBB..."
                        value={securityForm.imgbbApiKey}
                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, imgbbApiKey: e.target.value }))}
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        className="security-addon-btn"
                        onClick={() => setShowImgbbKey(!showImgbbKey)}
                        title={showImgbbKey ? "Masquer la clé" : "Afficher la clé"}
                      >
                        {showImgbbKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="security-input-preview-text">
                      La clé est active immédiatement pour les ajouts de produits et d'offres sans redémarrage.
                    </span>
                  </div>
                </div>

                <div className="card-bottom-footer config-footer">
                  <span className="config-hint-badge">
                    <Key size={13} />
                    <span>Sauvegarde cloud sans limite de bande passante</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Save Strip */}
            <div className="security-save-strip">
              <div className="save-strip-info">
                <Sparkles size={17} className="save-strip-sparkle" />
                <span>Les modifications s'appliquent immédiatement dès l'enregistrement et sont synchronisées en base de données.</span>
              </div>
              <div className="save-strip-actions">
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={onNavigateStore}
                >
                  <Eye size={16} />
                  <span>Tester sur la boutique</span>
                </button>
                <button
                  type="button"
                  className="admin-btn primary security-big-save-btn"
                  onClick={handleSaveSecuritySettings}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 size={17} className="btn-spinner-icon" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      <span>Enregistrer les Paramètres de Sécurité</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            PRODUCTS CATALOGUE VIEW
            ================================================================ */}
        {activeTab === 'products' && (
          <>
            {/* Overview & Search Controls */}
            <div className="admin-control-strip">
              <div className="search-box-wrapper">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Rechercher un produit par nom ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="admin-strip-stats">
                <span className="stats-pill">
                  Total des produits : <strong>{products.length}</strong>
                </span>
                <button
                  type="button"
                  className="reset-defaults-btn"
                  onClick={handleOpenResetModal}
                  title="Réinitialiser les produits par défaut"
                >
                  <RefreshCw size={14} />
                  <span>Réinitialiser par défaut</span>
                </button>
              </div>
            </div>

            {/* Products Grid in Admin */}
            <div className="admin-products-table-card">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produit & Photo</th>
                      <th>Description & Badge</th>
                      <th>Prix Actuel</th>
                      <th>Prix d'Origine</th>
                      <th>Options de Durée</th>
                      <th>Bot Source (Privé 🔒)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-table-row">
                          <AlertCircle size={36} color="#94a3b8" />
                          <p>Aucun produit ne correspond à votre recherche</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const chosenIdx = typeof product.selectedImageIndex === 'number' ? product.selectedImageIndex : 0;
                        const primaryImg = getImageUrl(product.images?.[chosenIdx] || product.images?.[0] || '/images/logo.png');
                        const productId = product._id || product.id;
                        return (
                          <tr key={productId}>
                            <td>
                              <div className="product-identity-cell">
                                <img
                                  src={primaryImg}
                                  alt={product.name}
                                  className="table-product-thumb"
                                />
                                <div>
                                  <strong className="table-product-name">{product.name}</strong>
                                  <div className="table-image-mode-tags">
                                    <span className="table-images-count">
                                      {product.images?.length || 1} photo(s)
                                    </span>
                                    {product.displayMode === 'single' ? (
                                      <span className="table-mode-badge single" title="Photo unique fixe affichée sur le card">
                                        Photo unique
                                      </span>
                                    ) : (
                                      <span className="table-mode-badge carousel" title="Carrousel multi-photos avec défilement">
                                        Carrousel
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p className="table-product-desc-truncate">{product.description}</p>
                              {product.badge && (
                                <span className="table-badge-chip">{product.badge}</span>
                              )}
                            </td>
                            <td>
                              <span className="price-tag-green">{product.price} DT</span>
                            </td>
                            <td>
                              <span className="price-tag-muted">
                                {product.originalPrice ? `${product.originalPrice} DT` : '—'}
                              </span>
                            </td>
                            <td>
                              <div className="plans-summary-badges">
                                {product.plans && product.plans.length > 0 ? (
                                  product.plans.map((plan, i) => (
                                    <span key={i} className="plan-tiny-chip">
                                      <span>{plan.duration}</span>
                                      <span className="chip-sep">&bull;</span>
                                      <strong>{plan.price} DT</strong>
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Standard</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {product.sourceBot ? (
                                <span
                                  className="admin-secret-bot-badge"
                                  title={`Bot / Fournisseur (Privé) : ${product.sourceBot}`}
                                >
                                  <Bot size={13} className="bot-icon-glow" />
                                  <span className="bot-text-truncate">{product.sourceBot}</span>
                                </span>
                              ) : (
                                <span className="bot-not-set">—</span>
                              )}
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  type="button"
                                  className="action-icon-btn edit"
                                  onClick={() => handleOpenEditModal(product)}
                                  title="Modifier le produit"
                                >
                                  <Edit3 size={17} />
                                  <span>Modifier</span>
                                </button>

                                <button
                                  type="button"
                                  className="action-icon-btn delete"
                                  onClick={() => handleOpenDeleteModal(productId, product.name)}
                                  title="Supprimer le produit"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Product Edit / Create Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="admin-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Loading Overlay During Save */}
            {isSaving && (
              <div className="modal-saving-overlay">
                <div className="saving-spinner-box">
                  <div className="saving-spinner-ring">
                    <Loader2 className="saving-spin-icon" size={38} />
                  </div>
                  <h4 className="saving-title">Enregistrement en cours...</h4>
                  <p className="saving-subtitle">
                    Sauvegarde et synchronisation sécurisée avec MongoDB Atlas
                  </p>
                  <div className="saving-progress-bar">
                    <div className="saving-progress-indicator"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h2>
                <p>Modifiez le titre, la description, les tarifs, les durées et les photos du produit.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form-body">
              {/* Product Title */}
              <div className="form-row-group">
                <label className="form-label">
                  Titre du produit / Nom <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ex : ChatGPT Plus — Abonnement Officiel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Product Description */}
              <div className="form-row-group">
                <label className="form-label">
                  Description détaillée du produit <span className="req">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  required
                  placeholder="Expliquez en détail les avantages, fonctionnalités clés et garanties de ce produit..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Prices: Before & After Discount */}
              <div className="form-two-cols">
                <div className="form-row-group">
                  <label className="form-label">
                    Prix actuel (après remise) DT <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    required
                    placeholder="20"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-row-group">
                  <label className="form-label">
                    Prix d'origine (barré) DT
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="28"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Promotional Badge */}
              <div className="form-row-group">
                <label className="form-label">Badge promotionnel</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex : Bestseller 🔥, Activation Immédiate ⚡"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                />
              </div>

              {/* Private Admin Section: Source Bot */}
              <div className="form-section-box admin-confidential-box">
                <div className="box-title-row">
                  <div className="confidential-header-wrap">
                    <div className="confidential-title-icon">
                      <Bot size={18} />
                      <Lock size={13} className="lock-icon-mini" />
                    </div>
                    <div>
                      <h4 className="box-heading confidential-heading">
                        Nom du Bot / Fournisseur de l'abonnement (Privé Admin 🔒)
                      </h4>
                      <p className="box-sub">
                        Cette information est strictement confidentielle. <strong>Aucun client ne la verra</strong> sur la boutique.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-row-group">
                  <label className="form-label">
                    Nom ou identifiant du Bot :
                  </label>
                  <input
                    type="text"
                    className="form-input confidential-input"
                    placeholder="Ex : @ChatGPT_Reseller_Bot, @MidjourneyKeyBot, etc."
                    value={formData.sourceBot || ''}
                    onChange={(e) => setFormData({ ...formData, sourceBot: e.target.value })}
                  />
                  <span className="form-helper-text">
                    Note interne : gardez ici le contact Telegram, Discord ou nom du bot fournisseur pour faciliter vos réapprovisionnements.
                  </span>
                </div>
              </div>

              {/* Dynamic Subscription Duration Plans */}
              <div className="form-section-box">
                <div className="box-title-row">
                  <div>
                    <h4 className="box-heading">Options de durée d'abonnement et tarifs</h4>
                    <p className="box-sub">
                      Ajoutez plusieurs durées avec leurs tarifs respectifs (ex : 1 Mois = 20 DT, 1 An = 180 DT).
                    </p>
                  </div>
                </div>

                {/* Existing plans list */}
                {formData.plans && formData.plans.length > 0 ? (
                  <div className="plans-list-container">
                    {formData.plans.map((p, idx) => (
                      <div key={p.id || idx} className="plan-editor-item">
                        <div className="plan-item-info">
                          <span className="plan-dur-name">{p.duration}</span>
                          <span className="plan-dur-price">{p.price} DT</span>
                        </div>
                        <button
                          type="button"
                          className="plan-remove-btn"
                          onClick={() => handleRemovePlan(p.id)}
                          title="Supprimer cette option"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-items-text">Aucune durée d'abonnement configurée. Tarif unique par défaut.</p>
                )}

                {/* Add new duration row */}
                <div className="add-plan-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex : 6 Mois, 1 An, À Vie..."
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    className="form-input price-small"
                    placeholder="Prix DT"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                  />
                  <button
                    type="button"
                    className="add-plan-btn"
                    onClick={handleAddPlan}
                  >
                    <Plus size={16} />
                    <span>Ajouter option</span>
                  </button>
                </div>
              </div>

              {/* Multiple Images Upload & Card Display Mode */}
              <div className="form-section-box">
                <div className="box-title-row">
                  <div>
                    <h4 className="box-heading">Photos du produit & Mode d'affichage sur le Card</h4>
                    <p className="box-sub">
                      Choisissez si vous souhaitez afficher une seule photo fixe ou un carrousel défilant avec navigation sur le card de la boutique.
                    </p>
                  </div>
                </div>

                {/* Display Mode Switcher (Carousel vs Single Image) */}
                <div className="display-mode-selector-grid">
                  <div
                    className={`display-mode-card ${formData.displayMode === 'carousel' ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, displayMode: 'carousel' }))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mode-card-radio">
                      <div className={`radio-dot ${formData.displayMode === 'carousel' ? 'checked' : ''}`} />
                    </div>
                    <div className="mode-card-content">
                      <div className="mode-card-title-row">
                        <Layers size={17} className="mode-icon" />
                        <span className="mode-title">Carrousel Multi-photos</span>
                        <span className="mode-badge-pill">Avec flèches & points</span>
                      </div>
                      <p className="mode-desc">
                        Permet aux clients de faire défiler toutes les photos du produit directement sur la carte de la boutique.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`display-mode-card ${formData.displayMode === 'single' ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, displayMode: 'single' }))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mode-card-radio">
                      <div className={`radio-dot ${formData.displayMode === 'single' ? 'checked' : ''}`} />
                    </div>
                    <div className="mode-card-content">
                      <div className="mode-card-title-row">
                        <ImageIcon size={17} className="mode-icon" />
                        <span className="mode-title">Une seule photo fixe</span>
                        <span className="mode-badge-pill single">Sans carrousel</span>
                      </div>
                      <p className="mode-desc">
                        Affiche uniquement la photo de votre choix sur le card, sans aucune flèche ni défilement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informational Alert Banner */}
                {formData.displayMode === 'single' ? (
                  <div className="mode-alert-banner single-mode">
                    <div className="alert-banner-icon">
                      <Check size={18} />
                    </div>
                    <div className="alert-banner-text">
                      <strong>Mode Photo Unique actif :</strong>
                      <span>
                        {formData.images.length > 1
                          ? ` Cliquez sur la photo désirée ci-dessous pour l'afficher sur le card (Photo #${(formData.selectedImageIndex || 0) + 1} actuellement sélectionnée).`
                          : ` La photo ci-dessous sera affichée de manière fixe sur la vitrine.`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mode-alert-banner carousel-mode">
                    <div className="alert-banner-icon">
                      <Layers size={18} />
                    </div>
                    <div className="alert-banner-text">
                      <strong>Mode Carrousel actif :</strong>
                      <span>
                        {formData.images.length > 1
                          ? ` Les ${formData.images.length} photos défileront sur le card avec les flèches. La photo marquée "Photo de couverture" sera la première visible.`
                          : ` Ajoutez d'autres photos ci-dessous pour activer le défilement carrousel.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* File Upload Input */}
                <div className="file-dropzone">
                  <input
                    type="file"
                    id="product-images-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="file-hidden-input"
                  />
                  <label htmlFor="product-images-upload" className="file-dropzone-label">
                    <Upload size={28} className="upload-icon-pulse" />
                    <span className="drop-title">Cliquez pour choisir des photos depuis votre ordinateur</span>
                    <span className="drop-hint">Formats acceptés : PNG, JPG, JPEG, WEBP, SVG</span>
                  </label>
                </div>

                {/* Interactive Image Previews Gallery */}
                {formData.images.length > 0 && (
                  <div className="admin-images-gallery-section">
                    <div className="gallery-header-info">
                      <span className="gallery-count-label">
                        {formData.images.length} photo{formData.images.length > 1 ? 's' : ''} enregistrée{formData.images.length > 1 ? 's' : ''} :
                      </span>
                      <span className="gallery-instruction-hint">
                        {formData.displayMode === 'single'
                          ? '👉 Cliquez sur une photo pour l\'afficher sur le card'
                          : '👉 Cliquez pour définir la photo de couverture initiale'}
                      </span>
                    </div>

                    <div className="product-images-admin-grid">
                      {formData.images.map((imgSrc, idx) => {
                        const isCardSelected = (formData.selectedImageIndex || 0) === idx;
                        return (
                          <div
                            key={idx}
                            className={`admin-image-card ${isCardSelected ? 'card-selected' : ''}`}
                            onClick={() => handleSelectCardImage(idx)}
                            role="button"
                            tabIndex={0}
                            title={`Photo #${idx + 1} - Cliquez pour sélectionner`}
                          >
                            {/* Image Thumbnail */}
                            <div className="admin-img-wrap">
                              <img src={getImageUrl(imgSrc)} alt={`Photo ${idx + 1}`} className="admin-card-img" />
                            </div>

                            {/* Top Actions: Reorder and Delete */}
                            <div className="admin-img-top-bar" onClick={(e) => e.stopPropagation()}>
                              <div className="reorder-btns-group">
                                <button
                                  type="button"
                                  className="img-action-mini-btn"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, -1)}
                                  title="Déplacer vers la gauche"
                                >
                                  <ChevronLeft size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="img-action-mini-btn"
                                  disabled={idx === formData.images.length - 1}
                                  onClick={() => handleMoveImage(idx, 1)}
                                  title="Déplacer vers la droite"
                                >
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="img-action-mini-btn delete"
                                onClick={() => handleRemoveImage(idx)}
                                title="Supprimer cette photo"
                              >
                                <X size={13} />
                              </button>
                            </div>

                            {/* Transparent BG Button */}
                            <div className="admin-img-mid-bar" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="img-transparent-btn"
                                onClick={() => handleMakeImageTransparent(idx)}
                                title="Supprimer le fond noir pour rendre la photo transparente"
                              >
                                <Sparkles size={11} />
                                <span>Fond transparent</span>
                              </button>
                            </div>

                            {/* Selection Status Badge / Button */}
                            <div className="admin-img-footer-badge">
                              {isCardSelected ? (
                                <span className="badge-selected-status">
                                  <Check size={12} />
                                  <span>
                                    {formData.displayMode === 'single' ? 'Affichée sur le card' : 'Photo de couverture'}
                                  </span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="badge-select-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectCardImage(idx);
                                  }}
                                >
                                  {formData.displayMode === 'single' ? 'Choisir pour le card' : 'Définir comme couverture'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`admin-btn primary ${isSaving ? 'btn-loading' : ''}`}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="spin-inline" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Professional Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          className="admin-modal-backdrop confirm-modal-backdrop"
          onClick={() => !confirmModal.isProcessing && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon-wrapper ${confirmModal.confirmType}`}>
              {confirmModal.confirmType === 'danger' ? (
                <Trash2 size={30} className="confirm-icon-pulse" />
              ) : (
                <AlertTriangle size={30} className="confirm-icon-pulse" />
              )}
            </div>

            <h3 className="confirm-modal-title">{confirmModal.title}</h3>

            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{confirmModal.message}</p>

              {confirmModal.productName && (
                <div className="confirm-highlight-chip">
                  <span>{confirmModal.productName}</span>
                </div>
              )}

              <p className="confirm-modal-notice">
                {confirmModal.confirmType === 'danger'
                  ? '⚠️ Cette action est irréversible et supprimera définitivement cet élément de votre base MongoDB Atlas.'
                  : '⚠️ Tous les ajouts et modifications personnalisés seront remplacés par les produits initiaux.'}
              </p>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={confirmModal.isProcessing}
              >
                Annuler
              </button>

              <button
                type="button"
                className={`admin-btn ${confirmModal.confirmType === 'danger' ? 'danger-btn' : 'warning-btn'} ${confirmModal.isProcessing ? 'btn-loading' : ''
                  }`}
                onClick={confirmModal.onConfirm}
                disabled={confirmModal.isProcessing}
              >
                {confirmModal.isProcessing ? (
                  <>
                    <Loader2 size={17} className="spin-inline" />
                    <span>Suppression en cours...</span>
                  </>
                ) : (
                  <>
                    {confirmModal.confirmType === 'danger' ? <Trash2 size={17} /> : <RefreshCw size={17} />}
                    <span>{confirmModal.confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Slide Add / Edit Modal */}
      {isHeroModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsHeroModalOpen(false)}>
          <div className="admin-modal-window hero-config-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header admin-modal-header">
              <div className="modal-title-wrap has-icon">
                <div className="modal-title-icon-badge">
                  <Sparkles size={22} />
                </div>
                <div className="modal-title-texts">
                  <h2 className="modal-title">
                    {editingHeroSlideIndex !== null
                      ? 'Modifier la slide du carrousel d’accueil'
                      : 'Mettre en avant un produit dans le carrousel d’accueil'}
                  </h2>
                  <p className="modal-subtitle">
                    Sélectionnez le produit, choisissez sa photo dédiée et personnalisez sa couleur d'ambiance 3D.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsHeroModalOpen(false)}
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-form-body admin-modal-body hero-modal-body">
              {/* 1. Product Selector */}
              <div className="form-group">
                <label className="form-label">
                  <Package size={15} />
                  <span>Sélectionnez le produit du catalogue * :</span>
                </label>
                <select
                  className="form-input hero-product-dropdown"
                  value={heroForm.productId}
                  onChange={(e) => handleHeroProductSelect(e.target.value)}
                >
                  <option value="">-- Choisissez un produit parmi le catalogue ({products.length}) --</option>
                  {products.map((p) => {
                    const pId = p._id || p.id;
                    return (
                      <option key={pId} value={pId}>
                        {p.name} — {p.price} DT {p.originalPrice ? `(au lieu de ${p.originalPrice} DT)` : ''}
                      </option>
                    );
                  })}
                </select>
                <span className="form-helper-text">
                  Le titre, la description, et les prix sont automatiquement extraits du produit sélectionné.
                </span>
              </div>

              {/* 2. Auto-loaded Details Preview Bar */}
              {heroForm.productId && (() => {
                const prod = products.find(
                  (p) =>
                    (p._id && (p._id === heroForm.productId || p._id === heroForm.id)) ||
                    (p.id && (p.id === heroForm.productId || p.id === heroForm.id)) ||
                    (p.name && heroForm.name && p.name.trim().toLowerCase() === heroForm.name.trim().toLowerCase())
                );
                const sName = prod ? prod.name : heroForm.name;
                const sPrice = prod?.price !== undefined ? prod.price : heroForm.price;
                const sOrigPrice = prod?.originalPrice !== undefined ? prod.originalPrice : heroForm.originalPrice;
                const sDesc = prod ? (prod.description || '') : heroForm.description;

                return (
                  <div className="hero-product-snapshot-box">
                    <div className="snapshot-title-row">
                      <strong className="snapshot-name">{sName}</strong>
                      <div className="snapshot-prices">
                        <span className="price-tag-green">{sPrice} DT</span>
                        {sOrigPrice && (
                          <span className="price-tag-muted">{sOrigPrice} DT</span>
                        )}
                      </div>
                    </div>
                    <p className="snapshot-desc">{sDesc || 'Aucune description disponible.'}</p>
                  </div>
                );
              })()}

              {/* 3. Configuration Avancée des Deux Images (Vitrine Principale & Miniature Carrousel) */}
              {heroForm.productId && (() => {
                const selProduct = products.find((p) => (p._id || p.id) === heroForm.productId);
                const pImages = selProduct?.images && selProduct.images.length > 0
                  ? selProduct.images
                  : [heroForm.image || '/images/logo.png'];

                const currentShowcaseImg = heroForm.image || pImages[0] || '/images/logo.png';
                const currentThumbImg = heroForm.thumbnailImage || heroForm.image || (pImages.length > 1 ? pImages[1] : pImages[0]) || '/images/logo.png';

                return (
                  <div className="hero-dual-image-section">
                    <div className="hero-dual-section-header">
                      <div className="hero-dual-header-left">
                        <Layers size={18} className="dual-header-icon" />
                        <div>
                          <h4 className="dual-header-title">Configuration Indépendante des Images</h4>
                          <p className="dual-header-sub">
                            Vous pouvez modifier la photo de la vitrine principale tout en conservant une photo différente pour le carrousel latéral.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hero-dual-grid">
                      {/* ========================================================= */}
                      {/* COLONNE 1 : IMAGE PRINCIPALE (VITRINE 3D / CENTRE) */}
                      {/* ========================================================= */}
                      <div className="hero-dual-card vitrine-card">
                        <div className="hero-dual-card-header">
                          <div className="hero-dual-card-badge vitrine-badge">
                            <Sparkles size={13} />
                            <span>1. Image de la Vitrine (Centre)</span>
                          </div>
                          <span className="hero-dual-role-tag">Centre de l'accueil</span>
                        </div>
                        <p className="hero-dual-card-desc">
                          S'affiche en grand au centre de la page avec l'effet 3D interactif et le halo d'ambiance.
                        </p>

                        {/* Grand Aperçu Vitrine */}
                        <div
                          className="hero-preview-box showcase-box"
                          style={{
                            background: `radial-gradient(circle at center, ${heroForm.bgColor || '#ff5e00'}33 0%, rgba(15, 23, 42, 0.75) 80%)`,
                          }}
                        >
                          <img
                            key={`vitrine-prev-${currentShowcaseImg ? currentShowcaseImg.slice(-20) : ''}`}
                            src={getImageUrl(currentShowcaseImg)}
                            alt="Aperçu Vitrine Principale"
                            className="hero-dual-preview-img main-showcase-preview"
                          />
                        </div>

                        {/* Galerie de sélection depuis les photos du produit */}
                        <div className="hero-subgallery-title">
                          <span>Choisir parmi les photos du produit ({pImages.length}) :</span>
                        </div>
                        <div className="hero-subgallery-grid">
                          {pImages.map((imgUrl, imgIdx) => {
                            const isChosen = heroForm.image === imgUrl;
                            return (
                              <button
                                type="button"
                                key={`showcase-opt-${imgIdx}`}
                                className={`hero-subgallery-item ${isChosen ? 'active-showcase' : ''}`}
                                onClick={() =>
                                  setHeroForm((prev) => ({
                                    ...prev,
                                    image: imgUrl,
                                    selectedImageIndex: imgIdx,
                                  }))
                                }
                              >
                                <img src={getImageUrl(imgUrl)} alt="" />
                                {isChosen ? (
                                  <span className="subgallery-item-badge">
                                    <Check size={11} strokeWidth={3} />
                                    Vitrine
                                  </span>
                                ) : (
                                  <span className="subgallery-hover-label">Photo #{imgIdx + 1}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Upload & URL direct */}
                        <div className="hero-custom-img-row">
                          <label className="hero-upload-btn-mini" title="Téléverser une image depuis votre PC">
                            <Upload size={13} />
                            <span>Téléverser</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleHeroImageUpload(e, 'image')}
                            />
                          </label>
                          <input
                            type="text"
                            className="hero-mini-url-input"
                            placeholder="Ou lien URL de la vitrine..."
                            value={heroForm.image || ''}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, image: e.target.value }))}
                          />
                        </div>

                        {/* Magic Remove Black Background */}
                        <button
                          type="button"
                          className="hero-trans-magic-btn mini"
                          onClick={async () => {
                            if (!heroForm.image) return;
                            notify('Suppression du fond noir en cours... ⏳');
                            const trans = await removeBlackBgFromImage(heroForm.image);
                            setHeroForm((prev) => ({ ...prev, image: trans }));
                            notify('Fond transparent généré pour la vitrine ! ✨');
                          }}
                        >
                          <Sparkles size={13} color="#38bdf8" />
                          <span>Rendre le fond transparent</span>
                        </button>
                      </div>

                      {/* ========================================================= */}
                      {/* COLONNE 2 : MINIATURE « SÉLECTION DU CARROUSEL » */}
                      {/* ========================================================= */}
                      <div className="hero-dual-card thumbnail-card">
                        <div className="hero-dual-card-header">
                          <div className="hero-dual-card-badge carousel-badge">
                            <ImageIcon size={13} />
                            <span>2. Miniature Carrousel</span>
                          </div>
                          <span className="hero-dual-role-tag thumb-role">SÉLECTION DU CARROUSEL</span>
                        </div>
                        <p className="hero-dual-card-desc">
                          S'affiche dans la barre latérale droite (ex: cadre smartphone). Reste inchangée si vous changez la vitrine !
                        </p>

                        {/* Aperçu Réplique Fidèle du Carrousel */}
                        <div className="hero-thumb-live-preview-wrap">
                          <div
                            className="modern-carousel-card preview-card-replica active"
                            style={{
                              borderColor: `${heroForm.bgColor || '#ff5e00'}cc`,
                              boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 20px -2px ${heroForm.bgColor || '#ff5e00'}55`,
                            }}
                          >
                            <div className="preview-replica-thumb-wrap">
                              <img
                                key={`thumb-prev-${currentThumbImg ? currentThumbImg.slice(-20) : ''}`}
                                src={getImageUrl(currentThumbImg)}
                                alt="Miniature Carrousel"
                                className="modern-thumbnail-img"
                              />
                            </div>
                            <div className="modern-card-details">
                              <span className="modern-card-title">{getThumbnailLabel(heroForm.name || 'Produit')}</span>
                              <span
                                className="card-active-dot"
                                style={{ backgroundColor: heroForm.bgColor || '#ff5e00' }}
                              />
                            </div>
                          </div>
                          <span className="replica-preview-subtext">Rendu réel dans la barre latérale droite</span>
                        </div>

                        {/* Galerie de sélection pour la miniature */}
                        <div className="hero-subgallery-title">
                          <span>Choisir la photo pour la miniature :</span>
                        </div>
                        <div className="hero-subgallery-grid">
                          {pImages.map((imgUrl, imgIdx) => {
                            const isChosen = currentThumbImg === imgUrl;
                            return (
                              <button
                                type="button"
                                key={`thumb-opt-${imgIdx}`}
                                className={`hero-subgallery-item ${isChosen ? 'active-thumb' : ''}`}
                                onClick={() =>
                                  setHeroForm((prev) => ({
                                    ...prev,
                                    thumbnailImage: imgUrl,
                                  }))
                                }
                              >
                                <img src={getImageUrl(imgUrl)} alt="" />
                                {isChosen ? (
                                  <span className="subgallery-item-badge thumb-badge">
                                    <Check size={11} strokeWidth={3} />
                                    Carrousel
                                  </span>
                                ) : (
                                  <span className="subgallery-hover-label">Photo #{imgIdx + 1}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Upload & URL direct miniature */}
                        <div className="hero-custom-img-row">
                          <label className="hero-upload-btn-mini" title="Téléverser une miniature personnalisée">
                            <Upload size={13} />
                            <span>Téléverser</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleHeroImageUpload(e, 'thumbnailImage')}
                            />
                          </label>
                          <input
                            type="text"
                            className="hero-mini-url-input"
                            placeholder="Ou lien URL de la miniature..."
                            value={heroForm.thumbnailImage || ''}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, thumbnailImage: e.target.value }))}
                          />
                        </div>

                        {/* Bouton de synchronisation rapide */}
                        <button
                          type="button"
                          className="hero-sync-btn"
                          onClick={() => {
                            setHeroForm((prev) => ({ ...prev, thumbnailImage: prev.image }));
                            notify('Miniature synchronisée avec la photo de la vitrine ! 🔄');
                          }}
                        >
                          <RefreshCw size={13} />
                          <span>Utiliser la même image que la vitrine</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Background Color Selection */}
              <div className="form-group">
                <label className="form-label">
                  <Palette size={15} />
                  <span>Couleur d'arrière-plan personnalisée pour ce produit (Ambiance 3D) :</span>
                </label>

                <div className="hero-color-controls-row">
                  <div
                    className="hero-color-preview-swatch"
                    style={{ background: heroForm.bgColor || '#e25816' }}
                    title="Aperçu de la couleur"
                  />
                  <input
                    type="color"
                    className="hero-native-color-picker"
                    value={heroForm.bgColor || '#e25816'}
                    onChange={(e) => setHeroForm((prev) => ({ ...prev, bgColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="form-input hero-hex-input"
                    placeholder="#e25816"
                    value={heroForm.bgColor || '#e25816'}
                    onChange={(e) => setHeroForm((prev) => ({ ...prev, bgColor: e.target.value }))}
                  />
                </div>

                {/* Preset Palettes */}
                <div className="hero-preset-palettes-wrapper">
                  <span className="presets-title">Palettes recommandées :</span>
                  <div className="hero-presets-row">
                    {[
                      { name: 'Orange Sunset', hex: '#e25816' },
                      { name: 'Noir Intense', hex: '#140b08' },
                      { name: 'Bleu Saphir', hex: '#0f2b5c' },
                      { name: 'Vert Émeraude', hex: '#064e3b' },
                      { name: 'Violet Impérial', hex: '#3b0764' },
                      { name: 'Rouge Rubis', hex: '#580808' },
                      { name: 'Cyber Cyan', hex: '#083344' },
                      { name: 'Cuivre Doré', hex: '#8c4314' },
                    ].map((preset) => {
                      const isCurr = (heroForm.bgColor || '').toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          className={`preset-color-pill ${isCurr ? 'active' : ''}`}
                          onClick={() => setHeroForm((prev) => ({ ...prev, bgColor: preset.hex }))}
                        >
                          <span className="preset-circle" style={{ background: preset.hex }} />
                          <span>{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. Live Interactive Preview of the Hero Slide */}
              <div className="form-group">
                <label className="form-label">
                  <Eye size={15} />
                  <span>Aperçu en temps réel du carrousel d'accueil :</span>
                </label>
                <div
                  className="hero-live-preview-box"
                  style={{
                    background: `radial-gradient(ellipse 90% 75% at 50% 34%, ${heroForm.bgColor || '#e25816'
                      } 0%, rgba(15, 23, 42, 0.75) 48%, rgba(10, 15, 30, 0.95) 75%, #060913 100%)`,
                  }}
                >
                  <div className="preview-left-info">
                    <span className="preview-badge-pill">Produit en vedette</span>
                    <h3 className="preview-name">{heroForm.name || 'Sélectionnez un produit'}</h3>
                    <p className="preview-desc">{heroForm.description || 'Description du produit...'}</p>
                    <div className="preview-prices-row">
                      <span className="preview-current-price">{heroForm.price || '—'} DT</span>
                      {heroForm.originalPrice && (
                        <span className="preview-original-price">{heroForm.originalPrice} DT</span>
                      )}
                    </div>
                  </div>
                  <div className="preview-center-image">
                    <img
                      key={`preview-center-${heroForm.selectedImageIndex}-${heroForm.image ? heroForm.image.slice(-20) : ''}`}
                      src={heroForm.image || '/images/logo.png'}
                      alt="Aperçu"
                      className="preview-floating-product-img"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setIsHeroModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="admin-btn primary"
                onClick={handleSaveHeroSlide}
              >
                <Check size={18} />
                <span>
                  {editingHeroSlideIndex !== null
                    ? 'Enregistrer les modifications'
                    : 'Ajouter au Carrousel'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Edit / Create Modal */}
      {isOfferModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !isSaving && setIsOfferModalOpen(false)}>
          <div className="admin-modal-window offer-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Loading Overlay During Save */}
            {isSaving && (
              <div className="modal-saving-overlay">
                <div className="saving-spinner-box">
                  <div className="saving-spinner-ring">
                    <Loader2 className="saving-spin-icon" size={38} />
                  </div>
                  <h4 className="saving-title">Enregistrement de l'offre...</h4>
                  <p className="saving-subtitle">
                    Synchronisation et sauvegarde dans la base de données
                  </p>
                </div>
              </div>
            )}

            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{editingOfferId ? "Modifier l'offre spéciale" : "Créer une Offre / Pack Spécial"}</h2>
                <p>Combinez des abonnements officiels à tarif préférentiel ou lancez une super promotion.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSaving && setIsOfferModalOpen(false)}
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="modal-form-body">
              {/* 1. Quick Catalog Combiner Box */}
              <div className="offer-combiner-box">
                <div className="combiner-header">
                  <div className="combiner-header-title">
                    <Sparkles size={17} className="combiner-sparkle-icon" />
                    <h4>⚡ Sélection rapide depuis le catalogue :</h4>
                    <span className="combiner-total-count">({products.length} abonnements disponibles)</span>
                  </div>
                </div>
                <p className="combiner-help-text">
                  Tous vos abonnements sont affichés ci-dessous (CapCut, Netflix, Claude, ChatGPT, Canva, Spotify, etc.). Cliquez sur un abonnement pour l'ajouter au pack :
                </p>

                {/* Search Bar for Subscriptions */}
                <div className="combiner-search-bar">
                  <Search size={15} className="combiner-search-icon" />
                  <input
                    type="text"
                    className="combiner-search-input"
                    placeholder="Rechercher un abonnement (ex: Capcut, Netflix, Canva, Claude, ChatGPT, Spotify...)"
                    value={offerCombinerSearch}
                    onChange={(e) => setOfferCombinerSearch(e.target.value)}
                  />
                  {offerCombinerSearch && (
                    <button
                      type="button"
                      className="combiner-search-clear"
                      onClick={() => setOfferCombinerSearch('')}
                      title="Effacer la recherche"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* All Subscriptions Wrapped & Immediately Visible */}
                <div className="combiner-chips-wrap">
                  {filteredCombinerProducts.length === 0 ? (
                    <div className="combiner-no-results">
                      <span>Aucun abonnement ne correspond à "{offerCombinerSearch}"</span>
                      <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => setOfferCombinerSearch('')}
                      >
                        Afficher tous les {products.length} abonnements
                      </button>
                    </div>
                  ) : (
                    filteredCombinerProducts.map((p) => {
                      const pId = String(p._id || p.id);
                      const isSelected = selectedOfferProductIds.includes(pId);
                      const pImg = p.images?.[0];
                      const effPlan = getProductEffectivePlan(p);
                      const displayPrice = effPlan?.price || p.price;
                      return (
                        <button
                          key={pId}
                          type="button"
                          className={`product-combiner-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleProductInOffer(p)}
                          title={`${p.name} - ${displayPrice} DT`}
                        >
                          {pImg && (
                            <img
                              src={getImageUrl(pImg)}
                              alt={p.name}
                              className="chip-product-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="chip-name">{p.name}</span>
                          {isSelected && effPlan?.duration && (
                            <span className="chip-plan-badge">{effPlan.duration}</span>
                          )}
                          <span className="chip-price">{displayPrice} DT</span>
                          {isSelected && <Check size={13} className="chip-check-icon" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Duration / Plan Selector for Products with Multiple Options */}
                {selectedProductsWithMultiplePlans.length > 0 && (
                  <div className="combiner-plan-selectors-box">
                    <div className="plan-selectors-header">
                      <Clock size={15} className="plan-selectors-icon" />
                      <span className="plan-selectors-title">
                        Choisir la durée de l'abonnement pour l'offre :
                      </span>
                      <span className="plan-selectors-hint">
                        (Le prix exact sans remise et le titre du pack s'adaptent automatiquement à la durée)
                      </span>
                    </div>
                    <div className="plan-selectors-list">
                      {selectedProductsWithMultiplePlans.map((prod) => {
                        const pId = String(prod._id || prod.id);
                        const activePlan = getProductEffectivePlan(prod);
                        const prodImg = prod.images?.[0];
                        return (
                          <div key={`plan-selector-${pId}`} className="product-plan-picker-row">
                            <div className="product-plan-picker-info">
                              {prodImg && (
                                <img
                                  src={getImageUrl(prodImg)}
                                  alt={prod.name}
                                  className="plan-picker-prod-thumb"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="plan-picker-prod-name">{prod.name}</span>
                              <span className="plan-picker-active-badge">
                                {activePlan?.duration || 'Standard'} ({activePlan?.price || prod.price} DT)
                              </span>
                            </div>
                            <div className="plan-pills-row">
                              {prod.plans.map((pl, idx) => {
                                const isPlanActive =
                                  (activePlan?.duration && activePlan.duration.trim().toLowerCase() === pl.duration?.trim().toLowerCase()) ||
                                  (activePlan?._id && pl._id && String(activePlan._id) === String(pl._id)) ||
                                  (Number(activePlan?.price) === Number(pl.price) && activePlan?.duration === pl.duration);
                                return (
                                  <button
                                    key={pl._id || idx}
                                    type="button"
                                    className={`plan-pill-option ${isPlanActive ? 'active' : ''}`}
                                    onClick={() => handleSelectProductPlan(prod, pl)}
                                    title={`Choisir ${prod.name} - ${pl.duration} (${pl.price} DT)`}
                                  >
                                    <span className="plan-pill-duration">{pl.duration}</span>
                                    <span className="plan-pill-price">{pl.price} DT</span>
                                    {isPlanActive && <Check size={12} className="plan-pill-check" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedOfferProductIds.length > 0 && (
                  <div className="combiner-selected-summary">
                    <Check size={14} />
                    <span>{selectedOfferProductIds.length} abonnement(s) sélectionné(s) pour composer ce pack.</span>
                    <button
                      type="button"
                      className="combiner-deselect-all-btn"
                      onClick={() => {
                        setSelectedOfferProductIds([]);
                        setSelectedProductPlans({});
                      }}
                    >
                      Désélectionner tout
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Title & Subtitle */}
              <div className="form-row-group">
                <label className="form-label">
                  Titre du Pack / Offre <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ex : Pack Duo : ChatGPT Plus + Midjourney Pro"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                />
              </div>

              <div className="form-row-group">
                <label className="form-label">
                  Sous-titre explicatif / Accroche
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex : Les deux meilleures IA du monde réunies dans un pack complet à prix réduit."
                  value={offerForm.subtitle}
                  onChange={(e) => setOfferForm({ ...offerForm, subtitle: e.target.value })}
                />
              </div>

              {/* 3. Type, Badge & Duration */}
              <div className="form-three-cols">
                <div className="form-row-group">
                  <label className="form-label">Type d'offre</label>
                  <select
                    className="form-select"
                    value={offerForm.type}
                    onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                  >
                    <option value="duo">🤝 Pack Duo (2 abonnements)</option>
                    <option value="promo">⚡ Super Promo individuelle</option>
                  </select>
                </div>

                <div className="form-row-group">
                  <label className="form-label">Badge accrocheur</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex : PACK DUO ÉCONOMIQUE"
                    value={offerForm.badge}
                    onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                  />
                </div>

                <div className="form-row-group">
                  <label className="form-label">Durée de l'offre</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex : 1 Mois, 3 Mois, 1 An..."
                    value={offerForm.duration}
                    onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                  />
                </div>
              </div>

              {/* 4. Pricing & Savings calculation */}
              <div className="form-two-cols">
                <div className="form-row-group">
                  <div className="form-label-with-action">
                    <label className="form-label">
                      Prix promo final (DT) <span className="req">*</span>
                    </label>
                    {selectedProductsSum > 0 && (
                      <button
                        type="button"
                        className="calc-sum-inline-btn"
                        onClick={() => setOfferForm((prev) => ({ ...prev, price: selectedProductsSum }))}
                        title="Appliquer la somme exacte des abonnements sans remise"
                      >
                        <Calculator size={13} />
                        <span>Somme sans remise : {selectedProductsSum} DT</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className="form-input price-input-highlight"
                    required
                    min="1"
                    placeholder={selectedProductsSum ? `Ex : ${selectedProductsSum}` : "Ex : 69"}
                    value={offerForm.price}
                    onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                  />
                  {selectedProductsSum > 0 && (
                    <div className="price-sub-helpers">
                      <button
                        type="button"
                        className={`price-pill-btn ${Number(offerForm.price) === selectedProductsSum ? 'active' : ''}`}
                        onClick={() => setOfferForm((prev) => ({ ...prev, price: selectedProductsSum }))}
                        title="Fixer le prix promo sur la somme exacte des abonnements"
                      >
                        <Check size={12} className="pill-check-icon" />
                        <span>Somme abonnements : <strong>{selectedProductsSum} DT</strong></span>
                      </button>
                      {selectedProductsOrigSum > selectedProductsSum && (
                        <button
                          type="button"
                          className={`price-pill-btn ${Number(offerForm.price) === selectedProductsOrigSum ? 'active' : ''}`}
                          onClick={() => setOfferForm((prev) => ({ ...prev, price: selectedProductsOrigSum }))}
                          title="Fixer sur le total des prix d'origine sans remise"
                        >
                          <span>Prix d'origine : <strong>{selectedProductsOrigSum} DT</strong></span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row-group">
                  <div className="form-label-with-action">
                    <label className="form-label">
                      Prix d'origine sans remise (DT)
                    </label>
                    {selectedProductsOrigSum > 0 && Number(offerForm.originalPrice) !== selectedProductsOrigSum && (
                      <button
                        type="button"
                        className="calc-sum-inline-btn"
                        onClick={() => setOfferForm((prev) => ({ ...prev, originalPrice: selectedProductsOrigSum }))}
                        title="Rétablir le prix d'origine calculé"
                      >
                        <Calculator size={13} />
                        <span>Origine : {selectedProductsOrigSum} DT</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    placeholder="Ex : 90"
                    value={offerForm.originalPrice}
                    onChange={(e) => setOfferForm({ ...offerForm, originalPrice: e.target.value })}
                  />
                  {selectedProductsOrigSum > 0 && (
                    <div className="price-sub-helpers">
                      <span className="price-sub-info">
                        Somme d'origine ({currentOfferProducts.length} abt.) : <strong>{selectedProductsOrigSum} DT</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Savings Display */}
              {offerForm.price && offerForm.originalPrice && Number(offerForm.originalPrice) > Number(offerForm.price) && (
                <div className="offer-dynamic-savings-banner">
                  <Tag size={16} />
                  <span>
                    Économie offerte au client : <strong>{Number(offerForm.originalPrice) - Number(offerForm.price)} DT</strong>
                    {' '}(soit une réduction immédiate de <strong>{Math.round(((Number(offerForm.originalPrice) - Number(offerForm.price)) / Number(offerForm.originalPrice)) * 100)}%</strong>)
                  </span>
                </div>
              )}

              {/* 5. Contenu inclus (Items) */}
              <div className="form-row-group">
                <label className="form-label">
                  Abonnements / Éléments inclus dans ce pack (1 par ligne)
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="ChatGPT Plus (Compte officiel garanti)&#10;Midjourney Pro (Génération illimitée)"
                  value={offerForm.itemsText}
                  onChange={(e) => setOfferForm({ ...offerForm, itemsText: e.target.value })}
                />
                <span className="form-help-tip">
                  Ces éléments s'afficheront séparés par un signe "+" stylisé sur la fiche de l'offre.
                </span>
              </div>

              {/* 6. Caractéristiques & Avantages */}
              <div className="form-row-group">
                <label className="form-label">
                  Avantages et garanties (1 par ligne)
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Accès privé et individuel 100% garanti&#10;Livraison express sur votre email&#10;Assistance technique 7j/7"
                  value={offerForm.featuresText}
                  onChange={(e) => setOfferForm({ ...offerForm, featuresText: e.target.value })}
                />
              </div>

              {/* 7. Image Management Section (Per-Item Images & Cover Image) */}
              <div className="offer-images-mgmt-section">
                <div className="images-mgmt-header">
                  <ImageIcon size={18} className="images-mgmt-icon" />
                  <div>
                    <h4>📸 Personnalisation des photos & logos des abonnements :</h4>
                    <p>
                      Modifiez l'image individuelle de chaque abonnement du pack. Elles s'afficheront en éventail dynamique sur le site.
                    </p>
                  </div>
                </div>

                {/* Grid of Item Image Customizers */}
                {displayOfferItems.length > 0 && (
                  <div className="offer-items-images-grid">
                    {displayOfferItems.map((item, itemIdx) => {
                      const currentItemImg =
                        offerForm.itemImages?.[itemIdx] ||
                        resolveOfferItemImage(item, itemIdx, offerForm, products) ||
                        '/images/logo.png';
                      const cleanItemName = item.split(/[-—–(]/)[0].trim();

                      return (
                        <div key={itemIdx} className="offer-item-image-card">
                          <div className="item-card-header">
                            <span className="item-index-badge">Abonnement {itemIdx + 1}</span>
                            <span className="item-card-name" title={item}>{cleanItemName}</span>
                          </div>

                          <div className="item-image-preview-and-actions">
                            <div className="item-thumbnail-box">
                              <img
                                src={getImageUrl(currentItemImg)}
                                alt={cleanItemName}
                                className="item-preview-img"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/logo.png';
                                }}
                              />
                            </div>

                            <div className="item-image-inputs">
                              <div className="upload-and-url-row">
                                <input
                                  type="text"
                                  className="form-input form-input-sm"
                                  placeholder="Coller l'URL de l'image..."
                                  value={offerForm.itemImages?.[itemIdx] || ''}
                                  onChange={(e) => handleItemImageUrlChange(e.target.value, itemIdx)}
                                />
                                <label className="upload-btn-styled" title="Téléverser une image depuis votre appareil">
                                  <Upload size={14} />
                                  <span>Téléverser</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleItemImageUpload(e.target.files?.[0], itemIdx)}
                                  />
                                </label>
                              </div>

                              {/* Quick pick from catalog product images */}
                              {products.length > 0 && (
                                <div className="quick-logo-picker">
                                  <span className="quick-logo-label">Logos rapides :</span>
                                  <div className="quick-logo-chips">
                                    {products.slice(0, 8).map((prod) => {
                                      const prodImg = prod.images?.[0];
                                      if (!prodImg) return null;
                                      const isCurrent = currentItemImg === prodImg;
                                      return (
                                        <button
                                          key={prod._id || prod.id}
                                          type="button"
                                          className={`quick-logo-chip ${isCurrent ? 'active' : ''}`}
                                          onClick={() => handleItemImageUrlChange(prodImg, itemIdx)}
                                          title={`Utiliser le logo de ${prod.name}`}
                                        >
                                          <img src={getImageUrl(prodImg)} alt={prod.name} />
                                          <span>{prod.name.split(/[-—–(]/)[0].trim().slice(0, 10)}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Main Cover Image & Color Halo */}
                <div className="form-two-cols offer-cover-halo-row">
                  <div className="form-row-group">
                    <label className="form-label">
                      Image de couverture principale (Vignette globale)
                    </label>
                    <div className="offer-main-img-wrap">
                      <div className="main-thumb-box">
                        <img
                          src={getImageUrl(offerForm.image || '/images/logo.png')}
                          alt="Cover"
                          className="main-preview-img"
                          onError={(e) => {
                            e.currentTarget.src = '/images/logo.png';
                          }}
                        />
                      </div>
                      <div className="main-img-inputs">
                        <div className="offer-img-picker-row">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="URL de l'image de couverture"
                            value={offerForm.image}
                            onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
                          />
                          <label className="upload-inline-btn" title="Téléverser une image de couverture">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleOfferImageUpload}
                            />
                          </label>
                        </div>
                        {offerForm.itemImages && offerForm.itemImages.length > 0 && (
                          <div className="copy-item-img-actions">
                            <span className="copy-label">Remplacer par :</span>
                            {offerForm.itemImages.map((img, idx) => {
                              if (!img) return null;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  className="copy-img-btn"
                                  onClick={() => setOfferForm((prev) => ({ ...prev, image: img }))}
                                >
                                  Image Abonnement {idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row-group">
                    <label className="form-label">Couleur d'ambiance (Halo)</label>
                    <div className="offer-color-picker-row">
                      <input
                        type="color"
                        className="hero-native-color-picker"
                        value={offerForm.bgColor || '#ff5722'}
                        onChange={(e) => setOfferForm({ ...offerForm, bgColor: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={offerForm.bgColor || '#ff5722'}
                        onChange={(e) => setOfferForm({ ...offerForm, bgColor: e.target.value })}
                      />
                    </div>
                    {/* Preset color dots */}
                    <div className="offer-color-presets">
                      {['#ff5722', '#10a37f', '#00c4cc', '#6366f1', '#ec4899', '#f59e0b', '#3b82f6'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          className={`color-dot-btn ${(offerForm.bgColor || '').toLowerCase() === hex.toLowerCase() ? 'active' : ''}`}
                          style={{ background: hex }}
                          onClick={() => setOfferForm({ ...offerForm, bgColor: hex })}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mini Live Fanned Deck Preview inside Modal */}
                {displayOfferItems.length > 0 && (
                  <div className="offer-modal-live-preview">
                    <div className="modal-preview-title">
                      <Sparkles size={14} />
                      <span>Aperçu direct de l'affichage des cartes sur le site :</span>
                    </div>
                    <div
                      className="modal-fanned-preview-box"
                      style={{
                        background: `radial-gradient(ellipse 90% 75% at 50% 34%, ${offerForm.bgColor || '#ff5722'}25 0%, rgba(15, 23, 42, 0.8) 60%, #060913 100%)`,
                        borderColor: `${offerForm.bgColor || '#ff5722'}40`,
                      }}
                    >
                      <div className="offer-fanned-deck">
                        {displayOfferItems.map((item, itemIdx) => {
                          const itemImg =
                            offerForm.itemImages?.[itemIdx] ||
                            resolveOfferItemImage(item, itemIdx, offerForm, products) ||
                            '/images/logo.png';
                          const totalItems = displayOfferItems.length;
                          let fanPosClass = 'fan-single';
                          if (totalItems === 2) {
                            fanPosClass = itemIdx === 0 ? 'fan-left' : 'fan-right';
                          } else if (totalItems >= 3) {
                            fanPosClass = itemIdx === 0 ? 'fan-left' : itemIdx === 1 ? 'fan-center' : 'fan-right';
                          }
                          const cleanName = item.split(/[-—–(]/)[0].trim();

                          return (
                            <div key={itemIdx} className={`fanned-product-card ${fanPosClass}`} title={item}>
                              <div className="fanned-card-inner">
                                <img
                                  src={getImageUrl(itemImg)}
                                  alt={item}
                                  className="fanned-card-img"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/logo.png';
                                  }}
                                />
                                <div className="fanned-card-overlay-badge">
                                  <span className="badge-name">{cleanName}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {displayOfferItems.length === 2 && (
                          <div className="fanned-plus-connector" title="Pack Combiné">
                            <Plus size={13} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Active Checkbox */}
              <div className="form-checkbox-row">
                <label className="checkbox-custom-label">
                  <input
                    type="checkbox"
                    checked={offerForm.isActive}
                    onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                  />
                  <span>Rendre cette offre immédiatement active et visible sur le site</span>
                </label>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setIsOfferModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="admin-btn primary"
                  disabled={isSaving}
                >
                  <Check size={18} />
                  <span>{editingOfferId ? 'Enregistrer les modifications' : 'Publier cette offre'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TechnoTech Security Notifications Center Drawer */}
      <SecurityNotificationCenter
        isOpen={isSecurityCenterOpen}
        onClose={() => setIsSecurityCenterOpen(false)}
        notifications={securityNotifications}
        unreadCount={unreadSecurityCount}
        onMarkAsRead={handleMarkSecurityAsRead}
        onMarkAllAsRead={handleMarkAllSecurityAsRead}
        onDeleteNotification={handleDeleteSecurity}
        onClearAll={handleClearAllSecurity}
        onRefresh={() => fetchSecurityNotifications(false)}
        isLoading={isLoadingSecurity}
      />
    </div>
  );
}
