import React from 'react';
import { Globe } from 'lucide-react';

function InstagramIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function Footer({ onNavigate, whatsappNumber = '96086581' }) {
  const cleanDigits = String(whatsappNumber || '96086581').replace(/\D/g, '');
  const fullIntlPhone = cleanDigits.startsWith('216') ? cleanDigits : `216${cleanDigits}`;

  return (
    <footer className="footer" id="footer-section">
      {/* Bottom Left Social & Portfolio Icons */}
      <div className="footer-socials">
        <a
          href={`https://wa.me/${fullIntlPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="WhatsApp"
          title="WhatsApp Support"
        >
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </a>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="Facebook"
          title="Facebook"
        >
          <FacebookIcon size={17} />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="Instagram"
          title="Instagram"
        >
          <InstagramIcon size={17} />
        </a>
      </div>

      {/* Footer Navigation Links */}
      <nav className="footer-nav-links" aria-label="Navigation Pied de Page">
        <a
          href="/"
          className="footer-nav-btn"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/');
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Accueil TechnoTech"
        >
          Boutique
        </a>
        <a
          href="/offers"
          className="footer-nav-btn"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/offers');
          }}
          title="Offres & Packs Spéciaux"
        >
          Offres Spéciales
        </a>
        <a
          href="/about"
          className="footer-nav-btn"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/about');
          }}
          title="À Propos de TechnoTech"
        >
          À Propos
        </a>
        <a
          href="/contact"
          className="footer-nav-btn"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/contact');
          }}
          title="Contactez TechnoTech"
        >
          Contact
        </a>
      </nav>

      {/* Centered Slogan / Tagline */}
      <div className="footer-tagline">
        TechnoTech &bull; Produits Digitaux &amp; Abonnements Officiels &bull; &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
