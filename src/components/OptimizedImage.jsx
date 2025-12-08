import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage Component - Image optimisée pour Lighthouse
 *
 * Features:
 * - Lazy loading natif
 * - Loading placeholder
 * - Responsive avec srcSet
 * - Alt text obligatoire pour accessibility
 * - Décoding async
 * - fetchpriority pour images critiques
 *
 * @param {Object} props
 * @param {string} props.src - URL de l'image
 * @param {string} props.alt - Texte alternatif (requis pour SEO)
 * @param {string} props.width - Largeur de l'image
 * @param {string} props.height - Hauteur de l'image
 * @param {string} props.className - Classes CSS
 * @param {string} props.style - Styles inline
 * @param {boolean} props.priority - Image critique (pas de lazy load)
 * @param {string} props.sizes - Sizes pour responsive
 * @param {string} props.srcSet - Source set pour différentes résolutions
 * @param {function} props.onLoad - Callback quand l'image est chargée
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  priority = false,
  sizes = '',
  srcSet = '',
  onLoad = () => {},
  placeholder = 'blur', // 'blur' | 'empty'
  objectFit = 'cover' // 'cover' | 'contain' | 'fill' | 'none'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Si priority=true, charger immédiatement

  useEffect(() => {
    if (priority) return; // Pas besoin d'observer si priority

    // Intersection Observer pour lazy loading manuel si nécessaire
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // Commencer à charger 50px avant d'être visible
      }
    );

    const imageElement = document.getElementById(`img-${src}`);
    if (imageElement) {
      observer.observe(imageElement);
    }

    return () => {
      if (imageElement) {
        observer.unobserve(imageElement);
      }
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  // Placeholder SVG pour éviter CLS (Cumulative Layout Shift)
  const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 100} ${height || 100}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;

  const containerStyle = {
    position: 'relative',
    width: width || '100%',
    height: height || 'auto',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    ...style
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0
  };

  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    filter: 'blur(10px)',
    transform: 'scale(1.1)',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out'
  };

  return (
    <div
      id={`img-${src}`}
      style={containerStyle}
      className={className}
    >
      {/* Placeholder flou */}
      {placeholder === 'blur' && !isLoaded && (
        <div style={placeholderStyle}>
          <img
            src={placeholderSvg}
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: objectFit }}
          />
        </div>
      )}

      {/* Image optimisée */}
      {(isInView || priority) && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          style={imageStyle}
        />
      )}
    </div>
  );
};

export default OptimizedImage;

/**
 * Utility: Génère un srcSet pour différentes résolutions
 * @param {string} baseUrl - URL de base de l'image
 * @param {Array} widths - Tableau de largeurs [640, 750, 828, 1080, 1200]
 * @returns {string} srcSet formaté
 */
export const generateSrcSet = (baseUrl, widths = [640, 750, 828, 1080, 1200]) => {
  // Si l'URL contient déjà une extension, on la retire pour ajouter les largeurs
  const extension = baseUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || '';
  const baseWithoutExt = baseUrl.replace(extension, '');

  return widths
    .map(width => `${baseWithoutExt}-${width}w${extension} ${width}w`)
    .join(', ');
};

/**
 * Utility: Génère sizes responsive
 * @param {Object} breakpoints - { mobile: '100vw', tablet: '50vw', desktop: '33vw' }
 * @returns {string} sizes formaté
 */
export const generateSizes = (breakpoints = {}) => {
  const defaults = {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw'
  };

  const sizes = { ...defaults, ...breakpoints };

  return [
    `(max-width: 640px) ${sizes.mobile}`,
    `(max-width: 1024px) ${sizes.tablet}`,
    sizes.desktop
  ].join(', ');
};
