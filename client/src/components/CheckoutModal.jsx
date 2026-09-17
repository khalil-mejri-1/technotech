import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import { getImageUrl } from '../config/api.js';
import { orderService } from '../services/orderService.js';

const TUNISIAN_GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Sousse',
  'Sfax',
  'Monastir',
  'Bizerte',
  'Mahdia',
  'Kairouan',
  'Kasserine',
  'Gafsa',
  'Gabès',
  'Médenine',
  'Tataouine',
  'Béja',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Sidi Bouzid',
  'Tozeur',
  'Kébili',
  'Zaghouan',
];

export default function CheckoutModal({
  isOpen,
  onClose,
  items = [],
  onOrderSuccess,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Tunis');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation States
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [formError, setFormError] = useState(null);
  const [shakeField, setShakeField] = useState(null);

  // Success Screen State
  const [placedOrder, setPlacedOrder] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setPlacedOrder(null);
      setShakeField(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  // --- Strict Validation Logic ---
  // 1. Name: Required, NO digits allowed, at least 2 characters
  const hasDigitsInName = /\d/.test(name);
  const isNameEmpty = !name.trim();
  const isNameValid = !isNameEmpty && !hasDigitsInName && name.trim().length >= 2;

  // 2. Phone: Required, strictly 8 digits
  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneEmpty = !phone.trim();
  const isPhoneValid = cleanPhone.length === 8;

  const handlePhoneChange = (e) => {
    // Only accept numeric inputs, max 8 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPhone(digitsOnly);
    if (formError) setFormError(null);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (formError) setFormError(null);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });

    // Validate Name
    if (isNameEmpty) {
      setFormError('Le nom et prénom sont obligatoires pour la confirmation.');
      triggerShake('name');
      return;
    }
    if (hasDigitsInName) {
      setFormError('Le nom ne doit contenir AUCUN chiffre (lettres uniquement).');
      triggerShake('name');
      return;
    }
    if (name.trim().length < 2) {
      setFormError('Veuillez renseigner un nom complet valide.');
      triggerShake('name');
      return;
    }

    // Validate Phone
    if (isPhoneEmpty) {
      setFormError('Le numéro de téléphone est obligatoire.');
      triggerShake('phone');
      return;
    }
    if (cleanPhone.length !== 8) {
      setFormError(
        `Le numéro de téléphone doit comporter exactement 8 chiffres (actuel : ${cleanPhone.length}/8).`
      );
      triggerShake('phone');
      return;
    }

    if (items.length === 0) {
      setFormError('Votre panier est vide. Veuillez ajouter au moins un produit.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const orderPayload = {
        customerName: name.trim(),
        customerPhone: cleanPhone,
        customerCity: city,
        customerAddress: address.trim(),
        customerNotes: notes.trim(),
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          image: it.image,
          size: it.size || 'Standard',
          price: it.price,
          quantity: it.quantity,
        })),
        totalAmount,
        paymentMethod: 'Paiement à la livraison / Virement',
      };

      const savedOrder = await orderService.create(orderPayload);
      setPlacedOrder(savedOrder);
      if (onOrderSuccess) {
        onOrderSuccess(savedOrder);
      }
    } catch (err) {
      console.error('Erreur soumission commande :', err);
      setFormError(err.message || 'Impossible de finaliser la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = (fieldName) => {
    setShakeField(fieldName);
    setTimeout(() => setShakeField(null), 700);
  };

  // WhatsApp confirmation url
  const getWhatsAppLink = () => {
    if (!placedOrder) return '#';
    const storePhone = '21698123456'; // Official store contact
    const itemsSummary = items
      .map((i) => `• ${i.name} (${i.size}) x${i.quantity}`)
      .join('%0A');
    const msg = `Bonjour TechnoTech,%0A%0AJe souhaite confirmer ma commande *${placedOrder.orderNumber}* :%0A${itemsSummary}%0A%0A*Total :* ${totalAmount} DT%0A*Nom :* ${name}%0A*Tél :* ${cleanPhone}%0A*Ville :* ${city}`;
    return `https://wa.me/${storePhone}?text=${msg}`;
  };

  return (
    <div className="checkout-modal-backdrop" onClick={onClose}>
      <div
        className="checkout-modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          className="checkout-close-btn"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* -------------------------------------------------------------
            STATE 1: SUCCESS CONFIRMATION SCREEN
            ------------------------------------------------------------- */}
        {placedOrder ? (
          <div className="order-success-container">
            <div className="success-icon-badge">
              <CheckCircle2 size={54} className="success-check-animated" />
            </div>

            <div className="success-header">
              <span className="success-tag">COMMANDE ENREGISTRÉE AVEC SUCCÈS</span>
              <h2 className="success-title">Merci pour votre commande !</h2>
              <p className="success-subtitle">
                Votre demande a été transmise instantanément à notre équipe.
              </p>
            </div>

            {/* Order Reference Card */}
            <div className="order-ref-card">
              <div className="order-ref-row">
                <span className="order-ref-label">Référence Commande :</span>
                <span className="order-ref-code">{placedOrder.orderNumber}</span>
              </div>
              <div className="order-ref-row">
                <span className="order-ref-label">Client :</span>
                <span className="order-ref-value">{placedOrder.customerName}</span>
              </div>
              <div className="order-ref-row">
                <span className="order-ref-label">Téléphone :</span>
                <span className="order-ref-value">+216 {placedOrder.customerPhone}</span>
              </div>
              <div className="order-ref-row highlight">
                <span className="order-ref-label">Montant Total :</span>
                <span className="order-ref-total">{placedOrder.totalAmount} DT</span>
              </div>
            </div>

            {/* Direct WhatsApp Follow-up CTA */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-confirm-btn"
            >
              <MessageCircle size={20} />
              <span>Confirmer sur WhatsApp (Recommandé)</span>
              <ArrowRight size={17} />
            </a>

            <button
              type="button"
              className="continue-shopping-btn"
              onClick={onClose}
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          /* -------------------------------------------------------------
             STATE 2: ORDER FORM WITH STRICT VALIDATION
             ------------------------------------------------------------- */
          <div className="checkout-content-grid">
            {/* Header */}
            <div className="checkout-header-banner">
              <div className="checkout-badge-pill">
                <ShieldCheck size={15} />
                <span>COMMANDE SÉCURISÉE SANS CARTE</span>
              </div>
              <h2 className="checkout-title">Finaliser votre commande</h2>
              <p className="checkout-desc">
                Remplissez vos coordonnées ci-dessous pour recevoir votre abonnement ou produit digital.
              </p>
            </div>

            {/* Professional Alert Banner (Displayed when validation fails) */}
            {formError && (
              <div className="professional-error-alert animate-shake">
                <div className="error-alert-icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="error-alert-content">
                  <span className="error-alert-title">Attention requise</span>
                  <p className="error-alert-text">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="checkout-form" noValidate>
              {/* Order Items Preview */}
              <div className="checkout-items-preview">
                <div className="preview-label-row">
                  <span className="preview-label">
                    <ShoppingBag size={15} /> Articles commandés ({items.length})
                  </span>
                  <span className="preview-total-badge">{totalAmount} DT</span>
                </div>
                <div className="preview-items-scroll">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="preview-item-row">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="preview-item-thumb"
                      />
                      <div className="preview-item-info">
                        <span className="preview-item-name">{item.name}</span>
                        <span className="preview-item-sub">
                          {item.size || 'Standard'} &bull; Qté: {item.quantity}
                        </span>
                      </div>
                      <span className="preview-item-price">
                        {(Number(item.price) || 0) * (Number(item.quantity) || 1)} DT
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FIELD 1: Customer Name */}
              <div
                className={`checkout-field-group ${
                  shakeField === 'name' ? 'field-shake' : ''
                }`}
              >
                <label className="checkout-label" htmlFor="customer-name">
                  <span>Nom complet (الاسم واللقب)</span>
                  <span className="required-star">*</span>
                </label>
                <div
                  className={`checkout-input-wrapper ${
                    touched.name && !isNameValid ? 'has-error' : ''
                  } ${touched.name && isNameValid ? 'is-valid' : ''}`}
                >
                  <User size={18} className="field-icon" />
                  <input
                    id="customer-name"
                    type="text"
                    className="checkout-input"
                    placeholder="Ex: Mohamed Ali"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                    autoComplete="name"
                    required
                  />
                  {touched.name && isNameValid && (
                    <span className="validation-pill valid">
                      <CheckCircle2 size={13} /> Valide
                    </span>
                  )}
                </div>

                {/* Name Validation Hints */}
                {touched.name && hasDigitsInName && (
                  <div className="field-error-notice">
                    <AlertTriangle size={13} />
                    <span>Le nom ne doit comporter aucun chiffre (lettres uniquement).</span>
                  </div>
                )}
                {touched.name && isNameEmpty && (
                  <div className="field-error-notice">
                    <AlertTriangle size={13} />
                    <span>Le nom est obligatoire.</span>
                  </div>
                )}
              </div>

              {/* FIELD 2: Customer Phone */}
              <div
                className={`checkout-field-group ${
                  shakeField === 'phone' ? 'field-shake' : ''
                }`}
              >
                <label className="checkout-label" htmlFor="customer-phone">
                  <span>Numéro de téléphone (رقم الهاتف)</span>
                  <span className="required-star">* (8 chiffres)</span>
                </label>
                <div
                  className={`checkout-input-wrapper ${
                    touched.phone && !isPhoneValid ? 'has-error' : ''
                  } ${touched.phone && isPhoneValid ? 'is-valid' : ''}`}
                >
                  <Phone size={18} className="field-icon" />
                  <span className="phone-country-code">+216</span>
                  <input
                    id="customer-phone"
                    type="tel"
                    inputMode="numeric"
                    className="checkout-input phone-input"
                    placeholder="Ex: 98 123 456"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    autoComplete="tel"
                    maxLength={8}
                    required
                  />
                  {touched.phone && isPhoneValid && (
                    <span className="validation-pill valid">
                      <CheckCircle2 size={13} /> 8 chiffres OK
                    </span>
                  )}
                </div>

                {/* Phone Validation Hints */}
                {touched.phone && !isPhoneValid && (
                  <div className="field-error-notice">
                    <AlertTriangle size={13} />
                    <span>
                      {isPhoneEmpty
                        ? 'Le numéro de téléphone est obligatoire.'
                        : `Le numéro doit comporter exactement 8 chiffres (${cleanPhone.length}/8).`}
                    </span>
                  </div>
                )}
              </div>

              {/* FIELD 3: Governorate / City */}
              <div className="checkout-field-group">
                <label className="checkout-label" htmlFor="customer-city">
                  <span>Gouvernorat / Ville (الولاية)</span>
                </label>
                <div className="checkout-input-wrapper">
                  <MapPin size={18} className="field-icon" />
                  <select
                    id="customer-city"
                    className="checkout-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {TUNISIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FIELD 4: Address / Notes */}
              <div className="checkout-field-group">
                <label className="checkout-label" htmlFor="customer-address">
                  <span>Adresse ou Remarques (Optionnel)</span>
                </label>
                <div className="checkout-input-wrapper">
                  <FileText size={18} className="field-icon" />
                  <input
                    id="customer-address"
                    type="text"
                    className="checkout-input"
                    placeholder="Précisions de livraison ou instructions..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Guarantee Banner */}
              <div className="checkout-guarantee-bar">
                <Zap size={16} className="guarantee-icon" />
                <span>Paiement à la livraison / D17 &bull; Confirmation ultra-rapide</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="checkout-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="btn-spinner" />
                    <span>Validation de votre commande...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRMER LA COMMANDE &bull; {totalAmount} DT</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
