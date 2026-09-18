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
  const isLogoPlaceholder =
    !src ||
    src === '/images/logo.png' ||
    src.endsWith('/images/logo.png') ||
    src === 'logo.png' ||
    src.endsWith('/logo.png');

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Réinitialiser l'état dès que la source change
  useEffect(() => {
    if (isLogoPlaceholder) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);

    // Si l'image réelle est déjà en cache dans le navigateur
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, isLogoPlaceholder]);

  const showSkeleton = !isLoaded || hasError || isLogoPlaceholder;

  return (
    <div className="card-bg-image-wrapper">
      {/* 1. Simple glowing frosted glass skeleton on exact image size */}
      {showSkeleton && (
        <div className="simple-glass-skeleton card-glass-skeleton">
          <div className="simple-skeleton-shimmer" />
        </div>
      )}

      {/* 2. IMAGE RÉELLE: Affichée UNIQUEMENT lorsqu'elle est prête et n'est pas le logo par défaut */}
      {!isLogoPlaceholder && (
        <img
          ref={imgRef}
          src={src}
          alt=""
          className={`${className} ${!showSkeleton ? 'image-visible' : 'image-hidden'}`}
          loading={loading}
          draggable="false"
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
            setIsLoaded(false);
          }}
        />
      )}

      {/* 3. OVERLAY GRADIENT */}
      {overlay || <div className="card-bg-overlay" />}
    </div>
  );
}
