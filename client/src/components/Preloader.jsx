import React, { useState, useEffect } from 'react';

/**
 * Luxury Minimalist Preloader for TechnoTech
 * Provides an ultra-smooth, premium loading screen on site entrance.
 */
export default function Preloader({ onFinish }) {
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Elegant, smooth simulated progress progression
    const t1 = setTimeout(() => setProgress(60), 220);
    const t2 = setTimeout(() => setProgress(100), 680);
    const t3 = setTimeout(() => setIsFadingOut(true), 980);
    const t4 = setTimeout(() => {
      setShouldRender(false);
      if (onFinish) onFinish();
    }, 1580);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  if (!shouldRender) return null;

  return (
    <div className={`site-preloader-root ${isFadingOut ? 'fade-out' : ''}`} aria-hidden="true">
      <div className="preloader-ambient-glow" />

      <div className="preloader-content">
        {/* Glowing Brand Mark */}
        <div className="preloader-logo-wrapper">
          <div className="preloader-logo-glow-ring" />
          <img
            src="/images/logo.png"
            alt="TechnoTech Logo"
            className="preloader-logo-img"
          />
        </div>

        {/* Minimalist Luxury Typography */}
        <div className="preloader-brand-title">
          <span className="brand-techno">Techno</span><span className="brand-tech">Tech</span>
        </div>
        <div className="preloader-subtitle">PRODUITS DIGITAUX &amp; ABONNEMENTS OFFICIELS</div>

        {/* Ultra-sleek Neon Loading Line */}
        <div className="preloader-progress-track">
          <div
            className="preloader-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="preloader-status-text">
          {progress < 100 ? 'Initialisation sécurisée...' : 'Bienvenue'}
        </div>
      </div>
    </div>
  );
}
