/**
 * Google Analytics 4 (GA4) Service for TechnoTech
 * Measurement ID: G-EQQZHW6ZWQ
 *
 * Provides safe, non-blocking, PII-free eCommerce & interaction tracking.
 */

export const GA_MEASUREMENT_ID = 'G-EQQZHW6ZWQ';
const TRACKED_PURCHASES_KEY = 'technotech_tracked_orders';

// Detect if debug mode is active (Vite dev mode or ?debug_ga=true URL query)
const isDebugMode = () => {
  try {
    if (typeof window === 'undefined') return false;
    const isDev = Boolean(import.meta.env?.DEV);
    const hasQueryParam = window.location.search.includes('debug_ga=true');
    return isDev || hasQueryParam;
  } catch {
    return false;
  }
};

/**
 * Safe wrapper to invoke window.gtag without throwing errors or blocking execution.
 */
function sendGtag(command, ...args) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag(command, ...args);
      if (isDebugMode()) {
        console.groupCollapsed(`%c[GA4 Analytics]%c ${command}: ${args[0] || ''}`, 'color: #ff7828; font-weight: bold;', 'color: inherit;');
        console.log('Command:', command);
        console.log('Arguments:', args);
        console.groupEnd();
      }
    } else if (isDebugMode()) {
      console.warn(`[GA4 Analytics] window.gtag is not defined. Event skipped:`, command, args);
    }
  } catch (err) {
    // Non-blocking: never crash the UI if analytics fails
    console.warn('[GA4 Analytics] Error sending gtag event:', err);
  }
}

/**
 * Format product object to standard GA4 eCommerce item schema
 */
function formatItem(item, quantity = 1) {
  if (!item) return null;
  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || Number(quantity) || 1;
  const itemId = String(item.id || item._id || item.productId || 'item').trim();
  const itemName = String(item.name || item.title || 'Produit TechnoTech').trim();

  const formatted = {
    item_id: itemId,
    item_name: itemName,
    price,
    quantity: qty,
  };

  if (item.category) {
    formatted.item_category = String(item.category);
  }
  if (item.size || item.duration || item.plan) {
    formatted.item_variant = String(item.size || item.duration || item.plan);
  }
  if (item.brand || !item.brand) {
    formatted.item_brand = 'TechnoTech';
  }

  return formatted;
}

// Track whether initial page view was already handled by the gtag script in index.html
let hasRecordedInitialPageView = false;

export const analytics = {
  /**
   * Track general custom event
   */
  trackEvent(eventName, params = {}) {
    if (!eventName) return;
    const payload = { ...params };
    if (isDebugMode()) {
      payload.debug_mode = true;
    }
    sendGtag('event', eventName, payload);
  },

  /**
   * Track SPA Page View on client-side route navigation
   * Prevents duplicate page_view on initial page mount.
   */
  trackPageView(pagePath, pageTitle) {
    try {
      // If this is the initial mount, index.html gtag('config') already triggered initial page_view.
      if (!hasRecordedInitialPageView) {
        hasRecordedInitialPageView = true;
        if (isDebugMode()) {
          console.log('[GA4 Analytics] Initial page view handled by Google Tag snippet in index.html.');
        }
        return;
      }

      const payload = {
        page_path: pagePath || window.location.pathname,
        page_location: window.location.href,
        page_title: pageTitle || document.title,
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'page_view', payload);
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking page view:', err);
    }
  },

  /**
   * Track viewing product details (view_item)
   */
  trackViewItem(product, selectedPlan = null) {
    try {
      if (!product) return;

      const activePrice = selectedPlan?.price !== undefined
        ? Number(selectedPlan.price)
        : Number(product.price) || 0;

      const variant = selectedPlan?.duration || product.size || 'Standard';
      const item = formatItem(
        {
          ...product,
          price: activePrice,
          size: variant,
        },
        1
      );

      const payload = {
        currency: 'TND',
        value: activePrice,
        items: [item],
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'view_item', payload);
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking view_item:', err);
    }
  },

  /**
   * Track adding product to cart (add_to_cart)
   */
  trackAddToCart(product, quantity = 1, selectedPlan = null) {
    try {
      if (!product) return;

      const activePrice = selectedPlan?.price !== undefined
        ? Number(selectedPlan.price)
        : Number(product.price) || 0;

      const qty = Number(quantity) || 1;
      const variant = selectedPlan?.duration || product.size || 'Standard';

      const item = formatItem(
        {
          ...product,
          price: activePrice,
          size: variant,
        },
        qty
      );

      const payload = {
        currency: 'TND',
        value: activePrice * qty,
        items: [item],
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'add_to_cart', payload);
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking add_to_cart:', err);
    }
  },

  /**
   * Track beginning checkout process (begin_checkout)
   */
  trackBeginCheckout(items = [], totalValue = 0) {
    try {
      if (!Array.isArray(items) || items.length === 0) return;

      const formattedItems = items.map((it) => formatItem(it, it.quantity)).filter(Boolean);
      const computedValue = Number(totalValue) || formattedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

      const payload = {
        currency: 'TND',
        value: computedValue,
        items: formattedItems,
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'begin_checkout', payload);
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking begin_checkout:', err);
    }
  },

  /**
   * Track successful purchase (purchase)
   *
   * STRICT REQUIREMENTS:
   * 1. Only called AFTER successful backend order creation (res.ok, HTTP 201).
   * 2. Excludes all PII (no customer name, phone, address, notes, email).
   * 3. Prevents duplicate purchase tracking on page refresh or component re-renders.
   */
  trackPurchase(order) {
    try {
      if (!order) return false;

      // Ensure this is a real order, not a local fallback or offline placeholder
      if (order.isLocal) {
        if (isDebugMode()) {
          console.warn('[GA4 Analytics] Purchase skipped: order is local fallback (backend not reached).');
        }
        return false;
      }

      const transactionId = String(order.orderNumber || order._id || '').trim();
      if (!transactionId) {
        if (isDebugMode()) {
          console.warn('[GA4 Analytics] Purchase skipped: missing transaction ID.');
        }
        return false;
      }

      // Check sessionStorage to prevent duplicate purchase events
      let tracked = [];
      try {
        const stored = sessionStorage.getItem(TRACKED_PURCHASES_KEY);
        tracked = stored ? JSON.parse(stored) : [];
      } catch {
        tracked = [];
      }

      if (Array.isArray(tracked) && tracked.includes(transactionId)) {
        if (isDebugMode()) {
          console.log(`[GA4 Analytics] Purchase already tracked for order ${transactionId}. Skipping to prevent duplicate.`);
        }
        return false;
      }

      const orderItems = Array.isArray(order.items) ? order.items : [];
      const formattedItems = orderItems.map((it) => formatItem(it, it.quantity)).filter(Boolean);

      const computedTotal = formattedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const finalValue = order.totalAmount !== undefined ? Number(order.totalAmount) : computedTotal;

      // PII-SAFE Payload: contains only eCommerce transaction details
      const payload = {
        transaction_id: transactionId,
        value: finalValue,
        currency: 'TND',
        items: formattedItems,
        payment_type: order.paymentMethod || 'Paiement à la livraison',
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'purchase', payload);

      // Save transactionId into sessionStorage to lock duplicate tracking
      try {
        tracked.push(transactionId);
        sessionStorage.setItem(TRACKED_PURCHASES_KEY, JSON.stringify(tracked));
      } catch {
        // Safe failover
      }

      return true;
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking purchase:', err);
      return false;
    }
  },

  /**
   * Track lead generation (generate_lead)
   * Used for contact forms and inquiries, completely PII-free.
   */
  trackGenerateLead(leadInfo = {}) {
    try {
      const payload = {
        lead_type: leadInfo.form_name || 'contact_form',
        currency: 'TND',
        value: Number(leadInfo.value) || 0,
      };

      if (isDebugMode()) {
        payload.debug_mode = true;
      }

      sendGtag('event', 'generate_lead', payload);
    } catch (err) {
      console.warn('[GA4 Analytics] Error tracking generate_lead:', err);
    }
  },
};

export default analytics;
