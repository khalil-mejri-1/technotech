import React, { useState } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check, Zap, ShieldCheck, Clock } from 'lucide-react';
import { getImageUrl } from '../config/api.js';
import CardImageWithSkeleton from './CardImageWithSkeleton.jsx';

export default function ProductsSection({ products, onAddToCart }) {
  // Store selected duration plan for each product ID
  const [selectedPlans, setSelectedPlans] = useState({});
  // Store active image index for each product ID
  const [activeImageIndexes, setActiveImageIndexes] = useState({});

  const handleSelectPlan = (productId, plan) => {
    setSelectedPlans((prev) => ({
      ...prev,
      [productId]: plan,
    }));
  };

  const handlePrevImage = (productId, imagesLength, defaultIdx = 0, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[productId] !== undefined ? prev[productId] : defaultIdx;
      return {
        ...prev,
        [productId]: (current - 1 + imagesLength) % imagesLength,
      };
    });
  };

  const handleNextImage = (productId, imagesLength, defaultIdx = 0, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[productId] !== undefined ? prev[productId] : defaultIdx;
      return {
        ...prev,
        [productId]: (current + 1) % imagesLength,
      };
    });
  };

  return (
    <section className="products-showcase-wrapper" id="store-products-section">
      {/* 10-Degree Angled Geometric Divider between Hero and Products Section */}
      <div className="section-angled-divider" aria-hidden="true">
        <svg
          viewBox="0 0 1000 176.33"
          preserveAspectRatio="none"
          className="angled-divider-svg"
        >
          <polygon points="0,176.33 1000,0 1000,176.33" fill="#ffffff" />
        </svg>
      </div>

      {/* Main Section Content on Crisp White Background */}
      <div className="white-section-container">
        <div className="white-section-content">
          {/* Header Section */}
          <div className="section-header-area">
            <div className="section-badge-pill">
              <Zap size={14} className="icon-pulse" />
              <span>PRODUITS DIGITAUX & ABONNEMENTS OFFICIELS</span>
            </div>
            <h2 className="section-main-heading">
              Choisissez votre abonnement ou produit digital
            </h2>
            <p className="section-sub-heading">
              Activation immédiate en quelques minutes avec garantie totale et support technique 24/7 aux meilleurs tarifs officiels.
            </p>
          </div>

          {/* Side-by-Side Products Grid */}
          <div className="products-cards-grid">
            {products.map((product) => {
              const productId = product._id || product.id;
              const images = product.images && product.images.length > 0
                ? product.images.map(getImageUrl).filter(Boolean)
                : [];

              // Check if product is set to single image mode
              const isSingleMode = product.displayMode === 'single';

              // Default index chosen by admin
              const defaultIndex =
                typeof product.selectedImageIndex === 'number' &&
                product.selectedImageIndex >= 0 &&
                product.selectedImageIndex < images.length
                  ? product.selectedImageIndex
                  : 0;

              // If single mode, always display the admin-selected image
              // If carousel mode, display the active index (initialized to defaultIndex)
              const currentImgIndex = isSingleMode
                ? defaultIndex
                : (activeImageIndexes[productId] !== undefined ? activeImageIndexes[productId] : defaultIndex);

              const activeImage = images[currentImgIndex] || images[0] || '';

              // Determine active plan and dynamic price
              const activePlan =
                selectedPlans[productId] ||
                (product.plans && product.plans.length > 0 ? product.plans[0] : null);
              const displayPrice = activePlan ? activePlan.price : product.price;

              // Calculate discount if originalPrice exists
              const discountPercent =
                product.originalPrice && product.originalPrice > displayPrice
                  ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
                  : null;

              return (
                <article key={productId} className="white-product-card split-product-card">
                  {/* Top Dedicated Image Section */}
                  <div className="card-image-section">
                    <CardImageWithSkeleton
                      src={activeImage}
                      alt={product.name}
                      className="card-featured-img"
                    />

                    {/* Top Floating Controls: Badge and Carousel Navigation */}
                    <div className="card-top-controls">
                      {product.badge ? (
                        <span className="card-top-badge">{product.badge}</span>
                      ) : (
                        <span />
                      )}

                      {/* Image Carousel Controls: Only if multiple images exist AND NOT in single-image mode */}
                      {!isSingleMode && images.length > 1 && (
                        <div className="card-image-nav">
                          <button
                            type="button"
                            className="image-nav-arrow prev"
                            onClick={(e) => handlePrevImage(productId, images.length, defaultIndex, e)}
                            title="Image précédente"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <div className="image-dots">
                            {images.map((_, idx) => (
                              <span
                                key={idx}
                                className={`dot ${idx === currentImgIndex ? 'active' : ''}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            className="image-nav-arrow next"
                            onClick={(e) => handleNextImage(productId, images.length, defaultIndex, e)}
                            title="Image suivante"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Subtle Angled Geometric Separator (ماءل قليلا) */}
                    <div className="card-angled-divider" aria-hidden="true">
                      <svg
                        viewBox="0 0 100 16"
                        preserveAspectRatio="none"
                        className="card-angled-svg"
                      >
                        <defs>
                          <linearGradient id={`card-angle-glow-${productId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                            <stop offset="35%" stopColor="rgba(255, 120, 40, 0.65)" />
                            <stop offset="65%" stopColor="#ff7828" />
                            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.12)" />
                          </linearGradient>
                        </defs>
                        <polygon points="0,16 100,0 100,16" fill="#0b1329" />
                        <line
                          x1="0"
                          y1="16"
                          x2="100"
                          y2="0"
                          stroke={`url(#card-angle-glow-${productId})`}
                          strokeWidth="1.4"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Card Body Information */}
                  <div className="card-body-details">
                    <h3 className="card-product-title">{product.name}</h3>
                    <p className="card-product-desc">{product.description}</p>

                    {/* Dynamic Subscription Duration / Options Selector */}
                    {product.plans && product.plans.length > 0 && (
                      <div className="card-plans-group">
                        <div className="plans-header-row">
                          <span className="plans-label">
                            <Clock size={12} className="plans-clock-icon" />
                            <span>Durée de l'abonnement :</span>
                          </span>
                          {activePlan?.duration && (
                            <span className="plans-active-tag">
                              {activePlan.duration}
                            </span>
                          )}
                        </div>
                        <div className="plans-buttons-row">
                          {product.plans.map((plan, idx) => {
                            const planKey = plan.id || plan._id || `plan-${idx}`;
                            const isSelected = Boolean(
                              activePlan && (
                                (plan.id && activePlan.id && activePlan.id === plan.id) ||
                                (plan._id && activePlan._id && activePlan._id === plan._id) ||
                                (activePlan.duration && activePlan.duration === plan.duration)
                              )
                            );
                            return (
                              <button
                                key={planKey}
                                type="button"
                                className={`plan-choice-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectPlan(productId, plan)}
                                title={`Choisir ${plan.duration} — ${plan.price} DT`}
                              >
                                <span className="plan-chip-content">
                                  <span className={`plan-indicator-dot ${isSelected ? 'active' : ''}`}>
                                    {isSelected && <Check size={10} strokeWidth={3.5} />}
                                  </span>
                                  <span className="plan-dur-name">{plan.duration}</span>
                                </span>
                                {plan.price !== undefined && (
                                  <span className={`plan-dur-price-pill ${isSelected ? 'selected' : ''}`}>
                                    {plan.price} DT
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Price & Add to Cart Area */}
                    <div className="card-footer-action">
                      <div className="pricing-stack">
                        <div className="current-price-row">
                          <span key={`price-${productId}-${displayPrice}`} className="main-price-val price-pop-anim">
                            {displayPrice}
                          </span>
                          <span className="currency-symbol">DT</span>
                        </div>
                        {product.originalPrice && product.originalPrice > displayPrice && (
                          <div className="original-price-row">
                            <span className="struck-price">{product.originalPrice} DT</span>
                            {discountPercent && (
                              <span className="save-badge">-{discountPercent}%</span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="card-add-cart-btn"
                        onClick={() => {
                          const cartProduct = {
                            id: `${productId}-${activePlan?.duration || 'std'}`,
                            name: `${product.name} ${activePlan ? `(${activePlan.duration})` : ''}`,
                            price: displayPrice,
                            image: activeImage,
                            size: activePlan?.duration || 'Standard',
                          };
                          onAddToCart(cartProduct, activePlan?.duration || 'Standard');
                        }}
                      >
                        <ShoppingBag size={18} />
                        <span>Commander</span>
                      </button>
                    </div>

                    {/* Trust guarantee badge */}
                    <div className="card-guarantee-note">
                      <ShieldCheck size={14} color="#10b981" />
                      <span>Activation officielle garantie avec support réactif</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
