import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { getImageUrl } from '../config/api.js';

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleExploreOffers = () => {
    onClose();
    const section = document.getElementById('store-products-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        className={`cart-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Panier d'achats"
      >
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title-wrap">
            <div className="cart-title-icon-box">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="cart-title">Mon Panier</h2>
              <span className="cart-item-count">
                {totalQuantity === 0
                  ? '0 article'
                  : `${totalQuantity} article${totalQuantity > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Fermer le panier"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {items.length === 0 ? (
            <div className="empty-cart-container">
              <div className="empty-cart-circle">
                <ShoppingBag size={36} strokeWidth={1.6} />
              </div>
              <h3 className="empty-cart-title">Votre panier est vide</h3>
              <p className="empty-cart-subtitle">
                Explorez nos abonnements officiels et produits digitaux authentiques avec activation immédiate.
              </p>
              <button
                type="button"
                className="empty-cart-cta-btn"
                onClick={handleExploreOffers}
              >
                <span>Explorer les offres</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="cart-item-card">
                <div className="cart-item-img-wrap">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="cart-item-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/logo.png';
                    }}
                  />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-pill">
                    <Zap size={11} className="item-zap" />
                    <span>{item.size || 'Abonnement'} &bull; Activation Immédiate</span>
                  </div>
                  <div className="cart-item-bottom">
                    <span className="cart-item-price">
                      {item.price * item.quantity} DT
                    </span>

                    {/* Quantity Stepper */}
                    <div className="cart-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => onUpdateQuantity(item.id, item.size, -1)}
                        aria-label="Diminuer la quantité"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="stepper-count">{item.quantity}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => onUpdateQuantity(item.id, item.size, 1)}
                        aria-label="Augmenter la quantité"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="cart-delete-btn"
                  onClick={() => onRemoveItem(item.id, item.size)}
                  title="Supprimer l'article"
                  aria-label={`Supprimer ${item.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-trust-guarantee">
              <ShieldCheck size={14} className="trust-icon" />
              <span>Paiement sécurisé &bull; Activation instantanée 100% garantie</span>
            </div>

            <div className="cart-total-row">
              <span className="subtotal-label">Total de la commande</span>
              <span className="subtotal-value">{subtotal} DT</span>
            </div>

            <button
              type="button"
              className="checkout-btn"
              onClick={onCheckout}
            >
              <span>COMMANDER &bull; {subtotal} DT</span>
              <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
