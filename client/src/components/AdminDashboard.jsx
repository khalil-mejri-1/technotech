import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
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
  ShoppingBag
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../data/productsData.js';
import { productService } from '../services/productService.js';
import { orderService } from '../services/orderService.js';
import { getImageUrl } from '../config/api.js';
import OrdersManager, { playOrderChime } from './OrdersManager.jsx';

const getThumbnailLabel = (name = '') => {
  if (!name) return '';
  return name.length > 12 ? `${name.substring(0, 11)}...` : name;
};

export default function AdminDashboard({
  products,
  onUpdateProducts,
  heroSlides = [],
  onUpdateHeroSlides,
  onNavigateStore
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'hero'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusNotice, setStatusNotice] = useState(null);

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
          <img src="/images/logo.png" alt="Logo" className="admin-logo-img" />
          <div>
            <h1 className="admin-page-title">Panneau d'Administration (Admin)</h1>
            <span className="admin-page-subtitle">Console de Gestion TechnoTech</span>
          </div>
        </div>

        <div className="admin-actions-group">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onNavigateStore}
          >
            <ArrowLeft size={17} />
            <span>Retour à la boutique</span>
          </button>

          {activeTab === 'products' ? (
            <button
              type="button"
              className="admin-btn primary"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} />
              <span>Ajouter un produit</span>
            </button>
          ) : (
            <button
              type="button"
              className="admin-btn primary"
              onClick={handleOpenAddHeroModal}
            >
              <Plus size={18} />
              <span>Ajouter au Carrousel</span>
            </button>
          )}
        </div>
      </header>

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
    </div>
  );
}
