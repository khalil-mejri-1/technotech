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

    const barFill = preloaderEl.querySelector('.initial-preloader-bar-fill');
    const statusText = preloaderEl.querySelector('.initial-preloader-status');

    // Smoothly progress to completion once React has mounted
    const t1 = setTimeout(() => {
      if (barFill) {
        barFill.style.width = '100%';
        barFill.style.animation = 'none';
      }
      if (statusText) {
        statusText.textContent = 'Bienvenue';
      }
    }, 450);

    // Fade out overlay smoothly
    const t2 = setTimeout(() => {
      preloaderEl.classList.add('fade-out');
    }, 850);

    // Remove from layout after fade transition finishes
    const t3 = setTimeout(() => {
      preloaderEl.style.display = 'none';
      if (onFinish) onFinish();
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return null;
}

