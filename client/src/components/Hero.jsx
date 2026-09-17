import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Check, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { INITIAL_HERO_SLIDES } from '../data/productsData.js';
import { getImageUrl } from '../config/api.js';

export default function Hero({
  slides = [],
  activeSlideIndex = 0,
  onSlideChange,
  products = [],
  onAddToCart,
}) {
  const activeSlides = slides && slides.length > 0 ? slides : INITIAL_HERO_SLIDES;
  const safeIndex = activeSlideIndex >= 0 && activeSlideIndex < activeSlides.length ? activeSlideIndex : 0;
  const currentSlide = activeSlides[safeIndex];

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingIndex, setOutgoingIndex] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedSize, setSelectedSize] = useState('36');
  const stageRef = useRef(null);
  const activeThumbnailRef = useRef(null);
  const thumbnailsTrackRef = useRef(null);

  useEffect(() => {
    if (thumbnailsTrackRef.current && activeThumbnailRef.current) {
      const track = thumbnailsTrackRef.current;
      const card = activeThumbnailRef.current;
      const targetScroll = card.offsetLeft - track.clientWidth / 2 + card.clientWidth / 2;
      track.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
    // Safeguard: Ensure the page/window itself never scrolls horizontally
    if (window.scrollX !== 0) {
      window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
    }
  }, [safeIndex]);

  // Match the slide with its product in catalogue if available (for duration plans and real-time sync)
  const currentProduct = products.find(
    (p) =>
      (p._id && (p._id === currentSlide.productId || p._id === currentSlide.id)) ||
      (p.id && (p.id === currentSlide.productId || p.id === currentSlide.id)) ||
      (p.name && currentSlide.name && p.name.trim().toLowerCase() === currentSlide.name.trim().toLowerCase())
  );

  const plans = currentProduct?.plans || currentSlide.plans || [];
  const activePlan = plans.find((p) => (p.id || p.duration) === selectedPlanId) || (plans.length > 0 ? plans[0] : null);
  const displayPrice = activePlan ? activePlan.price : (currentProduct?.price !== undefined ? currentProduct.price : currentSlide.price);
  const displayOriginalPrice = currentProduct?.originalPrice !== undefined ? currentProduct.originalPrice : currentSlide.originalPrice;
  const displayName = currentProduct?.name || currentSlide.name;
  const displayDesc = currentProduct?.description || currentSlide.description;
  const displayImage = getImageUrl(currentSlide.image || (currentProduct?.images && currentProduct.images[0]) || '/images/logo.png');

  const discountPercent =
    displayOriginalPrice && displayOriginalPrice > displayPrice
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      : null;
  const savingsAmount =
    displayOriginalPrice && displayOriginalPrice > displayPrice
      ? Number((displayOriginalPrice - displayPrice).toFixed(1).replace('.0', ''))
      : null;
  const activeColor = currentSlide?.bgColor || '#e25816';
  const isApparel = currentProduct?.category === 'apparel' || currentSlide?.category === 'apparel';

  // Smart concise brand title for carousel preview
  const getThumbnailLabel = (name) => {
    if (!name) return '';
    return name
      .replace(/^official\s+/i, '')
      .replace(/—.*$/, '')
      .replace(/\s+ultra\s+4k/i, '')
      .replace(/\s+admin\s+panel.*$/i, '')
      .trim();
  };

  // Mouse tilt parallax for 3D showcase feel
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / rect.height) * -12;
    const tiltY = (x / rect.width) * 12;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const sizes = ['36', '38', '40', '42'];

  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Auto-play carousel every 3 seconds until manual user interaction
  useEffect(() => {
    if (!autoPlayEnabled || isTransitioning || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (safeIndex + 1) % activeSlides.length;
      triggerSlideSwitch(nextIndex, false);
    }, 3000);

    return () => clearInterval(timer);
  }, [autoPlayEnabled, isTransitioning, safeIndex, activeSlides.length]);

  const triggerSlideSwitch = (targetIndex, isManual = false) => {
    if (isTransitioning || targetIndex === safeIndex) return;
    if (isManual) {
      setAutoPlayEnabled(false);
    }
    setOutgoingIndex(safeIndex);
    setIsTransitioning(true);
    if (onSlideChange) {
      onSlideChange(targetIndex);
    }
  };

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setOutgoingIndex(null);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handlePrev = () => {
    const prevIndex = (safeIndex - 1 + activeSlides.length) % activeSlides.length;
    triggerSlideSwitch(prevIndex, true);
  };

  const handleNext = () => {
    const nextIndex = (safeIndex + 1) % activeSlides.length;
    triggerSlideSwitch(nextIndex, true);
  };

  const outgoingSlide = outgoingIndex !== null ? activeSlides[outgoingIndex] : null;

  const handleOrderClick = () => {
    if (!onAddToCart) return;
    const optionName = activePlan ? activePlan.duration : (isApparel ? selectedSize : 'Standard');
    const cartProduct = {
      id: `${currentSlide.productId || currentSlide.id}-${optionName}`,
      name: `${displayName} ${activePlan ? `(${activePlan.duration})` : ''}`,
      price: displayPrice,
      image: displayImage,
      size: optionName,
    };
    onAddToCart(cartProduct, optionName);
  };

  return (
    <main className="hero-grid">
      {/* Left Column */}
      <section className="hero-left">
        {/* Navigation Arrows */}
        <div className="carousel-arrows" aria-label="Contrôles du carrousel">
          <button
            type="button"
            className="arrow-btn"
            onClick={handlePrev}
            disabled={isTransitioning}
            aria-label="Produit précédent"
            title="Précédent"
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="arrow-btn"
            onClick={handleNext}
            disabled={isTransitioning}
            aria-label="Produit suivant"
            title="Suivant"
          >
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Dynamic Product Headline from Product Data */}
        <h1 className="hero-title">
          <span>{displayName}</span>
        </h1>

        {/* Narrative Description Copy from Product Data */}
        <p className="hero-description">
          {displayDesc ||
            "Votre plateforme d'excellence pour acquérir les meilleurs abonnements officiels et produits digitaux authentiques avec activation immédiate et garantie totale."}
        </p>

        {/* CTA Button */}
        <button
          type="button"
          className="cta-button"
          onClick={handleOrderClick}
          id="get-the-look-btn"
        >
          <span>COMMANDER MAINTENANT</span>
          <ArrowRight size={17} strokeWidth={2.8} className="cta-arrow" />
        </button>
      </section>

      {/* Center 3D Floating Showcase with Gradual Fade-out & Fade-in */}
      <section
        className="hero-center"
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="jacket-stage">
          <div
            className="jacket-image-wrapper"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            {/* Outgoing product: gradually fades out while floating upward */}
            {isTransitioning && outgoingSlide && (
              <img
                key={`outgoing-${outgoingSlide.id || outgoingSlide.name}`}
                src={getImageUrl(outgoingSlide.image)}
                alt={outgoingSlide.name}
                className="hero-jacket-img jacket-fade-exit"
                draggable="false"
              />
            )}

            {/* Incoming product: gradually fades in while floating up from below */}
            <img
              key={`current-${currentSlide.id || currentSlide.name}-${displayImage ? displayImage.slice(-20) : ''}`}
              src={displayImage}
              alt={displayName}
              className={`hero-jacket-img ${isTransitioning ? 'jacket-fade-enter' : 'jacket-idle'}`}
              draggable="false"
            />
          </div>

          {/* Floating dynamic floor shadow synced with transition */}
          <div
            className={`jacket-shadow ${isTransitioning ? 'transitioning' : ''}`}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Right Column (Showcase Configurator & Fast Carousel Switcher) */}
      <section className="hero-right">
        <div className="hero-control-card" style={{ '--slide-accent': activeColor }}>
          {/* 1. Header / Price Badge Area */}
          <div className="hero-price-panel">
            <div className="hero-badge-status">
              <span className="pulse-dot" style={{ backgroundColor: activeColor }} />
              <span className="status-label">EN STOCK • ACTIVATION IMMÉDIATE</span>
            </div>

            <div className="price-main-row">
              <div className="current-price-group">
                <span className="current-price">{displayPrice}</span>
                <span className="currency-unit">DT</span>
              </div>

              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <div className="original-price-group">
                  <span className="original-price">{displayOriginalPrice} DT</span>
                  {discountPercent && (
                    <span
                      className="discount-pill"
                      style={{ background: `linear-gradient(135deg, ${activeColor}, #ff8c00)` }}
                    >
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {savingsAmount && savingsAmount > 0 && (
              <div className="savings-badge">
                <Sparkles size={13} className="sparkle-icon" />
                <span>Économisez {savingsAmount} DT sur cette offre</span>
              </div>
            )}
          </div>

          <div className="hero-card-divider" />

          {/* 2. Options: Plans or Key Guarantees */}
          {plans.length > 0 ? (
            <div className="plan-selection-group">
              <div className="group-header">
                <div className="group-label-wrap">
                  <span className="group-label-dot" />
                  <span className="group-label">Choisir votre formule</span>
                </div>
                {activePlan && (
                  <span className="active-plan-badge">
                    {activePlan.duration}
                  </span>
                )}
              </div>
              <div className="plan-chips-grid" role="radiogroup" aria-label="Durées d'abonnement disponibles">
                {plans.map((plan) => {
                  const isSelected = (activePlan?.id || activePlan?.duration) === (plan.id || plan.duration);
                  return (
                    <button
                      key={plan.id || plan.duration}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`plan-chip-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id || plan.duration)}
                    >
                      <div className={`plan-radio-circle ${isSelected ? 'selected' : ''}`}>
                        {isSelected && <Check size={10} strokeWidth={3.5} />}
                      </div>
                      <span className="plan-chip-duration">{plan.duration}</span>
                      {plan.price && (
                        <div className="plan-chip-price-wrap">
                          <span className="plan-chip-price-val">{plan.price}</span>
                          <span className="plan-chip-currency">DT</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isApparel ? (
            <div className="plan-selection-group">
              <div className="group-header">
                <span className="group-label">Choisissez votre taille</span>
                <span className="active-plan-badge">Taille {selectedSize}</span>
              </div>
              <div className="size-chips-row" role="radiogroup" aria-label="Tailles disponibles">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={selectedSize === size}
                    className={`size-chip-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Digital product without multiple plans: Showcase trust & features */
            <div className="plan-selection-group">
              <div className="group-header">
                <span className="group-label">Avantages inclus</span>
                <span className="active-plan-badge">100% Officiel</span>
              </div>
              <div className="feature-benefits-list">
                <div className="feature-benefit-chip">
                  <Zap size={14} className="benefit-icon" />
                  <span>Livraison & activation instantanée</span>
                </div>
                <div className="feature-benefit-chip">
                  <ShieldCheck size={14} className="benefit-icon" />
                  <span>Compte privé avec garantie totale</span>
                </div>
              </div>
            </div>
          )}

          <div className="hero-card-divider" />

          {/* 3. Carousel Fast Switcher */}
          <div className="carousel-switcher-group">
            <div className="group-header">
              <span className="group-label">Sélection du Carrousel</span>
              <div className="carousel-header-controls">
                <span className="carousel-counter-badge">
                  {String(safeIndex + 1).padStart(2, '0')} / {String(activeSlides.length).padStart(2, '0')}
                </span>
                <div className="carousel-mini-arrows">
                  <button
                    type="button"
                    className="mini-arrow-btn"
                    onClick={handlePrev}
                    disabled={isTransitioning}
                    title="Précédent"
                    aria-label="Produit précédent"
                  >
                    <ChevronLeft size={13} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    className="mini-arrow-btn"
                    onClick={handleNext}
                    disabled={isTransitioning}
                    title="Suivant"
                    aria-label="Produit suivant"
                  >
                    <ChevronRight size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>

            <div className="carousel-thumbnails-track" ref={thumbnailsTrackRef}>
              {activeSlides.map((slide, index) => {
                const matchingProd = products.find(
                  (p) =>
                    (p._id && (p._id === slide.productId || p._id === slide.id)) ||
                    (p.id && (p.id === slide.productId || p.id === slide.id)) ||
                    (p.name && slide.name && p.name.trim().toLowerCase() === slide.name.trim().toLowerCase())
                );
                const rawName = matchingProd?.name || slide.name;
                const thumbTitle = getThumbnailLabel(rawName);
                const thumbImg = getImageUrl(slide.image || (matchingProd?.images && matchingProd.images[0]) || '/images/logo.png');
                const isActive = index === safeIndex;
                const cardAccent = slide.bgColor || '#ff5e00';

                return (
                  <button
                    key={slide.id || index}
                    ref={isActive ? activeThumbnailRef : null}
                    type="button"
                    className={`modern-carousel-card ${isActive ? 'active' : ''}`}
                    style={
                      isActive
                        ? {
                            borderColor: `${cardAccent}cc`,
                            boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 20px -2px ${cardAccent}55`,
                          }
                        : {}
                    }
                    onClick={() => triggerSlideSwitch(index, true)}
                    disabled={isTransitioning || isActive}
                    title={isActive ? `Actuel : ${rawName}` : `Passer à ${rawName}`}
                    aria-label={isActive ? `Actuel : ${rawName}` : `Passer à ${rawName}`}
                  >
                    <div className="thumbnail-mockup-wrapper">
                      <img
                        key={`thumb-img-${slide.id || index}-${thumbImg ? thumbImg.slice(-20) : ''}`}
                        src={thumbImg}
                        alt={thumbTitle}
                        className="modern-thumbnail-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="modern-card-details">
                      <span className="modern-card-title">{thumbTitle}</span>
                      {isActive && (
                        <span
                          className="card-active-dot"
                          style={{ backgroundColor: cardAccent }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subtle pagination indicator dots */}
            <div className="carousel-nav-dots" aria-hidden="true">
              {activeSlides.map((slide, idx) => (
                <span
                  key={idx}
                  className={`carousel-nav-dot ${idx === safeIndex ? 'active' : ''}`}
                  style={idx === safeIndex ? { backgroundColor: slide.bgColor || '#ff5e00' } : {}}
                  onClick={() => triggerSlideSwitch(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
