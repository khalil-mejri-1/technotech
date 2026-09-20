import React from 'react';
import {
  ShieldCheck,
  Zap,
  Clock,
  Headphones,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Globe,
  HeartHandshake,
  Check,
  Gift,
  Flame,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="offers-page-root about-page-root">
      {/* 1. Dark Top Section with Slanted / Angled Bottom (Matching OffersPage) */}
      <section className="offers-dark-hero-slanted">
        <div className="offers-hero-content-wrap">
          {/* Header Badge */}
          <div className="offers-header-badge">
            <Sparkles size={14} className="badge-sparkle-icon" />
            <span>QUI SOMMES-NOUS ? &bull; TECHNOTECH TUNISIE</span>
          </div>

          {/* Main Title */}
          <h1 className="offers-main-title">
            La Référence des Abonnements &amp; Licences en <span className="highlight-gradient">Tunisie</span>
          </h1>

          {/* Subtitle */}
          <p className="offers-sub-title">
            TechnoTech est la plateforme leader en Tunisie dédiée à l'activation d'abonnements officiels, 
            d'outils d'intelligence artificielle et de licences logicielles certifiées à tarifs préférentiels.
          </p>

          {/* Reassurance Trust Pills (Same as OffersPage) */}
          <div className="offers-trust-pills">
            <div className="trust-pill">
              <Zap size={14} className="trust-icon zap" />
              <span>Activation en &lt; 15 Min</span>
            </div>
            <div className="trust-pill">
              <ShieldCheck size={14} className="trust-icon shield" />
              <span>Comptes 100% Officiels</span>
            </div>
            <div className="trust-pill">
              <Users size={14} className="trust-icon users" />
              <span>+5,000 Clients en Tunisie</span>
            </div>
            <div className="trust-pill">
              <Headphones size={14} className="trust-icon support" />
              <span>Support Client Dédié 7j/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. White Section Below (Matching OffersPage Style) */}
      <section className="offers-white-body-section about-white-section">
        <div className="offers-cards-container">
          {/* Key Stats Counter Grid in White Section */}
          <div className="about-stats-grid-luxury in-white-section">
            <div className="offer-card about-stat-card-luxury">
              <div className="stat-card-glow" />
              <div className="stat-number-luxury">+5,000</div>
              <div className="stat-label-luxury">Clients Satisfaits en Tunisie</div>
            </div>

            <div className="offer-card about-stat-card-luxury">
              <div className="stat-card-glow" />
              <div className="stat-number-luxury">100%</div>
              <div className="stat-label-luxury">Comptes Privés &amp; Garantis</div>
            </div>

            <div className="offer-card about-stat-card-luxury">
              <div className="stat-card-glow" />
              <div className="stat-number-luxury">&lt; 15 min</div>
              <div className="stat-label-luxury">Délai Moyen d'Activation</div>
            </div>

            <div className="offer-card about-stat-card-luxury">
              <div className="stat-card-glow" />
              <div className="stat-number-luxury">7j/7</div>
              <div className="stat-label-luxury">Assistance WhatsApp Directe</div>
            </div>
          </div>

          {/* Section Section Header */}
          <div className="about-section-header-block">
            <span className="about-section-tag">
              <Flame size={13} />
              <span>NOTRE HISTOIRE &amp; ENGAGEMENTS</span>
            </span>
            <h2 className="about-section-main-heading">
              Une Mission Claire : Démocratiser le Digital en Tunisie
            </h2>
            <p className="about-section-subheading">
              Nous éliminons la contrainte des cartes internationales et des devises étrangères pour vous donner un accès simple, 
              sécurisé et garanti aux meilleurs outils et technologies du monde.
            </p>
          </div>

          {/* Mission & Vision Duo Cards (Styled identical to Offers Cards) */}
          <div className="about-duo-cards-grid">
            {/* Card 1: Notre Mission */}
            <div className="offer-card about-luxury-card mission-card">
              <div className="offer-card-glow" />

              <div className="offer-card-header">
                <span className="offer-badge-pill">
                  <TrendingUp size={12} />
                  <span>NOTRE ENGAGEMENT</span>
                </span>
                <span className="offer-duration-pill">
                  <Clock size={11} />
                  <span>Au Quotidien</span>
                </span>
              </div>

              <div className="offer-card-body">
                <h2 className="offer-card-title">Rendre la Technologie Mondiale Accessible à Tous</h2>
                <p className="offer-card-subtitle">
                  Chaque étudiant, créateur de contenu, développeur ou professionnel en Tunisie mérite de profiter des meilleurs outils numériques sans barrière financière ou bancaire.
                </p>

                <ul className="offer-features-list about-card-features">
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Règlement 100% local en Dinars Tunisiens (D17, virement bancaire local, espèces)</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Zéro contrainte de carte bancaire internationale en devises ou de démarches complexes</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Tarifs négociés au plus juste et packs combinés 2-en-1 ultra économiques</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Activation immédiate sur votre propre adresse e-mail ou compte officiel dédié</span>
                  </li>
                </ul>
              </div>

              <div className="about-card-footer-notice">
                <Sparkles size={14} className="notice-icon" />
                <span>Plus de 5,000 commandes traitées avec succès partout en Tunisie</span>
              </div>
            </div>

            {/* Card 2: Notre Vision */}
            <div className="offer-card about-luxury-card vision-card">
              <div className="offer-card-glow" />

              <div className="offer-card-header">
                <span className="offer-badge-pill">
                  <Globe size={12} />
                  <span>VISION &amp; QUALITÉ</span>
                </span>
                <span className="offer-duration-pill">
                  <Clock size={11} />
                  <span>Long Terme</span>
                </span>
              </div>

              <div className="offer-card-body">
                <h2 className="offer-card-title">Être le Partenaire de Confiance N°1 en Tunisie</h2>
                <p className="offer-card-subtitle">
                  Bâtir une réputation inébranlable fondée sur l'authenticité sans faille de nos comptes, une assistance continue et un respect scrupuleux de nos engagements.
                </p>

                <ul className="offer-features-list about-card-features">
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Comptes 100% authentiques garantis sans coupure ni interruption imprévue</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Remplacement instantané et sans discussion en cas de moindre anomalie technique</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Accompagnement personnalisé pour les agences, équipes de dev et entreprises</span>
                  </li>
                  <li className="offer-feature-item">
                    <Check size={12} className="feature-check" strokeWidth={3} />
                    <span>Mise à disposition continue des toutes dernières nouveautés de l'IA mondiale</span>
                  </li>
                </ul>
              </div>

              <div className="about-card-footer-notice">
                <ShieldCheck size={14} className="notice-icon" />
                <span>Garantie de remplacement totale pendant toute la durée de votre abonnement</span>
              </div>
            </div>
          </div>

          {/* Our 4 Core Pillars Section */}
          <div className="about-pillars-wrapper">
            <div className="about-section-header-block compact">
              <span className="about-section-tag">
                <Award size={13} />
                <span>POURQUOI TECHNOTECH ?</span>
              </span>
              <h2 className="about-section-main-heading">Nos 4 Piliers d'Excellence</h2>
              <p className="about-section-subheading">
                Chaque commande passée sur TechnoTech est couverte par un protocole rigoureux de qualité et de sécurité.
              </p>
            </div>

            <div className="about-pillars-quad-grid">
              {/* Pillar 1 */}
              <div className="offer-card pillar-card-modern">
                <div className="offer-card-glow" />
                <div className="pillar-top-row">
                  <div className="pillar-icon-box blue">
                    <ShieldCheck size={22} />
                  </div>
                  <span className="pillar-badge">AUTHENTICITÉ</span>
                </div>
                <h3 className="pillar-modern-title">Comptes 100% Officiels</h3>
                <p className="pillar-modern-desc">
                  Toutes nos licences et tous nos abonnements proviennent de canaux certifiés. Zéro piratage, zéro instabilité, zéro mauvaise surprise.
                </p>
                <div className="pillar-benefit-chip">
                  <Check size={11} strokeWidth={3} />
                  <span>Garantie totale incluse</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="offer-card pillar-card-modern">
                <div className="offer-card-glow" />
                <div className="pillar-top-row">
                  <div className="pillar-icon-box orange">
                    <Zap size={22} />
                  </div>
                  <span className="pillar-badge">&lt; 15 MINUTES</span>
                </div>
                <h3 className="pillar-modern-title">Activation Ultra-Rapide</h3>
                <p className="pillar-modern-desc">
                  Dès la validation de votre commande, notre équipe procède à l'attribution de vos identifiants ou à l'invitation directe sur votre e-mail.
                </p>
                <div className="pillar-benefit-chip">
                  <Check size={11} strokeWidth={3} />
                  <span>Activation express 7j/7</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="offer-card pillar-card-modern">
                <div className="offer-card-glow" />
                <div className="pillar-top-row">
                  <div className="pillar-icon-box green">
                    <HeartHandshake size={22} />
                  </div>
                  <span className="pillar-badge">PAIEMENT TUNISIEN</span>
                </div>
                <h3 className="pillar-modern-title">Paiement Local Sécurisé</h3>
                <p className="pillar-modern-desc">
                  Pas besoin de carte internationale en devise. Payez simplement par D17, virement bancaire local instantané ou en espèces à la livraison.
                </p>
                <div className="pillar-benefit-chip">
                  <Check size={11} strokeWidth={3} />
                  <span>D17 &bull; Virement &bull; Espèces</span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="offer-card pillar-card-modern">
                <div className="offer-card-glow" />
                <div className="pillar-top-row">
                  <div className="pillar-icon-box purple">
                    <Headphones size={22} />
                  </div>
                  <span className="pillar-badge">SUPPORT DÉDIÉ</span>
                </div>
                <h3 className="pillar-modern-title">Assistance Dédiée 7j/7</h3>
                <p className="pillar-modern-desc">
                  Une équipe tunisienne réactive joignable directement sur WhatsApp ou par téléphone pour vous accompagner étape par étape.
                </p>
                <div className="pillar-benefit-chip">
                  <Check size={11} strokeWidth={3} />
                  <span>Réponse en &lt; 10 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Spectrum Showcase Banner */}
          <div className="about-showcase-wide-banner">
            <div className="banner-glow-ambient" />
            <div className="showcase-banner-inner">
              <div className="showcase-banner-text">
                <div className="showcase-badge-pill">
                  <Sparkles size={13} />
                  <span>TOUT VOTRE UNIVERS DIGITAL AU MÊME ENDROIT</span>
                </div>
                <h2 className="showcase-banner-title">
                  Prêt à Débloquer Vos Outils Digitaux Préférés ?
                </h2>
                <p className="showcase-banner-desc">
                  Intelligence Artificielle (ChatGPT Plus, Claude Pro, Midjourney), Création &amp; Montage (Canva Pro, CapCut Pro), 
                  Licences Logicielles (Windows 11 Pro, Office 365) et Divertissement Premium (YouTube Premium, Netflix, Spotify).
                </p>
              </div>

              <div className="showcase-banner-actions">
                <button
                  type="button"
                  className="offer-order-btn about-btn-large"
                  onClick={() => onNavigate && onNavigate('/')}
                >
                  <ShoppingBag size={16} />
                  <span>Explorer la Boutique</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  className="offer-whatsapp-btn about-btn-secondary"
                  onClick={() => onNavigate && onNavigate('/offers')}
                >
                  <Gift size={15} />
                  <span>Voir les Packs Spéciaux</span>
                </button>

                <button
                  type="button"
                  className="about-btn-link"
                  onClick={() => onNavigate && onNavigate('/contact')}
                >
                  <MessageCircle size={14} />
                  <span>Poser une question</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
