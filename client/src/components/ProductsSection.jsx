import React, { useState } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check, Zap, ShieldCheck } from 'lucide-react';
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

  const handlePrevImage = (productId, imagesLength, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[productId] || 0;
      return {
        ...prev,
        [productId]: (current - 1 + imagesLength) % imagesLength,
      };
    });
  };

  const handleNextImage = (productId, imagesLength, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[productId] || 0;
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
              const images = product.images && product.images.length > 0
                ? product.images.map(getImageUrl).filter(Boolean)
                : [];
              const currentImgIndex = activeImageIndexes[product.id] || 0;
              const activeImage = images[currentImgIndex] || images[0] || '';

              // Determine active plan and dynamic price
              const activePlan =
                selectedPlans[product.id] ||
                (product.plans && product.plans.length > 0 ? product.plans[0] : null);
              const displayPrice = activePlan ? activePlan.price : product.price;

              // Calculate discount if originalPrice exists
              const discountPercent =
                product.originalPrice && product.originalPrice > displayPrice
                  ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
                  : null;
              const productId = product._id || product.id;

              return (
                <article key={productId} className="white-product-card full-card-image-card">
                  {/* Full background image layer with professional skeleton loader */}
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

                    {/* Image Carousel Controls if multiple images exist */}
                    {images.length > 1 && (
                      <div className="card-image-nav">
                        <button
                          type="button"
                          className="image-nav-arrow prev"
                          onClick={(e) => handlePrevImage(productId, images.length, e)}
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
                          onClick={(e) => handleNextImage(productId, images.length, e)}
                          title="Image suivante"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Spacer so the upper visual area remains highlighted */}
                  <div className="card-image-spacer" />

                  {/* Card Body Information */}
                  <div className="card-body-details">
                    <h3 className="card-product-title">{product.name}</h3>
                    <p className="card-product-desc">{product.description}</p>

                    {/* Dynamic Subscription Duration / Options Selector */}
                    {product.plans && product.plans.length > 0 && (
                      <div className="card-plans-group">
                        <span className="plans-label">Durée de l'abonnement :</span>
                        <div className="plans-buttons-row">
                          {product.plans.map((plan) => {
                            const isSelected = activePlan?.id === plan.id || activePlan?.duration === plan.duration;
                            return (
                              <button
                                key={plan.id || plan.duration}
                                type="button"
                                className={`plan-choice-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectPlan(productId, plan)}
                              >
                                {isSelected && <Check size={13} className="check-icon" />}
                                <span>{plan.duration}</span>
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
                          <span className="main-price-val">{displayPrice}</span>
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
