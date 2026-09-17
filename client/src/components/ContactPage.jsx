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
} from 'lucide-react';

export default function ContactPage({ onNavigate, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'Renseignement sur un produit',
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
    if (showToast) {
      showToast('Votre message a été envoyé avec succès ! Nous vous répondrons très rapidement. ✨');
    }
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Bonjour TechnoTech, je vous contacte concernant : ${formData.subject}.%0A%0A*Nom :* ${formData.name || 'Client'}%0A*Téléphone :* ${formData.phone || ''}%0A*Message :* ${formData.message || 'Bonjour, j\'ai une question.'}`
    );
    window.open(`https://wa.me/21696086581?text=${text}`, '_blank');
  };

  const faqs = [
    {
      q: 'Comment s\'effectue l\'activation après ma commande ?',
      a: 'Une fois votre commande enregistrée, notre équipe vous contacte immédiatement via WhatsApp ou par téléphone pour vous transmettre vos accès officiels ou procéder à l\'invitation directe sur votre e-mail personnel.',
    },
    {
      q: 'Quels sont les modes de paiement acceptés en Tunisie ?',
      a: 'Nous acceptons les règlements par D17, virement bancaire local instantané, ou paiement en espèces à la livraison selon le type de produit. Vous n\'avez besoin d\'aucune carte internationale en devises.',
    },
    {
      q: 'Est-ce que tous les abonnements sont garantis ?',
      a: 'Absolument. Tous nos comptes sont 100% officiels et assortis d\'une garantie de remplacement immédiat pendant toute la durée de votre période de souscription.',
    },
    {
      q: 'Puis-je commander pour une entreprise ou une agence ?',
      a: 'Oui, nous fournissons des formules multi-utilisateurs et des licences en volume adaptées aux agences de marketing, équipes de développement et entreprises en Tunisie.',
    },
  ];

  return (
    <div className="subpage-container">
      {/* Ambient background glow */}
      <div className="subpage-ambient-orb" />

      {/* Hero Header */}
      <section className="contact-hero-section">
        <div className="contact-hero-badge">
          <Sparkles size={15} />
          <span>CONTACTEZ-NOUS &bull; SERVICE CLIENT 7J/7</span>
        </div>

        <h1 className="contact-hero-title">
          Une question ? Besoin d'<span className="gradient-text-orange">assistance</span> ?
        </h1>

        <p className="contact-hero-subtitle">
          Notre équipe tunisienne est à votre entière disposition pour vous guider, vous assister dans l'activation 
          de vos services ou répondre à toutes vos interrogations.
        </p>
      </section>

      {/* Quick Direct Channels Cards */}
      <section className="contact-channels-grid">
        {/* WhatsApp Card */}
        <div className="channel-card whatsapp-featured">
          <div className="channel-icon-circle whatsapp">
            <MessageCircle size={26} />
          </div>
          <span className="channel-tag">CANAL RECOMMANDÉ</span>
          <h3>WhatsApp Direct</h3>
          <p className="channel-detail">+216 96 086 581</p>
          <span className="channel-subtext">Réponse en direct en moins de 10 minutes ⚡</span>
          <a
            href="https://wa.me/21696086581?text=Bonjour%20TechnoTech,%20je%20souhaite%20un%20renseignement."
            target="_blank"
            rel="noopener noreferrer"
            className="channel-btn whatsapp"
          >
            <MessageCircle size={16} />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>

        {/* Phone Call Card */}
        <div className="channel-card">
          <div className="channel-icon-circle phone">
            <Phone size={26} />
          </div>
          <span className="channel-tag">APPEL TÉLÉPHONIQUE</span>
          <h3>Assistance Vocale</h3>
          <p className="channel-detail">+216 96 086 581</p>
          <span className="channel-subtext">Disponible 7j/7 de 9h00 à 22h00</span>
          <a href="tel:+21696086581" className="channel-btn phone">
            <Phone size={16} />
            <span>Appeler notre équipe</span>
          </a>
        </div>

        {/* Location & Email Card */}
        <div className="channel-card">
          <div className="channel-icon-circle email">
            <MapPin size={26} />
          </div>
          <span className="channel-tag">COUVERTURE NATIONALE</span>
          <h3>Toute la Tunisie</h3>
          <p className="channel-detail">Grand Tunis &amp; Régions</p>
          <span className="channel-subtext">contact@technotech.tn</span>
          <a href="mailto:contact@technotech.tn" className="channel-btn email">
            <Mail size={16} />
            <span>Envoyer un e-mail</span>
          </a>
        </div>
      </section>

      {/* Split Section: Contact Form + FAQ */}
      <section className="contact-split-section">
        {/* Left Column: Form */}
        <div className="contact-form-card">
          <div className="form-card-header">
            <span className="form-card-tag">FORMULAIRE DE MESSAGE</span>
            <h2>Envoyez-nous un message</h2>
            <p>Remplissez le formulaire ci-dessous et notre conseiller prendra contact avec vous sans délai.</p>
          </div>

          {submitted ? (
            <div className="contact-success-box">
              <CheckCircle2 size={52} className="success-icon" />
              <h3>Message envoyé avec succès !</h3>
              <p>Merci pour votre confiance. Notre équipe vous recontactera sur votre numéro dans les plus brefs délais.</p>
              <div className="success-actions">
                <button
                  type="button"
                  className="channel-btn whatsapp"
                  onClick={openWhatsAppDirect}
                >
                  <MessageCircle size={17} />
                  <span>Accélérer sur WhatsApp</span>
                </button>
                <button
                  type="button"
                  className="channel-btn secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', phone: '', subject: 'Renseignement sur un produit', message: '' });
                  }}
                >
                  <span>Envoyer un autre message</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
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

              {/* Subject Dropdown */}
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
                    <option value="Renseignement sur un produit">Renseignement sur un produit ou abonnement</option>
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

              <div className="form-actions-row">
                <button type="submit" className="contact-submit-btn">
                  <Send size={16} />
                  <span>Envoyer ma demande</span>
                </button>

                <button
                  type="button"
                  className="contact-whatsapp-alt-btn"
                  onClick={openWhatsAppDirect}
                  title="Envoyer directement sur WhatsApp"
                >
                  <MessageCircle size={16} />
                  <span>Envoyer via WhatsApp</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: FAQ Accordion */}
        <div className="contact-faq-wrapper">
          <div className="faq-card-header">
            <span className="form-card-tag">QUESTIONS FRÉQUENTES</span>
            <h2>Réponses rapides</h2>
            <p>Retrouvez les réponses aux questions les plus posées par nos clients.</p>
          </div>

          <div className="faq-accordion-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item-card ${expandedFaq === idx ? 'expanded' : ''}`}
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              >
                <div className="faq-question-row">
                  <div className="faq-q-left">
                    <HelpCircle size={18} className="faq-icon" />
                    <h4>{faq.q}</h4>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${expandedFaq === idx ? 'open' : ''}`}
                  />
                </div>
                {expandedFaq === idx && (
                  <div className="faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guarantee Pill */}
          <div className="contact-trust-box">
            <ShieldCheck size={22} className="trust-shield-icon" />
            <div>
              <strong>100% Satisfaction Garantie</strong>
              <span>Tous nos produits bénéficient d'un support technique personnalisé jusqu'à parfaite activation.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
