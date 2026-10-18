import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  Zap,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Check,
  Sparkles,
  ExternalLink,
  Plus,
  X,
  Camera,
  ShoppingBag,
  ArrowRight,
  Heart,
  Flame,
  ThumbsUp
} from 'lucide-react';
import { getStoredReviews, saveStoredReviews, addStoredReview, INITIAL_REVIEWS } from '../data/reviewsData.js';
import { reviewService } from '../services/reviewService.js';
import './CustomerReviews.css';

// Official SVG Brand Logos for WhatsApp and Facebook Messenger
const WhatsAppLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12C2 13.89 2.525 15.66 3.438 17.182L2.05 21.95L6.963 20.6C8.441 21.488 10.166 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM17.275 14.896C17.062 14.789 16.012 14.27 15.816 14.2C15.62 14.129 15.478 14.093 15.336 14.306C15.194 14.519 14.786 15.016 14.662 15.158C14.537 15.3 14.413 15.318 14.2 15.212C13.987 15.105 13.301 14.88 12.489 14.156C11.856 13.592 11.428 12.895 11.304 12.682C11.18 12.469 11.291 12.354 11.398 12.248C11.494 12.152 11.611 11.999 11.718 11.875C11.824 11.751 11.86 11.662 11.931 11.52C12.002 11.378 11.966 11.254 11.913 11.147C11.86 11.041 11.434 9.993 11.256 9.567C11.084 9.151 10.908 9.208 10.776 9.201C10.652 9.194 10.51 9.194 10.368 9.194C10.226 9.194 9.995 9.247 9.8 9.46C9.605 9.673 9.055 10.188 9.055 11.235C9.055 12.282 9.818 13.293 9.924 13.435C10.031 13.577 11.424 15.727 13.559 16.65C14.067 16.869 14.464 17.001 14.773 17.099C15.283 17.261 15.748 17.238 16.115 17.183C16.524 17.122 17.375 16.668 17.553 16.171C17.731 15.674 17.731 15.248 17.677 15.158C17.624 15.07 17.488 15.002 17.275 14.896Z"
      fill="currentColor"
    />
  </svg>
);

const MessengerLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2C6.477 2 2 6.145 2 11.259C2 14.174 3.453 16.745 5.727 18.384V22L9.182 20.106C10.082 20.354 11.027 20.517 12 20.517C17.523 20.517 22 16.373 22 11.259C22 6.145 17.523 2 12 2ZM13.136 14.477L10.545 11.714L5.455 14.477L11.045 8.523L13.636 11.286L18.727 8.523L13.136 14.477Z"
      fill="currentColor"
    />
  </svg>
);

export default function CustomerReviewsSection({
  whatsappNumber = '96086581',
  onAddToCart,
  products = [],
  onNavigate,
}) {
  const [reviews, setReviews] = useState(getStoredReviews);

  useEffect(() => {
    let isMounted = true;
    const fetchReviewsFromDB = async () => {
      try {
        const data = await reviewService.getAll();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      } catch (err) {
        // silent fallback to local storage
      }
    };
    fetchReviewsFromDB();

    const handleSync = (e) => {
      if (e?.detail) {
        setReviews(e.detail);
      } else {
        setReviews(getStoredReviews());
      }
    };
    window.addEventListener('technotech_reviews_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('technotech_reviews_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [activeFilter, setActiveFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding custom review
  const [newReviewForm, setNewReviewForm] = useState({
    platform: 'whatsapp',
    customerName: '',
    customerCity: 'Tunis',
    productName: 'ChatGPT Plus — Abonnement Officiel',
    rating: 5,
    message: '',
    screenshotUrl: '',
  });

  const cleanDigits = String(whatsappNumber || '96086581').replace(/\D/g, '');
  const fullIntlPhone = cleanDigits.startsWith('216') ? cleanDigits : `216${cleanDigits}`;

  // Filter reviews with strict deduplication
  const filteredReviews = useMemo(() => {
    const seen = new Set();
    return reviews.filter((r) => {
      const uniqueKey = r.id || (r._id ? String(r._id) : null);
      if (uniqueKey && seen.has(uniqueKey)) return false;
      if (uniqueKey) seen.add(uniqueKey);

      if (activeFilter === 'whatsapp') {
        return r.platform === 'whatsapp';
      }
      if (activeFilter === 'facebook') {
        return r.platform === 'facebook';
      }
      if (activeFilter === 'screenshots') {
        return Boolean(r.screenshotUrl);
      }
      return true;
    });
  }, [reviews, activeFilter]);

  // Window resize to calculate cards per view (4 for desktop >1200px, 3 for 860-1200px, 2 for 580-860px, 1 for mobile)
  const [cardsPerView, setCardsPerView] = useState(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth <= 580) return 1;
    if (window.innerWidth <= 860) return 2;
    if (window.innerWidth <= 1200) return 3;
    return 4;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 580) {
        setCardsPerView(1);
      } else if (window.innerWidth <= 860) {
        setCardsPerView(2);
      } else if (window.innerWidth <= 1200) {
        setCardsPerView(3);
      } else {
        setCardsPerView(4);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, filteredReviews.length - cardsPerView);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  // Smooth Carousel Auto-Play (pauses on hover)
  useEffect(() => {
    if (isAutoplayPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoplayPaused, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Submit new review
  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReviewForm.customerName.trim() || (!newReviewForm.message.trim() && !newReviewForm.screenshotUrl.trim())) {
      alert('Veuillez remplir le nom du client et ajouter un message ou une capture.');
      return;
    }

    const created = {
      id: `rev-custom-${Date.now()}`,
      platform: newReviewForm.platform,
      customerName: newReviewForm.customerName.trim(),
      customerCity: newReviewForm.customerCity || 'Tunis',
      customerPhone: newReviewForm.platform === 'whatsapp' ? '+216 98 ••• ••' : undefined,
      avatar:
        newReviewForm.platform === 'whatsapp'
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
      productName: newReviewForm.productName,
      rating: Number(newReviewForm.rating) || 5,
      date: "Aujourd'hui à " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verified: true,
      badgeText: 'Avis Vérifié ✅',
      screenshotUrl: newReviewForm.screenshotUrl ? newReviewForm.screenshotUrl.trim() : null,
      messages: newReviewForm.message
        ? [
            {
              id: `m-${Date.now()}-1`,
              sender: 'customer',
              text: newReviewForm.message.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read',
            },
            {
              id: `m-${Date.now()}-2`,
              sender: 'store',
              text: 'Merci beaucoup pour votre retour positif et votre confiance ! ✨ L’équipe TechnoTech reste à votre disposition.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read',
            },
          ]
        : [],
    };

    const updated = addStoredReview(created);
    setReviews(updated);
    setIsAddModalOpen(false);
    setNewReviewForm({
      platform: 'whatsapp',
      customerName: '',
      customerCity: 'Tunis',
      productName: 'ChatGPT Plus — Abonnement Officiel',
      rating: 5,
      message: '',
      screenshotUrl: '',
    });
  };

  return (
    <section
      className="customer-reviews-section"
      id="avis-clients-section"
      aria-label="Avis Clients et Retours d'expérience"
    >
      <div className="reviews-ambient-glow" aria-hidden="true" />

      <div className="reviews-container">
        {/* ==========================================================================
            Header & Trust Metrics
            ========================================================================== */}
        <div className="reviews-header-area">
          <div className="reviews-badge-pill">
            <Star size={15} className="reviews-star-icon" />
            <span>AVIS CLIENTS & CONVERSATIONS RÉELLES</span>
          </div>

          <h2 className="reviews-main-title">
            La Confiance de Nos Clients en <span className="reviews-title-gradient">Preuves Réelles</span>
          </h2>

          <p className="reviews-sub-title">
            Retrouvez les captures authentiques de discussions WhatsApp et Facebook Messenger avec nos clients en Tunisie.
            Activation instantanée, comptes 100% officiels et support réactif 7j/7.
          </p>

        </div>

        {/* ==========================================================================
            Carousel Viewport with Side Navigation Controls
            ========================================================================== */}
        <div className="reviews-carousel-wrapper">
          <button
            type="button"
            className="carousel-side-arrow carousel-arrow-left"
            onClick={handlePrev}
            disabled={maxIndex === 0}
            aria-label="Avis précédent"
            title="Précédent"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="reviews-carousel-viewport"
            onMouseEnter={() => setIsAutoplayPaused(true)}
            onMouseLeave={() => setIsAutoplayPaused(false)}
          >
            <div
              className="reviews-cards-track"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            }}
          >
            {filteredReviews.map((review, index) => {
              const isWa = review.platform === 'whatsapp';
              const hasScreenshot = Boolean(review.screenshotUrl);

              return (
                <article
                  key={review._id ? String(review._id) : (review.id ? `${review.id}-${index}` : `crs-rev-${index}`)}
                  className={`review-phone-card ${isWa ? 'is-wa' : 'is-fb'}`}
                  onClick={() => setSelectedReview(review)}
                >
                  {/* Smartphone Top Speaker Notch */}
                  <div className="phone-top-notch">
                    <span>{review.timeStr || '14:20'}</span>
                    <div className="notch-island" />
                    <span>5G • 100%</span>
                  </div>

                  {/* Top Chat Header */}
                  <div className={`phone-chat-header ${isWa ? 'wa-header' : 'fb-header'}`}>
                    <div className="chat-user-info-group">
                      <div className="chat-user-avatar-wrap">
                        <img
                          src={review.avatar || '/images/logo.png'}
                          alt={review.customerName}
                          className="chat-user-avatar"
                          loading="lazy"
                        />
                        <span className="chat-online-dot" />
                      </div>
                      <div className="chat-meta-texts">
                        <div className="chat-user-name-row">
                          <span className="chat-user-name">{review.customerName}</span>
                          {review.verified && (
                            <CheckCheck size={14} className="verified-icon" title="Client Vérifié" />
                          )}
                        </div>
                        <span className="chat-status-sub">
                          {isWa ? (review.customerPhone || 'En ligne') : (review.customerCity ? `${review.customerCity} • Actif(ve)` : 'Actif(ve)')}
                        </span>
                      </div>
                    </div>

                    <div className="chat-header-actions">
                      {isWa ? (
                        <>
                          <Video size={17} />
                          <Phone size={16} />
                          <WhatsAppLogo size={18} />
                        </>
                      ) : (
                        <>
                          <Phone size={16} />
                          <Video size={17} />
                          <MessengerLogo size={18} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chat Content Body or Screenshot Image */}
                  {hasScreenshot ? (
                    <div className="review-screenshot-preview">
                      <img
                        src={review.screenshotUrl}
                        alt={`Capture avis ${review.customerName}`}
                        className="review-screenshot-img"
                        loading="lazy"
                      />
                      <div className="screenshot-overlay-badge">
                        <Camera size={13} />
                        <span>Capture Réelle</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`phone-chat-body ${!isWa ? 'fb-chat-body' : ''}`}>
                      <div className="chat-security-banner">
                        {isWa ? (
                          <>🔒 Messages chiffrés de bout en bout</>
                        ) : (
                          <>Discussion vérifiée avec TechnoTech Officiel</>
                        )}
                      </div>

                      {review.messages &&
                        review.messages.map((msg) => {
                          const isCustomer = msg.sender === 'customer';
                          return (
                            <div
                              key={msg.id}
                              className={`chat-bubble-row ${isCustomer ? 'from-customer' : 'from-store'}`}
                            >
                              <div
                                className={`chat-bubble ${
                                  isWa
                                    ? isCustomer
                                      ? 'wa-customer-bubble'
                                      : 'wa-store-bubble'
                                    : isCustomer
                                    ? 'fb-customer-bubble'
                                    : 'fb-store-bubble'
                                }`}
                              >
                                <span>{msg.text}</span>
                                <div className="chat-bubble-footer">
                                  <span>{msg.time}</span>
                                  {isWa && <CheckCheck size={14} className="double-tick" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Card Bottom: Product Purchased & 5-Star Rating */}
                  <div className="phone-card-footer">
                    <div className="purchased-prod-tag" title={review.productName}>
                      <ShoppingBag size={14} className="prod-tag-icon" />
                      <span>{review.productName}</span>
                    </div>

                    <div className="card-rating-stars">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} size={13} fill="#ffa502" color="#ffa502" />
                      ))}
                    </div>

                    <button
                      type="button"
                      className="card-zoom-hint-btn"
                      title="Agrandir cette conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReview(review);
                      }}
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          </div>

          <button
            type="button"
            className="carousel-side-arrow carousel-arrow-right"
            onClick={handleNext}
            disabled={maxIndex === 0}
            aria-label="Avis suivant"
            title="Suivant"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        {maxIndex > 0 && (
          <div className="reviews-carousel-pagination" aria-hidden="true">
            {[...Array(maxIndex + 1)].map((_, idx) => (
              <span
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        )}

      </div>

      {/* ==========================================================================
          Lightbox Modal: Enlarged Full-View Conversation
          ========================================================================== */}
      {selectedReview && (
        <div
          className="review-lightbox-backdrop"
          onClick={() => setSelectedReview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="review-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setSelectedReview(null)}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="lightbox-modal-content">
              {/* Phone Header in Modal */}
              <div
                className={`phone-chat-header ${
                  selectedReview.platform === 'whatsapp' ? 'wa-header' : 'fb-header'
                }`}
              >
                <div className="chat-user-info-group">
                  <div className="chat-user-avatar-wrap">
                    <img
                      src={selectedReview.avatar || '/images/logo.png'}
                      alt={selectedReview.customerName}
                      className="chat-user-avatar"
                    />
                    <span className="chat-online-dot" />
                  </div>
                  <div className="chat-meta-texts">
                    <div className="chat-user-name-row">
                      <span className="chat-user-name">{selectedReview.customerName}</span>
                      <CheckCheck size={14} className="verified-icon" />
                    </div>
                    <span className="chat-status-sub">
                      {selectedReview.platform === 'whatsapp'
                        ? `${selectedReview.customerPhone || 'En ligne'} • Avis Certifié ✅`
                        : `${selectedReview.customerCity || 'Tunis'} • Discussion Officielle`}
                    </span>
                  </div>
                </div>

                <div className="chat-header-actions">
                  {selectedReview.platform === 'whatsapp' ? (
                    <WhatsAppLogo size={20} />
                  ) : (
                    <MessengerLogo size={20} />
                  )}
                </div>
              </div>

              {/* Body */}
              {selectedReview.screenshotUrl ? (
                <div style={{ padding: '1rem', background: '#050811' }}>
                  <img
                    src={selectedReview.screenshotUrl}
                    alt="Capture agrandie"
                    style={{ width: '100%', borderRadius: '16px', display: 'block' }}
                  />
                </div>
              ) : (
                <div
                  className={`phone-chat-body ${
                    selectedReview.platform !== 'whatsapp' ? 'fb-chat-body' : ''
                  }`}
                  style={{ minHeight: '320px', padding: '1.5rem 1.2rem' }}
                >
                  <div className="chat-security-banner">
                    🔒 Confirmation de commande & garantie officielle TechnoTech
                  </div>

                  {selectedReview.messages &&
                    selectedReview.messages.map((msg) => {
                      const isCustomer = msg.sender === 'customer';
                      const isWa = selectedReview.platform === 'whatsapp';
                      return (
                        <div
                          key={msg.id}
                          className={`chat-bubble-row ${isCustomer ? 'from-customer' : 'from-store'}`}
                        >
                          <div
                            className={`chat-bubble ${
                              isWa
                                ? isCustomer
                                  ? 'wa-customer-bubble'
                                  : 'wa-store-bubble'
                                : isCustomer
                                ? 'fb-customer-bubble'
                                : 'fb-store-bubble'
                            }`}
                          >
                            <span>{msg.text}</span>
                            <div className="chat-bubble-footer">
                              <span>{msg.time}</span>
                              {isWa && <CheckCheck size={14} className="double-tick" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Lightbox Footer Actions */}
            <div className="lightbox-actions-footer">
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedReview.productName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  {[...Array(selectedReview.rating || 5)].map((_, i) => (
                    <Star key={i} size={12} fill="#ffa502" color="#ffa502" />
                  ))}
                  <span style={{ fontSize: '0.72rem', color: '#ffa502', marginLeft: '4px', fontWeight: 700 }}>
                    5.0 / 5.0
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="lightbox-order-btn"
                onClick={() => {
                  setSelectedReview(null);
                  const el = document.getElementById('store-products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <ShoppingBag size={15} />
                <span>Commander ce service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          Modal: Ajouter un Avis Client (Admin ou Utilisateur)
          ========================================================================== */}
      {isAddModalOpen && (
        <div
          className="review-lightbox-backdrop"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="add-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-review-header">
              <h3 className="add-review-title">Ajouter un Avis Client</h3>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="add-review-form">
              <div className="form-group-field">
                <label>Plateforme :</label>
                <div className="platform-radio-row">
                  <div
                    className={`platform-radio-card ${
                      newReviewForm.platform === 'whatsapp' ? 'active-wa' : ''
                    }`}
                    onClick={() =>
                      setNewReviewForm((prev) => ({ ...prev, platform: 'whatsapp' }))
                    }
                  >
                    <WhatsAppLogo size={18} />
                    <span>WhatsApp</span>
                  </div>

                  <div
                    className={`platform-radio-card ${
                      newReviewForm.platform === 'facebook' ? 'active-fb' : ''
                    }`}
                    onClick={() =>
                      setNewReviewForm((prev) => ({ ...prev, platform: 'facebook' }))
                    }
                  >
                    <MessengerLogo size={18} />
                    <span>Facebook Messenger</span>
                  </div>
                </div>
              </div>

              <div className="form-group-field">
                <label>Nom du client :</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="Ex : Yassine Ben Salem"
                  value={newReviewForm.customerName}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group-field">
                <label>Produit acheté :</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="Ex : ChatGPT Plus ou Canva Pro"
                  value={newReviewForm.productName}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({ ...prev, productName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group-field">
                <label>Note attribuée :</label>
                <select
                  className="form-select-box"
                  value={newReviewForm.rating}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                  }
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Exceptionnel)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Très satisfait)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Satisfait)</option>
                </select>
              </div>

              <div className="form-group-field">
                <label>Message du client (texte de la discussion) :</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Ex : 3aslema khoya el compte yemchi 10/10 ya3tik essaha !"
                  value={newReviewForm.message}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>

              <div className="form-group-field">
                <label>Ou URL d'une capture d'écran (optionnel) :</label>
                <input
                  type="url"
                  className="form-input-text"
                  placeholder="https://.../capture-whatsapp.jpg"
                  value={newReviewForm.screenshotUrl}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({ ...prev, screenshotUrl: e.target.value }))
                  }
                />
              </div>

              <button type="submit" className="submit-review-btn">
                Publier cet avis sur le site
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
