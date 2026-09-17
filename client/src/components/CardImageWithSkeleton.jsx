import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Composant d'image avec Skeleton Loader professionnel et luxueux.
 * Empêche l'affichage de l'image par défaut ou d'une image brisée pendant le chargement.
 * Affiche une animation de vague Shimmer fluide et élégante jusqu'à ce que l'image soit 100% prête.
 */
export default function CardImageWithSkeleton({
  src,
  alt = 'Produit TechnoTech',
  className = 'card-featured-img',
  overlay = null,
  loading = 'lazy',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Réinitialiser l'état de chargement dès que la source de l'image change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // Si l'image est déjà en cache dans le navigateur
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className="card-bg-image-wrapper">
      {/* 1. SKELETON LOADER HAUT DE GAMME (Visible pendant le chargement) */}
      {!isLoaded && (
        <div className={`card-skeleton-layer ${hasError ? 'skeleton-error' : ''}`}>
          {/* Vague Shimmer animée ultra-fluide */}
          <div className="skeleton-shimmer-sweep" />

          {/* Badge central stylisé avec effet de respiration néon */}
          <div className="skeleton-center-content">
            <div className="skeleton-glowing-orb">
              <Sparkles size={24} className="skeleton-sparkle-glow" />
            </div>
            <span className="skeleton-brand-title">TECHNOTECH</span>
            <div className="skeleton-pulse-bar">
              <div className="skeleton-progress-indeterminate" />
            </div>
          </div>
        </div>
      )}

      {/* 2. IMAGE RÉELLE (Invisible avec transition fluide dès le chargement) */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'image-visible' : 'image-hidden'}`}
        loading={loading}
        draggable="false"
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
      />

      {/* 3. OVERLAY GRADIENT */}
      {overlay || <div className="card-bg-overlay" />}
    </div>
  );
}
