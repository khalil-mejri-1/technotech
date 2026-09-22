import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, ChevronRight, Sparkles, Flame } from 'lucide-react';

export default function Navbar({
  cartCount,
  onOpenCart,
  isWishlisted,
  onToggleWishlist,
  activeCategory,
  setActiveCategory,
  onNavigateAdmin,
  currentPath = '/',
  onNavigate,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      // Trigger floating neon navbar when scrolling down a little bit (> 60px)
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Track active section between BOUTIQUE (top hero) and CATALOGUE (products section)
      if (currentPath === '/') {
        const catalogEl = document.getElementById('store-products-section');
        if (catalogEl) {
          const rect = catalogEl.getBoundingClientRect();
          if (rect.top <= 280) {
            setActiveSection('catalog');
          } else {
            setActiveSection('home');
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

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
    { id: 'home', label: 'BOUTIQUE', path: '/' },
    { id: 'catalog', label: 'CATALOGUE', path: '/' },
    { id: 'about', label: 'À PROPOS', path: '/about' },
    { id: 'contact', label: 'CONTACT', path: '/contact' },
  ];

  const handleNavClick = (item) => {
    if (item.id === 'catalog') {
      setActiveSection('catalog');
      if (currentPath !== '/') {
        if (onNavigate) onNavigate('/');
        setTimeout(() => {
          const el = document.getElementById('store-products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      } else {
        const el = document.getElementById('store-products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.id === 'home') {
      setActiveSection('home');
      if (currentPath !== '/') {
        if (onNavigate) onNavigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (onNavigate) {
        onNavigate(item.path);
      }
    }
  };

  const isItemActive = (item) => {
    if (item.id === 'about') return currentPath === '/about' || currentPath === '/a-propos';
    if (item.id === 'contact') return currentPath === '/contact';
    if (currentPath === '/') {
      return item.id === activeSection;
    }
    return false;
  };

  return (
    <>
      <div className={`navbar-placeholder ${isScrolled ? 'is-scrolled' : ''}`}>
        <header className={`navbar ${isScrolled ? 'navbar-floating-neon' : ''}`}>
          {/* Brand / Logo */}
          <a
            href="/"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('home');
              if (onNavigate) onNavigate('/');
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="TechnoTech - Accueil"
          >
            <img
              src="/images/logo.png"
              alt="Logo TechnoTech"
              className="brand-logo-img"
            />
            <span className="brand-name">
              <span className="brand-techno">Techno</span><span className="brand-tech">Tech</span>
            </span>
          </a>

          {/* Floating Center Capsule Navigation (Desktop > 860px) */}
          <nav className="nav-pill-menu" aria-label="Navigation Principale">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.id === 'catalog' ? '/#store-products-section' : item.path}
                className={`nav-link ${isItemActive(item) ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item);
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Quick Action Icons */}
          <div className="nav-actions">
            {/* Distinctive Special Offers Button */}
            <a
              href="/offers"
              className={`nav-offers-special-btn ${currentPath === '/offers' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/offers');
              }}
              title="Découvrez nos Packs & Offres Spéciales (Jusqu'à -50%)"
            >
              <span className="offers-flame-wrapper">
                <Flame size={15} className="offers-flame-icon" />
              </span>
              <span className="offers-btn-text">OFFRES </span>
            </a>

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
          <a
            href="/"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="TechnoTech - Accueil"
          >
            <img
              src="/images/logo.png"
              alt="Logo TechnoTech"
              className="brand-logo-img"
            />
            <span className="brand-name">
              <span className="brand-techno">Techno</span><span className="brand-tech">Tech</span>
            </span>
          </a>
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
          <a
            href="/offers"
            className={`mobile-offers-special-btn ${currentPath === '/offers' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/offers');
              setMobileMenuOpen(false);
            }}
            title="Offres & Packs Spéciaux"
          >
            <div className="mobile-offers-content">
              <div className="mobile-offers-icon-box">
                <Flame size={20} className="mobile-flame-icon" />
              </div>
              <div className="mobile-offers-text-wrap">
                <div className="mobile-offers-title-row">
                  <span className="mobile-offers-title">OFFRES & PACKS</span>
                  <span className="mobile-offers-badge">-50%</span>
                </div>
                <span className="mobile-offers-sub">Jusqu'à -50% de réduction immédiate</span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-offers-chevron" />
          </a>

          <span className="mobile-nav-badge-label">Navigation</span>
          <nav className="mobile-nav-links" aria-label="Liens mobiles">
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <a
                  key={item.id}
                  href={item.id === 'catalog' ? '/#store-products-section' : item.path}
                  className={`mobile-nav-link-btn ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-nav-link-text">{item.label}</span>
                  <ChevronRight size={16} className="mobile-nav-chevron" />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer: Admin Shortcut & Trust Badge */}
        <div className="mobile-nav-footer">

          <div className="mobile-nav-trust-tag">
            <Sparkles size={14} color="#ffa502" />
            <span>TechnoTech • Produits 100% Officiels</span>
          </div>
        </div>
      </aside>
    </>
  );
}
