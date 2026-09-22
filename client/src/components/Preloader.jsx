import React, { useEffect } from 'react';

/**
 * Luxury Minimalist Preloader Controller for TechnoTech
 * Controls the instant HTML preloader (#site-preloader) defined in index.html,
 * guaranteeing 0ms display (zero white screen or unstyled content flash on reload),
 * an ultra-smooth progress bar transition, and an elegant fade out.
 */
export default function Preloader({ onFinish }) {
  useEffect(() => {
    const preloaderEl = document.getElementById('site-preloader');
    if (!preloaderEl) {
      if (onFinish) onFinish();
      return;
    }

    // Fade out overlay smoothly after the glowing circle finishes drawing
    const t1 = setTimeout(() => {
      preloaderEl.classList.add('fade-out');
    }, 1350);

    // Remove from layout after fade transition finishes
    const t2 = setTimeout(() => {
      preloaderEl.style.display = 'none';
      if (onFinish) onFinish();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return null;
}

