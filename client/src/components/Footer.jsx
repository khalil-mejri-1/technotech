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

export default function Footer() {
  return (
    <footer className="footer" id="footer-section">
      {/* Bottom Left Social & Portfolio Icons */}
      <div className="footer-socials">
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
          href="https://technotech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="Website"
          title="technotech.com"
        >
          <Globe size={17} strokeWidth={2} />
        </a>
        <a
          href="https://behance.net"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label="Behance Portfolio"
          title="Behance Profile"
        >
        </a>
      </div>

      {/* Centered Slogan / Tagline */}
      <div className="footer-tagline">
        TechnoTech &bull; Produits Digitaux & Abonnements &bull; Tous droits réservés &copy; {new Date().getFullYear()}
      </div>

      {/* Empty right spacer to keep perfect balance */}
      <div className="footer-spacer" />
    </footer>
  );
}
