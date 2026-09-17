import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import ProductsSection from './components/ProductsSection.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import { Sparkles } from 'lucide-react';
import { getStoredProducts, saveStoredProducts, INITIAL_PRODUCTS, getStoredHeroSlides, saveStoredHeroSlides } from './data/productsData.js';
import { productService } from './services/productService.js';

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [products, setProducts] = useState(getStoredProducts);
  const [heroSlides, setHeroSlides] = useState(() => getStoredHeroSlides(getStoredProducts()));
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

  // Synchronize products and hero slides directly with MongoDB Atlas database
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
    };

    fetchFromDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

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
          onNavigateStore={() => navigateTo('/')}
        />
        {/* Interactive Toast Notification */}
        <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
          <Sparkles size={16} color="#ffa502" />
          <span>{toastMessage}</span>
        </div>
      </div>
    );
  }

  // Otherwise, display the Luxury Storefront
  return (
    <div className="app-container">
      {/* Smoothly cross-fading dynamic background color layers for each hero product */}
      {heroSlides.map((slide, idx) => (
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
      <div className="bg-ambient-orb" />

      {/* Top Floating Navbar (Root Level for Topmost Z-Index Stacking) */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isWishlisted={isWishlisted}
        onToggleWishlist={handleToggleWishlist}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onNavigateAdmin={() => navigateTo('/admin')}
      />

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
        />
      </div>

      {/* New Products Section with White Background & Gradient Transition */}
      <ProductsSection
        products={products}
        onAddToCart={handleAddToCart}
      />

      <div className="content-layer-bottom">
        {/* Bottom Footer */}
        <Footer />
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
