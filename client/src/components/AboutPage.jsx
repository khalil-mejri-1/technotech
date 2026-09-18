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
  Cpu,
  Globe,
  HeartHandshake,
} from 'lucide-react';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="subpage-container">
      {/* Ambient background glow orb */}
      <div className="subpage-ambient-orb" />

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-badge">
          <Sparkles size={15} />
          <span>QUI SOMMES-NOUS ? &bull; TECHNOTECH</span>
        </div>

        <h1 className="about-hero-title">
          La référence des abonnements et licences officielles en <span className="gradient-text-orange">Tunisie</span>
        </h1>

        <p className="about-hero-subtitle">
          TechnoTech est la plateforme leader en Tunisie dédiée à la distribution d'abonnements numériques premium, 
          d'outils d'intelligence artificielle et de licences logicielles certifiées avec activation immédiate.
        </p>

        {/* Key Stats Counter Grid */}
        <div className="about-stats-grid">
          <div className="about-stat-box">
            <div className="stat-number">+5,000</div>
            <div className="stat-label">Clients Satisfaits en Tunisie</div>
          </div>
          <div className="about-stat-box">
            <div className="stat-number">100%</div>
            <div className="stat-label">Licences &amp; Comptes Officiels</div>
          </div>
          <div className="about-stat-box">
            <div className="stat-number">&lt; 15 min</div>
            <div className="stat-label">Délai Moyen d'Activation</div>
          </div>
          <div className="about-stat-box">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support Client Dédié</div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="about-story-section">
        <div className="story-grid">
          <div className="story-card mission">
            <div className="story-icon-box">
              <TrendingUp size={24} />
            </div>
            <h2>Notre Mission</h2>
            <p>
              Démocratiser l'accès aux technologies mondiales les plus avancées pour tous les Tunisiens. 
              Nous éliminons la barrière des paiements internationaux en vous permettant d'acquérir les meilleurs 
              abonnements (IA, design, bureautique, streaming) directement en Dinars Tunisiens (D17, virement, ou à la livraison).
            </p>
          </div>

          <div className="story-card vision">
            <div className="story-icon-box">
              <Globe size={24} />
            </div>
            <h2>Notre Vision</h2>
            <p>
              Être le partenaire de confiance numéro 1 en Tunisie pour les professionnels, étudiants, agences et passionnés 
              de technologie. Nous nous engageons sur la qualité irréprochable de chaque compte et sur une assistance continue 
              tout au long de votre abonnement.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose TechnoTech (Our Pillars) */}
      <section className="about-pillars-section">
        <div className="section-title-wrap text-center">
          <span className="section-tag-pill">POURQUOI TECHNOTECH ?</span>
          <h2 className="about-pillars-heading">Nos 4 Engagements Fondamentaux</h2>
          <p className="about-pillars-subheading">
            Nous avons conçu notre service pour vous offrir une sérénité totale à chaque commande.
          </p>
        </div>

        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-card">
            <div className="pillar-icon-circle blue">
              <ShieldCheck size={26} />
            </div>
            <h3>Comptes 100% Authentiques</h3>
            <p>
              Toutes nos licences et tous nos abonnements proviennent de canaux officiels et certifiés. 
              Zéro piratage, zéro interruption imprévue, zéro mauvaise surprise.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-card">
            <div className="pillar-icon-circle orange">
              <Zap size={26} />
            </div>
            <h3>Activation Ultra-Rapide</h3>
            <p>
              Dès la confirmation de votre commande, notre équipe procède à l'attribution de vos identifiants ou à l'invitation officielle 
              sur votre propre compte en quelques minutes seulement.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-card">
            <div className="pillar-icon-circle emerald">
              <HeartHandshake size={26} />
            </div>
            <h3>Paiement Local Sécurisé</h3>
            <p>
              Pas besoin de carte bancaire internationale en devises. Vous réglez simplement par D17, virement bancaire local 
              ou paiement direct à la livraison en toute sécurité.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="pillar-card">
            <div className="pillar-icon-circle purple">
              <Headphones size={26} />
            </div>
            <h3>Support Dédié en Tunisie</h3>
            <p>
              Une équipe réactive et joignable 7j/7 directement sur WhatsApp ou par téléphone pour répondre à toutes vos questions 
              et vous accompagner étape par étape.
            </p>
          </div>
        </div>
      </section>

      {/* Products Spectrum */}
      <section className="about-categories-banner">
        <div className="categories-banner-content">
          <div className="banner-left">
            <span className="banner-badge">CATALOGUE OFFICIEL</span>
            <h2>Tout votre univers digital au même endroit</h2>
            <p>
              Intelligence Artificielle (ChatGPT Plus, Claude Pro, Midjourney), Création Graphique &amp; Montage (Canva Pro, Adobe Cloud), 
              Bureautique &amp; Licences (Windows 11 Pro, Office 365), et Divertissement Premium (YouTube, Netflix, Spotify).
            </p>
          </div>
          <div className="banner-right">
            <button
              type="button"
              className="about-cta-btn primary"
              onClick={() => onNavigate('/')}
            >
              <span>Découvrir nos produits</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="about-cta-btn secondary"
              onClick={() => onNavigate('/contact')}
            >
              <span>Poser une question</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
