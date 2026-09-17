import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Shield, ChevronRight, Sparkles } from 'lucide-react';

export default function Navbar({ 
  cartCount, 
  onOpenCart, 
  isWishlisted, 
  onToggleWishlist, 
  activeCategory, 
  setActiveCategory, 
  onNavigateAdmin 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger floating neon navbar when scrolling down a little bit (> 60px)
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background body scroll when mobile menu is open, and handle Escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Auto close mobile drawer if screen is expanded above 860px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 860) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'puffer', label: 'DOUDOUNES' },
    { id: 'all', label: 'TOUS LES PRODUITS' },
    { id: 'about', label: 'À PROPOS' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const handleNavClick = (itemId) => {
    setActiveCategory(itemId);
    if (itemId === 'all') {
      const el = document.getElementById('store-products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (itemId === 'contact' || itemId === 'about') {
      const el = document.getElementById('footer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    } else if (itemId === 'puffer') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className={`navbar-placeholder ${isScrolled ? 'is-scrolled' : ''}`}>
        <header className={`navbar ${isScrolled ? 'navbar-floating-neon' : ''}`}>
          {/* Brand / Logo */}
          <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/images/logo.png"
              alt="Logo TechnoTech"
              className="brand-logo-img"
            />
            <span className="brand-name">TECHNOTECH</span>
          </div>

          {/* Floating Center Capsule Navigation (Desktop > 860px) */}
          <nav className="nav-pill-menu" aria-label="Navigation Principale">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activeCategory === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Quick Action Icons */}
          <div className="nav-actions">
            {/* Admin Dashboard Quick Access Button */}
            <button
              type="button"
              className="circle-btn admin-badge-btn"
              onClick={onNavigateAdmin}
              aria-label="Panneau d'Administration"
              title="Panneau d'Administration / Admin"
            >
              <Shield size={18} strokeWidth={2.2} />
            </button>

            {/* Shopping Bag */}
            <button
              type="button"
              className="circle-btn"
              onClick={onOpenCart}
              aria-label="Ouvrir le Panier"
              title="Mon Panier"
            >
              <ShoppingBag size={19} strokeWidth={2.2} />
              {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
            </button>

            {/* Mobile menu toggle (Visible only <= 860px) */}
            <button
              type="button"
              className={`circle-btn mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              title={mobileMenuOpen ? "Fermer le menu" : "Menu de navigation"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Sidebar Navigation Backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Mobile Sidebar Navigation Drawer */}
      <aside
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-label="Menu de navigation mobile"
      >
        {/* Drawer Header */}
        <div className="mobile-nav-header">
          <div
            className="brand"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/images/logo.png"
              alt="Logo TechnoTech"
              className="brand-logo-img"
            />
            <span className="brand-name">TECHNOTECH</span>
          </div>
          <button
            type="button"
            className="close-mobile-drawer-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
            title="Fermer"
          >
            <X size={19} />
          </button>
        </div>

        {/* Drawer Body: Navigation Buttons */}
        <div className="mobile-nav-body">
          <span className="mobile-nav-badge-label">Navigation</span>
          <nav className="mobile-nav-links" aria-label="Liens mobiles">
            {navItems.map((item) => {
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-link-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    handleNavClick(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-nav-link-text">{item.label}</span>
                  <ChevronRight size={16} className="mobile-nav-chevron" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer: Admin Shortcut & Trust Badge */}
        <div className="mobile-nav-footer">
          <button
            type="button"
            className="mobile-admin-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateAdmin();
            }}
          >
            <Shield size={18} />
            <span>Panneau d'Administration</span>
          </button>

          <div className="mobile-nav-trust-tag">
            <Sparkles size={14} color="#ffa502" />
            <span>TechnoTech • Produits 100% Officiels</span>
          </div>
        </div>
      </aside>
    </>
  );
}
