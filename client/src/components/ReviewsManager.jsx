import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle,
  Star,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  Check,
  Search,
  ExternalLink,
  Camera,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCheck,
  Image as ImageIcon,
  ShieldCheck,
  Phone,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  getStoredReviews,
  saveStoredReviews,
  addStoredReview,
  updateStoredReview,
  deleteStoredReview,
  resetStoredReviews,
  INITIAL_REVIEWS,
} from '../data/reviewsData.js';
import { productService } from '../services/productService.js';
import { reviewService } from '../services/reviewService.js';
import './ReviewsManager.css';

// WhatsApp & Messenger SVG Logos
const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12C2 13.89 2.525 15.66 3.438 17.182L2.05 21.95L6.963 20.6C8.441 21.488 10.166 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM17.275 14.896C17.062 14.789 16.012 14.27 15.816 14.2C15.62 14.129 15.478 14.093 15.336 14.306C15.194 14.519 14.786 15.016 14.662 15.158C14.537 15.3 14.413 15.318 14.2 15.212C13.987 15.105 13.301 14.88 12.489 14.156C11.856 13.592 11.428 12.895 11.304 12.682C11.18 12.469 11.291 12.354 11.398 12.248C11.494 12.152 11.611 11.999 11.718 11.875C11.824 11.751 11.86 11.662 11.931 11.52C12.002 11.378 11.966 11.254 11.913 11.147C11.86 11.041 11.434 9.993 11.256 9.567C11.084 9.151 10.908 9.208 10.776 9.201C10.652 9.194 10.51 9.194 10.368 9.194C10.226 9.194 9.995 9.247 9.8 9.46C9.605 9.673 9.055 10.188 9.055 11.235C9.055 12.282 9.818 13.293 9.924 13.435C10.031 13.577 11.424 15.727 13.559 16.65C14.067 16.869 14.464 17.001 14.773 17.099C15.283 17.261 15.748 17.238 16.115 17.183C16.524 17.122 17.375 16.668 17.553 16.171C17.731 15.674 17.731 15.248 17.677 15.158C17.624 15.07 17.488 15.002 17.275 14.896Z"
      fill="currentColor"
    />
  </svg>
);

const MessengerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.477 2 2 6.145 2 11.259C2 14.174 3.453 16.745 5.727 18.384V22L9.182 20.106C10.082 20.354 11.027 20.517 12 20.517C17.523 20.517 22 16.373 22 11.259C22 6.145 17.523 2 12 2ZM13.136 14.477L10.545 11.714L5.455 14.477L11.045 8.523L13.636 11.286L18.727 8.523L13.136 14.477Z"
      fill="currentColor"
    />
  </svg>
);

export default function ReviewsManager({ products = [], notify, onReviewsChange }) {
  const [reviews, setReviews] = useState(getStoredReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [deleteConfirmReview, setDeleteConfirmReview] = useState(null);
  const [previewModalReview, setPreviewModalReview] = useState(null);

  // Load reviews from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    const fetchReviewsFromDB = async () => {
      try {
        setIsLoading(true);
        const data = await reviewService.getAll();
        if (isMounted && Array.isArray(data)) {
          setReviews(data);
          if (onReviewsChange) onReviewsChange(data);
        }
      } catch (err) {
        console.warn('Erreur chargement avis depuis BD:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchReviewsFromDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    platform: 'whatsapp',
    customerName: '',
    customerCity: 'Tunis',
    customerPhone: '+216 98 ••• ••',
    productName: 'ChatGPT Plus — Abonnement Officiel',
    rating: 5,
    date: '',
    screenshotUrl: '',
    avatar: null,
    customerMessage: '',
    storeReply: 'Merci beaucoup pour votre confiance ! ✨ L’équipe TechnoTech reste à votre disposition.',
  });

  const fileInputRef = useRef(null);

  // Filter reviews with strict deduplication
  const filteredReviews = useMemo(() => {
    const seen = new Set();
    return reviews.filter((rev) => {
      const uniqueKey = rev.id || (rev._id ? String(rev._id) : null);
      if (uniqueKey && seen.has(uniqueKey)) return false;
      if (uniqueKey) seen.add(uniqueKey);

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        rev.customerName?.toLowerCase().includes(q) ||
        rev.productName?.toLowerCase().includes(q) ||
        (rev.messages && rev.messages.some((m) => m.text?.toLowerCase().includes(q)));

      return matchesSearch;
    });
  }, [reviews, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingReview(null);
    setSelectedImages([]);
    setUrlInput('');
    setUploadProgress(null);
    setFormData({
      platform: 'whatsapp',
      customerName: '',
      customerCity: 'Tunis',
      customerPhone: '+216 ',
      productName: products[0]?.name || 'ChatGPT Plus — Abonnement Officiel',
      rating: 5,
      date: "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      screenshotUrl: '',
      avatar: null,
      customerMessage: '',
      storeReply: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (review) => {
    setEditingReview(review);
    setSelectedImages(review.screenshotUrl ? [review.screenshotUrl] : []);
    setUrlInput('');
    setUploadProgress(null);
    const custMsg = review.messages?.find((m) => m.sender === 'customer')?.text || '';
    const storeMsg = review.messages?.find((m) => m.sender === 'store')?.text || '';

    setFormData({
      platform: review.platform || 'whatsapp',
      customerName: review.customerName || '',
      customerCity: review.customerCity || 'Tunis',
      customerPhone: review.customerPhone || '+216 98 ••• ••',
      productName: review.productName || (products[0]?.name || 'Produit Digital'),
      rating: review.rating || 5,
      date: review.date || "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      screenshotUrl: review.screenshotUrl || '',
      avatar: review.avatar || null,
      customerMessage: custMsg,
      storeReply: storeMsg,
    });
    setIsModalOpen(true);
  };

  // Upload Multiple Screenshots or Photos
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Veuillez sélectionner des fichiers image valides (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsUploadingImg(true);
      setUploadProgress({ current: 0, total: validFiles.length });

      const newUrls = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress({ current: i + 1, total: validFiles.length });

        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        try {
          const uploadedUrl = await productService.uploadBase64(base64, `review-${Date.now()}-${i}-${file.name}`);
          newUrls.push(uploadedUrl || base64);
        } catch (uploadErr) {
          newUrls.push(base64);
        }
      }

      setSelectedImages((prev) => [...prev, ...newUrls]);
      if (notify) {
        notify(
          validFiles.length > 1
            ? `${validFiles.length} images téléversées avec succès ! 📸`
            : 'Image téléversée avec succès ! 📸'
        );
      }
    } catch (err) {
      console.error('Erreur chargement images:', err);
      alert('Erreur lors du traitement des images: ' + err.message);
    } finally {
      setIsUploadingImg(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrlImages = () => {
    if (!urlInput.trim()) return;
    const urls = urlInput
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/')));

    if (urls.length === 0) {
      alert('Veuillez entrer une ou plusieurs URL valides d’images (ex: https://...).');
      return;
    }

    setSelectedImages((prev) => [...prev, ...urls]);
    setUrlInput('');
    if (notify) {
      notify(
        urls.length > 1
          ? `${urls.length} images ajoutées depuis l'URL ! 🔗`
          : 'Image ajoutée depuis l’URL ! 🔗'
      );
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      alert('Veuillez ajouter au moins une capture d\'écran (image) pour cet avis.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingReview) {
        const reviewPayload = {
          ...(editingReview._id ? { _id: editingReview._id } : {}),
          id: editingReview.id || editingReview._id,
          platform: formData.platform || 'whatsapp',
          customerName: formData.customerName?.trim() || 'Client Vérifié',
          customerCity: formData.customerCity?.trim() || 'Tunis',
          customerPhone: formData.customerPhone?.trim() || '+216 98 ••• ••',
          avatar: null,
          productName: formData.productName?.trim() || 'Avis Client',
          rating: Number(formData.rating) || 5,
          date: formData.date || "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verified: true,
          badgeText: formData.platform === 'whatsapp' ? 'Client WhatsApp ✅' : 'Client Facebook ✅',
          screenshotUrl: selectedImages[0] ? selectedImages[0].trim() : null,
          messages: editingReview.messages || [],
        };
        await reviewService.save(reviewPayload);
        const nextReviews = getStoredReviews();
        setReviews(nextReviews);
        if (onReviewsChange) onReviewsChange(nextReviews);
        setIsModalOpen(false);
        setEditingReview(null);
        if (notify) notify('Avis modifié avec succès dans la base de données ! ✨');
      } else if (selectedImages.length === 1) {
        const reviewPayload = {
          id: `rev-${Date.now()}`,
          platform: formData.platform || 'whatsapp',
          customerName: formData.customerName?.trim() || 'Client Vérifié',
          customerCity: formData.customerCity?.trim() || 'Tunis',
          customerPhone: formData.customerPhone?.trim() || '+216 98 ••• ••',
          avatar: null,
          productName: formData.productName?.trim() || 'Avis Client',
          rating: Number(formData.rating) || 5,
          date: formData.date || "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verified: true,
          badgeText: formData.platform === 'whatsapp' ? 'Client WhatsApp ✅' : 'Client Facebook ✅',
          screenshotUrl: selectedImages[0].trim(),
          messages: [],
        };
        await reviewService.save(reviewPayload);
        const nextReviews = getStoredReviews();
        setReviews(nextReviews);
        if (onReviewsChange) onReviewsChange(nextReviews);
        setIsModalOpen(false);
        if (notify) notify('Nouvel avis et photo enregistrés dans la base de données ! 🚀');
      } else {
        const baseDate = formData.date || "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const reviewsList = selectedImages.map((imgUrl, idx) => ({
          id: `rev-${Date.now()}-${idx}`,
          platform: formData.platform || 'whatsapp',
          customerName: formData.customerName?.trim() || 'Client Vérifié',
          customerCity: formData.customerCity?.trim() || 'Tunis',
          customerPhone: formData.customerPhone?.trim() || '+216 98 ••• ••',
          avatar: null,
          productName: formData.productName?.trim() || 'Avis Client',
          rating: Number(formData.rating) || 5,
          date: baseDate,
          timeStr: timeNow,
          verified: true,
          badgeText: formData.platform === 'whatsapp' ? 'Client WhatsApp ✅' : 'Client Facebook ✅',
          screenshotUrl: imgUrl.trim(),
          messages: [],
        }));
        await reviewService.saveMany(reviewsList);
        const nextReviews = getStoredReviews();
        setReviews(nextReviews);
        if (onReviewsChange) onReviewsChange(nextReviews);
        setIsModalOpen(false);
        if (notify) notify(`${reviewsList.length} avis et photos enregistrés avec succès dans la base de données ! 🚀`);
      }
    } catch (err) {
      console.error('Erreur enregistrement BD:', err);
      alert('Erreur lors de l’enregistrement dans la base de données: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmReview) return;
    const targetId = deleteConfirmReview._id || deleteConfirmReview.id;
    setIsDeleting(true);
    try {
      await reviewService.delete(targetId);
      const nextReviews = getStoredReviews();
      setReviews(nextReviews);
      if (onReviewsChange) onReviewsChange(nextReviews);
      setDeleteConfirmReview(null);
      if (notify) notify('Avis et photo supprimés avec succès de la base de données ! 🗑️');
    } catch (err) {
      console.error('Erreur suppression BD:', err);
      alert('Erreur lors de la suppression dans la base de données: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllReviews = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer TOUS les avis et photos de la base de données ?')) {
      setIsLoading(true);
      try {
        await reviewService.deleteAll();
        setReviews([]);
        if (onReviewsChange) onReviewsChange([]);
        if (notify) notify('Tous les avis ont été supprimés avec succès de la base de données ! 🗑️');
      } catch (err) {
        console.error('Erreur suppression BD:', err);
        alert('Erreur lors de la suppression : ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="reviews-manager-root">
      {/* 1. Header & Quick Metrics Bar */}
      <div className="rm-header-card">
        <div className="rm-header-info">
          <div className="rm-header-badge">
            <Star size={16} fill="#ffa502" color="#ffa502" />
            <span>GESTIONNAIRE DES AVIS & CAPTURES WHATSAPP / FACEBOOK</span>
          </div>
          <h2 className="rm-header-title">Gérer les Avis Clients & Preuves Sociales</h2>
          <p className="rm-header-desc">
            Ajoutez, modifiez ou supprimez facilement les captures d'écran réelles et les conversations WhatsApp et Facebook affichées dans le carrousel de la page d'accueil.
          </p>
        </div>

        <div className="rm-header-actions">
          {reviews.length > 0 && (
            <button
              type="button"
              className="rm-btn secondary"
              onClick={handleClearAllReviews}
              title="Supprimer tous les avis de la base de données"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <Trash2 size={15} />
              <span>Tout supprimer</span>
            </button>
          )}

          <button
            type="button"
            className="rm-btn primary"
            onClick={handleOpenAddModal}
            title="Ajouter une nouvelle capture ou avis client"
          >
            <Plus size={18} />
            <span>Ajouter une Photo / Avis</span>
          </button>
        </div>
      </div>



      {/* 3. Search & Filter Bar */}
      <div className="rm-toolbar-card">
        <div className="rm-search-box">
          <Search size={17} className="rm-search-icon" />
          <input
            type="text"
            className="rm-search-input"
            placeholder="Rechercher par nom de client, produit ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="rm-search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Reviews Grid Display */}
      <div className="rm-grid-wrapper">
        {filteredReviews.length === 0 ? (
          <div className="rm-empty-state">
            <div className="rm-empty-icon-box">
              <Camera size={38} />
            </div>
            <h3 className="rm-empty-title">Aucun avis ne correspond à votre recherche</h3>
            <p className="rm-empty-desc">
              Cliquez sur "Ajouter une Photo / Avis" pour créer votre premier retour client ou modifier vos filtres.
            </p>
            <button
              type="button"
              className="rm-btn primary"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              <span>Ajouter un avis</span>
            </button>
          </div>
        ) : (
          <div className="rm-cards-grid">
            {filteredReviews.map((review, index) => {
              const isWa = review.platform === 'whatsapp';
              const hasScreenshot = Boolean(review.screenshotUrl);
              const previewMsg = review.messages?.find((m) => m.sender === 'customer')?.text || 'Discussion client confirmée.';

              return (
                <div
                  key={review._id ? String(review._id) : (review.id ? `${review.id}-${index}` : `rm-rev-${index}`)}
                  className={`rm-item-card ${isWa ? 'wa-card' : 'fb-card'}`}
                >
                  {/* Card Header */}
                  <div className="rm-card-header">
                    <div className="rm-user-identity">
                      <div className="rm-user-meta">
                        <div className="rm-name-row">
                          <span className="rm-client-name">{review.customerName}</span>
                          <CheckCheck size={14} className="rm-verified-icon" />
                        </div>
                        <span className="rm-client-sub">
                          {isWa ? (review.customerPhone || 'WhatsApp') : (review.customerCity || 'Facebook')} • {review.date || 'Récemment'}
                        </span>
                      </div>
                    </div>

                    <div className={`rm-platform-badge ${isWa ? 'wa-badge' : 'fb-badge'}`}>
                      {isWa ? <WhatsAppIcon size={14} /> : <MessengerIcon size={14} />}
                      <span>{isWa ? 'WhatsApp' : 'Facebook'}</span>
                    </div>
                  </div>

                  {/* Visual Content: Screenshot Image OR Conversation Preview */}
                  <div className="rm-card-body">
                    {hasScreenshot ? (
                      <div
                        className="rm-screenshot-box"
                        onClick={() => setPreviewModalReview(review)}
                        title="Cliquer pour agrandir la capture"
                      >
                        <img
                          src={review.screenshotUrl}
                          alt={`Capture ${review.customerName}`}
                          className="rm-screenshot-img"
                        />
                        <div className="rm-screenshot-badge">
                          <Camera size={13} />
                          <span>Capture Réelle</span>
                        </div>
                        <div className="rm-zoom-overlay">
                          <Eye size={20} />
                          <span>Agrandir</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rm-chat-preview-box">
                        <div className="rm-chat-bubble customer-bubble">
                          <span className="bubble-text">{previewMsg}</span>
                        </div>
                        {review.messages?.length > 1 && (
                          <div className="rm-chat-bubble store-bubble">
                            <span className="bubble-text">
                              {review.messages.find((m) => m.sender === 'store')?.text || 'Merci pour votre confiance ! ✨'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Rating & Actions */}
                  <div className="rm-card-footer">
                    <div className="rm-prod-row">
                      <div className="rm-rating-row">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star key={i} size={12} fill="#ffa502" color="#ffa502" />
                        ))}
                      </div>
                    </div>

                    <div className="rm-actions-row">
                      <button
                        type="button"
                        className="rm-action-btn edit-btn"
                        onClick={() => handleOpenEditModal(review)}
                        title="Modifier cet avis et son image"
                      >
                        <Edit3 size={15} />
                        <span>Modifier</span>
                      </button>

                      <button
                        type="button"
                        className="rm-action-btn delete-btn"
                        onClick={() => setDeleteConfirmReview(review)}
                        title="Supprimer cet avis"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          5. Modal Ajouter / Modifier un Avis & Photo (Full Editor)
          ===================================================================== */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="rm-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="rm-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <div className="rm-modal-header-texts">
                <span className="rm-modal-kicker">
                  {editingReview ? 'Édition de l’avis' : 'Nouvel avis client'}
                </span>
                <h3 className="rm-modal-title">
                  {editingReview ? `Modifier l’avis de ${editingReview.customerName}` : 'Ajouter une Photo ou Conversation Client'}
                </h3>
              </div>
              <button
                type="button"
                className="rm-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="rm-modal-form">
              {/* Platform Choice */}
              <div className="rm-form-group">
                <label className="rm-label">Type de canal :</label>
                <div className="rm-platform-toggle-row">
                  <button
                    type="button"
                    className={`rm-toggle-card ${formData.platform === 'whatsapp' ? 'active-wa' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, platform: 'whatsapp' }))}
                  >
                    <WhatsAppIcon size={20} />
                    <span>WhatsApp Chat</span>
                  </button>

                  <button
                    type="button"
                    className={`rm-toggle-card ${formData.platform === 'facebook' ? 'active-fb' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, platform: 'facebook' }))}
                  >
                    <MessengerIcon size={20} />
                    <span>Facebook Messenger</span>
                  </button>
                </div>
              </div>

              {/* Note attribuée */}
              <div className="rm-form-group">
                <label className="rm-label">Note attribuée :</label>
                <select
                  className="rm-select"
                  value={formData.rating}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 / 5 - Parfait)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 / 5 - Très bien)</option>
                  <option value={3}>⭐⭐⭐ (3 / 5 - Satisfait)</option>
                </select>
              </div>

              {/* PHOTO / SCREENSHOT UPLOADER SECTION (MULTI-IMAGE SUPPORT) */}
              <div className="rm-form-group rm-upload-section-card">
                <div className="rm-upload-header-row">
                  <div>
                    <label className="rm-label rm-label-bold">
                      <Camera size={16} />
                      <span>Captures d’écran & Photos (Sélection Multiple)</span>
                      {selectedImages.length > 0 && (
                        <span className="rm-images-count-badge">
                          {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </label>
                    <span className="rm-upload-sub">
                      Sélectionnez plusieurs captures WhatsApp/Messenger à la fois ou collez des liens URL.
                    </span>
                  </div>

                  {selectedImages.length > 0 && (
                    <button
                      type="button"
                      className="rm-remove-img-btn"
                      onClick={() => setSelectedImages([])}
                      title="Tout retirer"
                    >
                      <Trash2 size={13} />
                      <span>Tout effacer</span>
                    </button>
                  )}
                </div>

                {/* Upload or URL Row */}
                <div className="rm-upload-controls-row">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    className="rm-file-pick-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImg}
                  >
                    {isUploadingImg ? (
                      <>
                        <Loader2 size={16} className="btn-spin" />
                        <span>
                          {uploadProgress
                            ? `Téléversement (${uploadProgress.current}/${uploadProgress.total})...`
                            : 'Téléversement en cours...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Choisir des images (plusieurs autorisées)</span>
                      </>
                    )}
                  </button>

                  <span className="rm-upload-or">ou</span>

                  <div className="rm-url-input-group">
                    <input
                      type="url"
                      className="rm-input rm-url-input"
                      placeholder="Coller URL(s) d’image (séparées par espace ou virgule)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrlImages();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="rm-url-add-btn"
                      onClick={handleAddUrlImages}
                      disabled={!urlInput.trim()}
                      title="Ajouter l'image"
                    >
                      <Plus size={15} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>

                {/* Upload progress indicator */}
                {isUploadingImg && uploadProgress && (
                  <div className="rm-upload-progress-box">
                    <div className="rm-upload-progress-bar">
                      <div
                        className="rm-upload-progress-fill"
                        style={{
                          width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="rm-upload-progress-text">
                      Traitement de l’image {uploadProgress.current} sur {uploadProgress.total}...
                    </span>
                  </div>
                )}

                {/* Thumbnails Gallery */}
                {selectedImages.length > 0 && (
                  <div className="rm-thumbnails-container">
                    <div className="rm-thumbnails-header">
                      <span className="rm-thumb-title">
                        Images prêtes pour l'enregistrement ({selectedImages.length}) :
                      </span>
                    </div>
                    <div className="rm-thumbnails-grid">
                      {selectedImages.map((imgUrl, index) => (
                        <div key={`${imgUrl}-${index}`} className="rm-thumbnail-item">
                          <img
                            src={imgUrl}
                            alt={`Capture #${index + 1}`}
                            className="rm-thumb-img"
                          />
                          <div className="rm-thumb-overlay">
                            <span className="rm-thumb-index">#{index + 1}</span>
                            <button
                              type="button"
                              className="rm-thumb-remove-btn"
                              onClick={() => handleRemoveImage(index)}
                              title="Retirer cette image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add more button in the grid */}
                      <button
                        type="button"
                        className="rm-thumb-add-more"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImg}
                        title="Ajouter encore des images"
                      >
                        <Plus size={22} />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="rm-modal-footer">
                <button
                  type="button"
                  className="rm-btn secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rm-btn primary save-btn"
                  disabled={isSaving || selectedImages.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={17} className="btn-spin" />
                      <span>Enregistrement dans la BD...</span>
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      <span>
                        {editingReview
                          ? 'Enregistrer dans la BD'
                          : selectedImages.length > 1
                            ? `Enregistrer les ${selectedImages.length} avis dans la BD`
                            : 'Ajouter dans la BD'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================================
          6. Modal Confirmation de Suppression
          ===================================================================== */}
      {deleteConfirmReview && typeof document !== 'undefined' && createPortal(
        <div
          className="rm-modal-backdrop"
          onClick={() => setDeleteConfirmReview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="rm-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rm-delete-icon-box">
              <Trash2 size={26} />
            </div>
            <h3 className="rm-delete-title">Supprimer cet avis ?</h3>
            <p className="rm-delete-desc">
              Êtes-vous sûr de vouloir supprimer définitivement l'avis de{' '}
              <strong>"{deleteConfirmReview.customerName}"</strong> ? Cette action retirera la capture ou discussion du carrousel de la page d'accueil.
            </p>

            <div className="rm-delete-actions">
              <button
                type="button"
                className="rm-btn secondary"
                onClick={() => setDeleteConfirmReview(null)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rm-btn danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="btn-spin" /> : <Trash2 size={16} />}
                <span>{isDeleting ? 'Suppression de la BD...' : 'Oui, supprimer de la BD'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================================
          7. Modal Aperçu Agrandie (Full Screenshot Lightbox)
          ===================================================================== */}
      {previewModalReview && typeof document !== 'undefined' && createPortal(
        <div
          className="rm-modal-backdrop"
          onClick={() => setPreviewModalReview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="rm-preview-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="rm-preview-close"
              onClick={() => setPreviewModalReview(null)}
            >
              <X size={18} />
            </button>
            <div className="rm-preview-content">
              <img
                src={previewModalReview.screenshotUrl}
                alt="Aperçu grand format"
                className="rm-preview-full-img"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
