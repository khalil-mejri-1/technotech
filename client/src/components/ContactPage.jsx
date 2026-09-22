import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Zap,
  Flame,
  Check,
  Headphones
} from 'lucide-react';
import { analytics } from '../services/analytics.js';

export default function ContactPage({ onNavigate, showToast, whatsappNumber = '96086581' }) {
  const cleanDigits = String(whatsappNumber || '96086581').replace(/\D/g, '');
  const rawLocalPhone = cleanDigits.startsWith('216') ? cleanDigits.slice(3) : cleanDigits;
  const fullIntlPhone = cleanDigits.startsWith('216') ? cleanDigits : `216${cleanDigits}`;
  const displayPhone = `+216 ${rawLocalPhone.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3') || rawLocalPhone}`;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'Renseignement sur un abonnement',
    message: '',
  });

  const [touched, setTouched] = useState({ name: false, phone: false });
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Validation
  const hasDigitsInName = /\d/.test(formData.name);
  const isNameValid = formData.name.trim().length >= 2 && !hasDigitsInName;
  const cleanPhone = formData.phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 8;

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData((prev) => ({ ...prev, phone: digits }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleNameChange = (e) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });

    if (!isNameValid) {
      setErrorMsg(
        hasDigitsInName
          ? 'Le nom ne doit contenir aucun chiffre.'
          : 'Veuillez saisir votre nom complet.'
      );
      return;
    }

    if (!isPhoneValid) {
      setErrorMsg('Le numéro de téléphone doit comporter exactement 8 chiffres.');
      return;
    }

    if (!formData.message.trim()) {
      setErrorMsg('Veuillez rédiger votre message.');
      return;
    }

    // Success
    setSubmitted(true);
    analytics.trackGenerateLead({ form_name: 'contact_page' });
    if (showToast) {
      showToast('Votre message a été envoyé avec succès ! Nous vous répondrons très rapidement. ✨');
    }
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Bonjour TechnoTech ! 👋\nJe vous contacte concernant : *${formData.subject}*\n\n👤 *Nom :* ${formData.name || 'Client'}\n📞 *Téléphone :* ${formData.phone || ''}\n💬 *Message :* ${formData.message || 'Bonjour, j\'ai une question sur vos abonnements.'}`
    );
    window.open(`https://wa.me/${fullIntlPhone}?text=${text}`, '_blank');
  };

  const faqs = [
    {
      q: 'Comment s\'effectue l\'activation après ma commande ?',
      a: 'Une fois votre commande enregistrée, notre équipe vous contacte immédiatement via WhatsApp ou par téléphone pour vous transmettre vos accès officiels ou procéder à l\'invitation directe sur votre e-mail personnel en moins de 15 minutes.',
    },
    {
      q: 'Quels sont les modes de paiement acceptés en Tunisie ?',
      a: 'Nous acceptons les règlements par D17, virement bancaire local instantané, ou paiement en espèces à la livraison selon le type de produit. Vous n\'avez besoin d\'aucune carte internationale en devises.',
    },
    {
      q: 'Est-ce que tous les abonnements sont 100% garantis ?',
      a: 'Absolument. Tous nos comptes sont 100% officiels et assortis d\'une garantie de remplacement immédiat pendant toute la durée de votre période de souscription.',
    },
    {
      q: 'Puis-je commander pour une entreprise ou une agence ?',
      a: 'Oui, nous fournissons des formules multi-utilisateurs et des licences en volume adaptées aux agences de marketing, équipes de développement et entreprises partout en Tunisie avec facturation officielle.',
    },
    {
      q: 'Que faire si j\'ai un problème de connexion avec mon compte ?',
      a: 'Notre support technique est joignable 7j/7 sur WhatsApp. Il vous suffit d\'envoyer un message et notre technicien prend en charge votre demande en quelques minutes.',
    },
  ];

  return (
    <div className="offers-page-root contact-page-root">
      {/* 1. Dark Top Section with Slanted / Angled Bottom (Matching OffersPage) */}
      <section className="offers-dark-hero-slanted">
        <div className="offers-hero-content-wrap">
          {/* Header Badge */}
          <div className="offers-header-badge">
            <Sparkles size={14} className="badge-sparkle-icon" />
            <span>SERVICE CLIENT 7J/7 &bull; CONTACTEZ-NOUS</span>
          </div>

          {/* Main Title */}
          <h1 className="offers-main-title">
            Une Question ? Besoin d'<span className="highlight-gradient">Assistance</span> Immédiate ?
          </h1>

          {/* Subtitle */}
          <p className="offers-sub-title">
            Notre équipe tunisienne est à votre entière disposition 7j/7 pour vous guider, vous assister 
            dans l'activation de vos abonnements ou répondre à toutes vos interrogations.
          </p>

          {/* Reassurance Trust Pills (Same as OffersPage) */}
          <div className="offers-trust-pills">
            <div className="trust-pill">
              <MessageCircle size={14} className="trust-icon zap" />
              <span>Réponse WhatsApp &lt; 10 Min</span>
            </div>
            <div className="trust-pill">
              <Phone size={14} className="trust-icon shield" />
              <span>Assistance Vocale 9h - 22h</span>
            </div>
            <div className="trust-pill">
              <ShieldCheck size={14} className="trust-icon gift" />
              <span>Garantie &amp; Suivi Dédié</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. White Section Below with Contact Cards (Matching OffersPage Style) */}
      <section className="offers-white-body-section contact-white-section">
        <div className="offers-cards-container">
          {/* Section Header */}
          <div className="about-section-header-block">
            <span className="about-section-tag">
              <Flame size={13} />
              <span>CANAUX DE CONTACT DIRECTS</span>
            </span>
            <h2 className="about-section-main-heading">
              Comment Préférez-Vous Nous Joindre ?
            </h2>
            <p className="about-section-subheading">
              Choisissez le canal qui vous convient le mieux. Notre équipe réagit en direct pour vous garantir une satisfaction totale.
            </p>
          </div>

          {/* 3 Channels Grid (Styled identically to the Offer Cards) */}
          <div className="contact-channels-trio-grid">
            {/* Card 1: WhatsApp Direct (Featured) */}
            <div className="offer-card contact-channel-card whatsapp-highlighted">
              <div className="offer-card-glow whatsapp-glow" />

              <div className="offer-card-header">
                <span className="offer-badge-pill whatsapp-badge">
                  <Flame size={12} />
                  <span>CANAL RECOMMANDÉ</span>
                </span>
                <span className="offer-duration-pill">
                  <Zap size={11} />
                  <span>&lt; 10 min</span>
                </span>
              </div>

              <div className="offer-card-body">
                <div className="channel-icon-top whatsapp">
                  <MessageCircle size={28} />
                </div>
                <h2 className="offer-card-title">WhatsApp Direct</h2>
                <p className="offer-card-subtitle">
                  Le moyen le plus rapide pour obtenir une réponse immédiate, commander un abonnement ou demander une assistance technique en direct.
                </p>

                <div className="channel-info-pill-box">
                  <span className="channel-info-label">Numéro WhatsApp :</span>
                  <span className="channel-info-val">{displayPhone}</span>
                </div>

                <ul className="offer-features-list">
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Réponse instantanée garantie 7j/7</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Envoi instantané des identifiants et accès</span>
                  </li>
                </ul>
              </div>

              <div className="offer-card-footer">
                <a
                  href={`https://wa.me/${fullIntlPhone}?text=Bonjour%20TechnoTech%20!%20👋%20Je%20souhaite%20un%20renseignement%20sur%20vos%20abonnements.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="offer-order-btn channel-whatsapp-cta"
                >
                  <MessageCircle size={16} />
                  <span>Discuter sur WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card 2: Phone Call */}
            <div className="offer-card contact-channel-card">
              <div className="offer-card-glow" />

              <div className="offer-card-header">
                <span className="offer-badge-pill">
                  <Phone size={12} />
                  <span>APPEL DIRECT</span>
                </span>
                <span className="offer-duration-pill">
                  <Clock size={11} />
                  <span>9h00 - 22h00</span>
                </span>
              </div>

              <div className="offer-card-body">
                <div className="channel-icon-top phone">
                  <Phone size={28} />
                </div>
                <h2 className="offer-card-title">Assistance Téléphonique</h2>
                <p className="offer-card-subtitle">
                  Vous préférez échanger de vive voix avec un conseiller ? Nous sommes disponibles par téléphone chaque jour.
                </p>

                <div className="channel-info-pill-box">
                  <span className="channel-info-label">Ligne directe :</span>
                  <span className="channel-info-val">{displayPhone}</span>
                </div>

                <ul className="offer-features-list">
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Conseils personnalisés pour le choix d'offres</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Disponible du Lundi au Dimanche</span>
                  </li>
                </ul>
              </div>

              <div className="offer-card-footer">
                <a href={`tel:+${fullIntlPhone}`} className="offer-whatsapp-btn channel-phone-cta">
                  <Phone size={15} />
                  <span>Appeler notre équipe</span>
                </a>
              </div>
            </div>

            {/* Card 3: Email & National Coverage */}
            <div className="offer-card contact-channel-card">
              <div className="offer-card-glow" />

              <div className="offer-card-header">
                <span className="offer-badge-pill">
                  <Mail size={12} />
                  <span>E-MAIL &amp; PRO</span>
                </span>
                <span className="offer-duration-pill">
                  <Clock size={11} />
                  <span>&lt; 2 heures</span>
                </span>
              </div>

              <div className="offer-card-body">
                <div className="channel-icon-top email">
                  <Mail size={28} />
                </div>
                <h2 className="offer-card-title">E-mail &amp; Devis Entreprise</h2>
                <p className="offer-card-subtitle">
                  Pour les demandes d'entreprises, factures officielles, devis en volume ou questions administratives.
                </p>

                <div className="channel-info-pill-box">
                  <span className="channel-info-label">E-mail officiel :</span>
                  <span className="channel-info-val">contact@technotech.tn</span>
                </div>

                <ul className="offer-features-list">
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Facturation pro et licences en volume</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Couverture sur toute la Tunisie</span>
                  </li>
                </ul>
              </div>

              <div className="offer-card-footer">
                <a href="mailto:contact@technotech.tn" className="offer-whatsapp-btn channel-email-cta">
                  <Mail size={15} />
                  <span>Envoyer un e-mail</span>
                </a>
              </div>
            </div>
          </div>

          {/* Split Section: Luxury Form + Interactive FAQ */}
          <div className="contact-split-layout">
            {/* Left: Contact Form in Luxury Dark Card */}
            <div className="offer-card contact-form-card-luxury">
              <div className="offer-card-glow" />

              <div className="form-luxury-header">
                <div className="offer-badge-pill">
                  <Send size={12} />
                  <span>MESSAGE SÉCURISÉ</span>
                </div>
                <h2 className="offer-card-title">Envoyez-nous un Message</h2>
                <p className="offer-card-subtitle">
                  Remplissez le formulaire ci-dessous et notre conseiller prendra contact avec vous immédiatement.
                </p>
              </div>

              {submitted ? (
                <div className="contact-success-box-luxury">
                  <CheckCircle2 size={54} className="success-icon-glow" />
                  <h3>Message Envoyé avec Succès !</h3>
                  <p>Merci pour votre confiance. Notre équipe vous répondra par WhatsApp ou téléphone dans les plus brefs délais.</p>

                  <div className="success-actions-row">
                    <button
                      type="button"
                      className="offer-order-btn channel-whatsapp-cta"
                      onClick={openWhatsAppDirect}
                    >
                      <MessageCircle size={16} />
                      <span>Accélérer sur WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      className="offer-whatsapp-btn"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', phone: '', subject: 'Renseignement sur un abonnement', message: '' });
                      }}
                    >
                      <span>Envoyer un autre message</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form-inner" noValidate>
                  {errorMsg && (
                    <div className="contact-error-notice animate-shake">
                      <AlertTriangle size={18} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="contact-name">
                      <span>Nom complet (الاسم واللقب)</span>
                      <span className="required-star">*</span>
                    </label>
                    <div className={`form-input-wrapper ${touched.name && !isNameValid ? 'has-error' : ''}`}>
                      <input
                        id="contact-name"
                        type="text"
                        className="form-input"
                        placeholder="Ex: Mohamed Ben Ali"
                        value={formData.name}
                        onChange={handleNameChange}
                        onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                        required
                      />
                      {touched.name && isNameValid && (
                        <span className="valid-check-badge">✓</span>
                      )}
                    </div>
                    {touched.name && hasDigitsInName && (
                      <span className="field-hint-error">Le nom ne doit contenir aucun chiffre.</span>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="contact-phone">
                      <span>Numéro de téléphone (رقم الهاتف)</span>
                      <span className="required-star">* (8 chiffres)</span>
                    </label>
                    <div className={`form-input-wrapper ${touched.phone && !isPhoneValid ? 'has-error' : ''}`}>
                      <span className="input-country-prefix">+216</span>
                      <input
                        id="contact-phone"
                        type="tel"
                        inputMode="numeric"
                        className="form-input"
                        placeholder="Ex: 98 123 456"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                        maxLength={8}
                        required
                      />
                      {touched.phone && isPhoneValid && (
                        <span className="valid-check-badge">✓</span>
                      )}
                    </div>
                    {touched.phone && !isPhoneValid && (
                      <span className="field-hint-error">Le numéro doit comporter exactement 8 chiffres.</span>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="contact-subject">
                      <span>Sujet de votre demande</span>
                    </label>
                    <div className="form-input-wrapper">
                      <select
                        id="contact-subject"
                        className="form-select"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      >
                        <option value="Renseignement sur un abonnement">Renseignement sur un produit ou abonnement</option>
                        <option value="Pack Spécial ou Duo">Renseignement sur une Offre / Pack Spécial</option>
                        <option value="Abonnement IA (ChatGPT, Claude...)">Abonnements Intelligence Artificielle</option>
                        <option value="Licence Windows ou Office">Licences Logicielles (Windows, Office...)</option>
                        <option value="Assistance & Activation">Assistance à l'activation</option>
                        <option value="Demande Entreprise / Agence">Demande de devis Entreprise / Agence</option>
                        <option value="Autre demande">Autre demande</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="contact-message">
                      <span>Votre message</span>
                      <span className="required-star">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      className="form-textarea"
                      placeholder="Décrivez votre besoin ou posez votre question en toute simplicité..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errorMsg) setErrorMsg(null);
                      }}
                      required
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="contact-form-actions-luxury">
                    <button type="submit" className="offer-order-btn contact-submit-btn-luxury">
                      <Send size={15} />
                      <span>Envoyer ma Demande</span>
                    </button>

                    <button
                      type="button"
                      className="offer-whatsapp-btn contact-whatsapp-btn-luxury"
                      onClick={openWhatsAppDirect}
                      title="Envoyer directement sur WhatsApp"
                    >
                      <MessageCircle size={15} />
                      <span>Envoyer via WhatsApp</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: FAQ Accordion in Luxury Styling */}
            <div className="contact-faq-column-luxury">
              <div className="faq-column-header">
                <span className="about-section-tag">
                  <HelpCircle size={13} />
                  <span>QUESTIONS FRÉQUENTES</span>
                </span>
                <h3 className="faq-main-heading">Réponses Immédiates</h3>
                <p className="faq-sub-heading">
                  Retrouvez en un clic les explications aux questions les plus courantes.
                </p>
              </div>

              <div className="faq-luxury-accordion-list">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className={`faq-luxury-card ${expandedFaq === idx ? 'expanded' : ''}`}
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  >
                    <div className="faq-question-luxury-row">
                      <div className="faq-q-left">
                        <span className="faq-index-number">0{idx + 1}</span>
                        <h4>{faq.q}</h4>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`faq-chevron-luxury ${expandedFaq === idx ? 'open' : ''}`}
                      />
                    </div>
                    {expandedFaq === idx && (
                      <div className="faq-answer-luxury-content">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Trust Box */}
              <div className="contact-trust-card-luxury">
                <div className="trust-card-icon-circle">
                  <ShieldCheck size={24} />
                </div>
                <div className="trust-card-text">
                  <h4>100% Satisfaction ou Remplacement</h4>
                  <p>Chaque commande bénéficie d'une garantie totale avec assistance technique directe sur WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
