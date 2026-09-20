import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import ProductsSection from './components/ProductsSection.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import OffersPage from './components/OffersPage.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import AboutPage from './components/AboutPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import { getStoredProducts, saveStoredProducts, INITIAL_PRODUCTS, getStoredHeroSlides, saveStoredHeroSlides } from './data/productsData.js';
import { getStoredOffers, saveStoredOffers } from './data/offersData.js';
import { productService } from './services/productService.js';
import { offerService } from './services/offerService.js';
import { settingsService, DEFAULT_SITE_SETTINGS } from './services/settingsService.js';

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [products, setProducts] = useState(getStoredProducts);
  const [heroSlides, setHeroSlides] = useState(() => getStoredHeroSlides(getStoredProducts()));
  const [offers, setOffers] = useState(getStoredOffers);
  const [siteSettings, setSiteSettings] = useState(() => settingsService.getLocalSettings());
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeColor, setActiveColor] = useState('orange');
  const [activeSize, setActiveSize] = useState('36');
  const [activeCategory, setActiveCategory] = useState('puffer');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize products, hero slides and offers directly with MongoDB Atlas database
  useEffect(() => {
    let isMounted = true;
    const fetchFromDatabase = async () => {
      try {
        const dbProducts = await productService.getAll();
        if (isMounted) {
          if (Array.isArray(dbProducts) && dbProducts.length > 0) {
            setProducts(dbProducts);
            saveStoredProducts(dbProducts);
          } else {
            const seeded = await productService.reset(INITIAL_PRODUCTS);
            setProducts(seeded);
            saveStoredProducts(seeded);
          }
        }
      } catch (err) {
        console.warn('Base de données distante en cours de chargement ou hors ligne :', err.message);
      }

      try {
        const dbSlides = await productService.getHeroSlides();
        if (isMounted && Array.isArray(dbSlides) && dbSlides.length > 0) {
          setHeroSlides(dbSlides);
          saveStoredHeroSlides(dbSlides);
        }
      } catch (err) {
        console.warn('Carrousel distant hors ligne :', err.message);
      }

      try {
        const dbOffers = await offerService.getAll(true);
        if (isMounted && Array.isArray(dbOffers)) {
          setOffers(dbOffers);
          saveStoredOffers(dbOffers);
        }
      } catch (err) {
        console.warn('Offres distantes hors ligne :', err.message);
      }

      try {
        const dbSettings = await settingsService.getSettings();
        if (isMounted && dbSettings) {
          setSiteSettings(dbSettings);
        }
      } catch (err) {
        console.warn('Paramètres de sécurité hors ligne :', err.message);
      }
    };

    fetchFromDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateOffers = (newOffers) => {
    setOffers(newOffers);
    saveStoredOffers(newOffers);
  };

  const handleUpdateProducts = (newProducts) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  const handleUpdateHeroSlides = async (newSlides) => {
    setHeroSlides(newSlides);
    saveStoredHeroSlides(newSlides);
    try {
      const saved = await productService.saveHeroSlides(newSlides);
      if (Array.isArray(saved) && saved.length > 0) {
        setHeroSlides(saved);
      }
    } catch (err) {
      console.warn('Erreur sauvegarde carrousel DB :', err.message);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    const updated = await settingsService.updateSettings(newSettings);
    setSiteSettings(updated);
    return updated;
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Site Security & Content Protection (Disable Right Click, Inspect/DevTools & Dragging)
  useEffect(() => {
    const isAdmin = currentPath === '/admin' || currentPath.startsWith('/admin');
    // If inside admin and admin protection is not explicitly enabled, allow normal devtools & right click
    if (isAdmin && !siteSettings.protectInAdmin) {
      return;
    }

    let lastWarningTime = 0;
    const triggerProtectionNotice = (msg) => {
      const now = Date.now();
      if (now - lastWarningTime > 2500) {
        lastWarningTime = now;
        showToast(msg);
      }
    };

    // 1. Disable Right Click Context Menu (Image link copying, save image as, etc.)
    const handleContextMenu = (e) => {
      if (siteSettings.disableRightClick) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Clic droit désactivé - Contenu et images protégés © TechnoTech');
        return false;
      }
    };

    // 2. Disable Image Drag & Drop
    const handleDragStart = (e) => {
      if (siteSettings.disableImageDragging) {
        const target = e.target;
        if (target && (target.tagName === 'IMG' || target.closest('img') || target.tagName === 'PICTURE')) {
          e.preventDefault();
          return false;
        }
      }
    };

    // 3. Disable Inspect & DevTools keyboard shortcuts
    const handleKeyDown = (e) => {
      if (!siteSettings.disableInspect) return;

      const code = e.keyCode || e.which;
      const key = (e.key || '').toUpperCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // F12
      if (key === 'F12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Raccourci désactivé - Inspecteur protégé © TechnoTech');
        return false;
      }

      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      if (ctrlOrMeta && e.shiftKey && (key === 'I' || code === 73)) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Raccourci désactivé - Inspecteur protégé © TechnoTech');
        return false;
      }

      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if (ctrlOrMeta && e.shiftKey && (key === 'J' || code === 74)) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Console désactivée - Protection © TechnoTech');
        return false;
      }

      // Ctrl+Shift+C / Cmd+Opt+C (Inspect Element)
      if (ctrlOrMeta && e.shiftKey && (key === 'C' || code === 67)) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Inspecteur désactivé - Protection © TechnoTech');
        return false;
      }

      // Ctrl+U / Cmd+Opt+U (View Source)
      if (ctrlOrMeta && (key === 'U' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('🔒 Code source protégé © TechnoTech');
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if (ctrlOrMeta && (key === 'S' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [currentPath, siteSettings]);

  const handleToggleWishlist = () => {
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    showToast(
      nextState
        ? 'Ajouté à vos favoris'
        : 'Retiré de vos favoris'
    );
  };

  const handleAddToCart = (product, optionLabel) => {
    const itemId = product.id;
    const existingIndex = cartItems.findIndex(
      (item) => item.id === itemId && item.size === optionLabel
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: itemId,
          name: product.name,
          size: optionLabel || 'Standard',
          price: product.price || 149,
          quantity: 1,
          image: product.image || '/images/logo.png',
        },
      ]);
    }

    setIsCartOpen(true);
    showToast(`Article ajouté à votre panier !`);
  };

  const handleUpdateQuantity = (id, size, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (id, size) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.size === size))
    );
    showToast('Article retiré de votre panier');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order) => {
    setCartItems([]);
    showToast(`Commande #${order.orderNumber} enregistrée avec succès ! 🎉`);
  };

  const totalCartCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // If URL is /admin or starts with /admin, display the Admin Dashboard
  if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
    return (
      <div className="admin-app-root">
        <AdminDashboard
          products={products}
          onUpdateProducts={handleUpdateProducts}
          heroSlides={heroSlides}
          onUpdateHeroSlides={handleUpdateHeroSlides}
          offers={offers}
          onUpdateOffers={handleUpdateOffers}
          onNavigateStore={() => navigateTo('/')}
          siteSettings={siteSettings}
          onUpdateSettings={handleUpdateSettings}
        />
        {/* Interactive Toast Notification */}
        <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
          <Sparkles size={16} color="#ffa502" />
          <span>{toastMessage}</span>
        </div>
      </div>
    );
  }

  // Otherwise, display the Luxury Storefront (Home, About, Contact, or Offers)
  const isAboutPage = currentPath === '/about' || currentPath === '/a-propos';
  const isContactPage = currentPath === '/contact';
  const isOffersPage = currentPath === '/offers' || currentPath === '/offres';

  return (
    <div className={`app-container ${isOffersPage ? 'offers-view-active' : ''} ${isAboutPage ? 'about-view-active' : ''} ${isContactPage ? 'contact-view-active' : ''} ${siteSettings.disableImageDragging ? 'disable-img-drag' : ''}`}>
      {/* 1. Top Yellow Gift Announcement Bar */}
      <div className="top-gift-announcement-bar">
        <div className="announcement-content-wrap">
          <div className="announcement-badge">
            <Gift size={13} className="announcement-gift-icon" />
            <span>CADEAU OFFERT</span>
          </div>

          <div className="announcement-text-wrap">
            <span className="announcement-main-text">
              Pour toute commande supérieure à <strong>100 DT</strong>, recevez un <strong>cadeau exclusif offert</strong> ! 🎁
            </span>
            <span className="announcement-ar-text">
              (كل طلب يتجاوز 100 دينار يحصل على هدية مجانية خاصة 🎁)
            </span>
          </div>

          <button
            type="button"
            className="announcement-cta-btn"
            onClick={() => {
              if (currentPath !== '/') {
                navigateTo('/');
              }
              setTimeout(() => {
                const el = document.getElementById('store-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            title="Commander maintenant pour débloquer votre cadeau"
          >
            <span>Commander</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Smoothly cross-fading dynamic background color layers for each hero product */}
      {!isAboutPage && !isContactPage && !isOffersPage && heroSlides.map((slide, idx) => (
        <div
          key={slide.id || slide._id || idx}
          className={`bg-theme-layer ${idx === activeSlideIndex ? 'active' : ''}`}
          style={{
            background: `radial-gradient(ellipse 90% 75% at 50% 34%,
              ${slide.bgColor || '#e25816'} 0%,
              rgba(15, 23, 42, 0.72) 48%,
              rgba(10, 15, 30, 0.94) 75%,
              #060913 100%)`,
          }}
        />
      ))}
      {!isAboutPage && !isContactPage && !isOffersPage && <div className="bg-ambient-orb" />}

      {/* Top Floating Navbar (Root Level for Topmost Z-Index Stacking) */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isWishlisted={isWishlisted}
        onToggleWishlist={handleToggleWishlist}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onNavigateAdmin={() => navigateTo('/admin')}
        currentPath={currentPath}
        onNavigate={navigateTo}
      />

      {/* Main Page Routing Switch */}
      {isAboutPage ? (
        <AboutPage onNavigate={navigateTo} />
      ) : isContactPage ? (
        <ContactPage onNavigate={navigateTo} showToast={showToast} whatsappNumber={siteSettings.whatsappNumber} />
      ) : isOffersPage ? (
        <OffersPage
          offers={offers}
          products={products}
          onNavigate={navigateTo}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
          whatsappNumber={siteSettings.whatsappNumber}
        />
      ) : (
        <>
          <div className="content-layer">
            {/* Hero Section with Dynamic Slides & Customized Backgrounds */}
            <Hero
              slides={heroSlides}
              activeSlideIndex={activeSlideIndex}
              onSlideChange={(index) => {
                setActiveSlideIndex(index);
              }}
              products={products}
              onAddToCart={handleAddToCart}
              onNavigate={navigateTo}
            />
          </div>

          {/* Products Section with White Background & Gradient Transition */}
          <ProductsSection
            products={products}
            onAddToCart={handleAddToCart}
          />
        </>
      )}

      <div className="content-layer-bottom">
        {/* Bottom Footer */}
        <Footer onNavigate={navigateTo} whatsappNumber={siteSettings.whatsappNumber} />
      </div>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Luxury Checkout & Order Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Interactive Toast Notification */}
      <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
        <Sparkles size={16} color="#ffa502" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}

export default App;
