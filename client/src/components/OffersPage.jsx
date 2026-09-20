import React from 'react';
import {
  Zap,
  ShieldCheck,
  Check,
  ShoppingBag,
  ArrowRight,
  Plus,
  Flame,
  Clock,
  MessageCircle,
  Gift,
  Sparkles
} from 'lucide-react';
import { getImageUrl } from '../config/api.js';
import { resolveOfferItemImage } from '../data/offersData.js';

export default function OffersPage({
  offers = [],
  products = [],
  onNavigate,
  onAddToCart,
  onOpenCart,
}) {
  const filteredOffers = offers.filter((offer) => offer.isActive);

  const handleOrderPack = (offer) => {
    if (!onAddToCart) return;
    const cartProduct = {
      id: `offer-${offer.id || offer._id}`,
      name: offer.title,
      price: offer.price,
      image: offer.image || '/images/logo.png',
      size: offer.duration || 'Pack Spécial',
      isOfferPack: true,
      offerItems: offer.items,
    };
    onAddToCart(cartProduct, offer.duration || 'Pack Spécial');
  };

  const getWhatsAppLink = (offer) => {
    const message = encodeURIComponent(
      `Bonjour TechnoTech ! 👋\nJe souhaite commander l'offre spéciale :\n✨ *${offer.title}*\n💰 Prix : *${offer.price} DT* (au lieu de ${offer.originalPrice || offer.price} DT)\n⏳ Durée : *${offer.duration || '1 Mois'}*\n\nPouvez-vous m'indiquer la procédure d'activation s'il vous plaît ?`
    );
    return `https://wa.me/21655123456?text=${message}`;
  };

  return (
    <div className="offers-page-root">
      {/* 1. Dark Top Section with Slanted / Angled Bottom */}
      <section className="offers-dark-hero-slanted">
        <div className="offers-hero-content-wrap">
          <h1 className="offers-main-title">
            Économisez Jusqu'à <span className="highlight-gradient">-50%</span> sur vos Abonnements
          </h1>

          <p className="offers-sub-title">
            Combinez deux abonnements officiels ou profitez de nos formules promotionnelles à tarif réduit. Activation ultra-rapide avec garantie totale.
          </p>

          {/* Reassurance Trust Pills */}
          <div className="offers-trust-pills">
            <div className="trust-pill">
              <Zap size={14} className="trust-icon zap" />
              <span>Activation en 15 Min</span>
            </div>
            <div className="trust-pill">
              <ShieldCheck size={14} className="trust-icon shield" />
              <span>Comptes 100% Officiels</span>
            </div>
            <div className="trust-pill">
              <Gift size={14} className="trust-icon gift" />
              <span>Packs 2-en-1 Avantageux</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. White Section Below with Offer Cards */}
      <section className="offers-white-body-section">
        {/* Offers Cards Grid */}
        <div className="offers-cards-container">
        {filteredOffers.length === 0 ? (
          <div className="offers-empty-state">
            <Sparkles size={48} color="#ff7828" />
            <h3>Aucune offre disponible dans cette catégorie pour le moment</h3>
            <p>Revenez bientôt ou découvrez tous nos produits dans le catalogue principal.</p>
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => onNavigate && onNavigate('/')}
            >
              Retour à la Boutique
            </button>
          </div>
        ) : (
          <div className="offers-grid">
            {filteredOffers.map((offer, index) => {
              const discountAmount =
                offer.originalPrice && offer.originalPrice > offer.price
                  ? offer.originalPrice - offer.price
                  : 0;
              const discountPercent =
                offer.originalPrice && offer.originalPrice > offer.price
                  ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
                  : null;

              return (
                <div
                  key={offer.id || offer._id || index}
                  className="offer-card"
                  style={{
                    '--card-accent-color': offer.bgColor || '#ff7828',
                  }}
                >
                  {/* Decorative Glow Orb */}
                  <div className="offer-card-glow" />

                  {/* Card Header: Badge & Duration */}
                  <div className="offer-card-header">
                    {offer.badge ? (
                      <span className="offer-badge-pill">
                        <Flame size={12} />
                        <span>{offer.badge}</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="offer-duration-pill">
                      <Clock size={11} />
                      <span>{offer.duration || '1 Mois'}</span>
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="offer-card-body">
                    <h2 className="offer-card-title">{offer.title}</h2>
                    {offer.subtitle && (
                      <p className="offer-card-subtitle">{offer.subtitle}</p>
                    )}

                    {/* Creative Fanned Product Deck (Matching user reference layout) */}
                    {offer.items && offer.items.length > 0 && (
                      <div className="offer-fanned-showcase-wrap">
                        <div className="offer-fanned-deck">
                          {offer.items.map((item, itemIdx) => {
                            const itemImg = resolveOfferItemImage(item, itemIdx, offer, products);
                            const totalItems = offer.items.length;
                            let fanPosClass = 'fan-single';
                            if (totalItems === 2) {
                              fanPosClass = itemIdx === 0 ? 'fan-left' : 'fan-right';
                            } else if (totalItems >= 3) {
                              fanPosClass =
                                itemIdx === 0
                                  ? 'fan-left'
                                  : itemIdx === 1
                                  ? 'fan-center'
                                  : 'fan-right';
                            }

                            const cleanName = item.split('(')[0].trim();

                            return (
                              <div
                                key={itemIdx}
                                className={`fanned-product-card ${fanPosClass}`}
                                title={item}
                              >
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

                          {/* Floating Central Plus Connector for Duo Packs */}
                          {offer.items.length === 2 && (
                            <div className="fanned-plus-connector" title="Pack Combiné">
                              <Plus size={13} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Detail text pills underneath the visual fan */}
                        <div className="fanned-items-legend">
                          {offer.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="fanned-legend-pill">
                              <span className="legend-check">
                                <Check size={10} strokeWidth={3} />
                              </span>
                              <span className="legend-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features / Guarantees Checklist */}
                    {offer.features && offer.features.length > 0 && (
                      <ul className="offer-features-list">
                        {offer.features.map((feat, featIdx) => (
                          <li key={featIdx} className="offer-feature-item">
                            <Check size={12} className="feature-check" strokeWidth={3} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Card Footer: Pricing & Actions */}
                  <div className="offer-card-footer">
                    <div className="offer-pricing-box">
                      <div className="offer-price-row">
                        <span className="offer-main-price">{offer.price}</span>
                        <span className="offer-currency">DT</span>
                        {offer.originalPrice && offer.originalPrice > offer.price && (
                          <span className="offer-original-price">
                            {offer.originalPrice} DT
                          </span>
                        )}
                      </div>

                      {discountPercent && (
                        <div className="offer-savings-tag">
                          <span>Économisez {discountAmount} DT</span>
                          <strong>(-{discountPercent}%)</strong>
                        </div>
                      )}
                    </div>

                    <div className="offer-action-buttons">
                      <button
                        type="button"
                        className="offer-order-btn"
                        onClick={() => handleOrderPack(offer)}
                      >
                        <ShoppingBag size={15} />
                        <span>Commander ce Pack</span>
                      </button>

                      <a
                        href={getWhatsAppLink(offer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="offer-whatsapp-btn"
                        title="Commander directement sur WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
