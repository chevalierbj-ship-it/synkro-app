import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEOHead Component - Gère les meta tags SEO dynamiquement par page
 *
 * @param {Object} props
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description de la page
 * @param {string} props.canonical - URL canonique (optionnel)
 * @param {string} props.image - URL de l'image OG (optionnel)
 * @param {string} props.type - Type de contenu OG (default: website)
 * @param {Object} props.schema - Schema.org JSON-LD (optionnel)
 * @param {Array} props.keywords - Mots-clés SEO (optionnel)
 */
const SEOHead = ({
  title = 'Synkro - Trouvez la date parfaite en 1 minute | Organisation d\'événements',
  description = 'Organisez vos événements sans stress. Synkro trouve automatiquement la meilleure date pour votre groupe. Plus de 47 messages pour un simple dîner, c\'est fini !',
  canonical = null,
  image = 'https://synkro-app-bice.vercel.app/og-image.jpg',
  type = 'website',
  schema = null,
  keywords = ['organisation événement', 'trouver date', 'coordination groupe', 'planification réunion', 'doodle alternative']
}) => {
  const location = useLocation();
  const baseUrl = 'https://synkro-app-bice.vercel.app';
  const currentUrl = canonical || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Primary meta tags
    updateMetaTag('title', title);
    updateMetaTag('description', description);
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    // Open Graph / Facebook
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:site_name', 'Synkro', true);
    updateMetaTag('og:locale', 'fr_FR', true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:url', currentUrl, true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Add or update Schema.org JSON-LD
    if (schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"][data-dynamic]');

      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('data-dynamic', 'true');
        document.head.appendChild(schemaScript);
      }

      schemaScript.textContent = JSON.stringify(schema);
    }

    // Cleanup function
    return () => {
      // Reset to default title when component unmounts
      document.title = 'Synkro - Organisation d\'événements';
    };
  }, [title, description, canonical, image, type, schema, keywords, currentUrl]);

  // This component doesn't render anything
  return null;
};

export default SEOHead;

/**
 * Utility function to generate Schema.org Event markup
 * @param {Object} event - Event data
 * @returns {Object} Schema.org Event JSON-LD
 */
export const generateEventSchema = (event) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title || event.name,
    description: event.description || `Événement organisé via Synkro`,
    startDate: event.startDate || event.confirmedDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.location
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    location: event.location ? {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location
      }
    } : {
      '@type': 'VirtualLocation',
      url: `https://synkro-app-bice.vercel.app/event/${event.eventId}`
    },
    organizer: {
      '@type': event.organizerType === 'Organization' ? 'Organization' : 'Person',
      name: event.organizerName,
      email: event.organizerEmail
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://synkro-app-bice.vercel.app/event/${event.eventId}`,
      validFrom: new Date().toISOString()
    }
  };

  // Add image if available
  if (event.image) {
    schema.image = event.image;
  }

  // Add performer if event type is performance
  if (event.type === 'concert' || event.type === 'spectacle') {
    schema.performer = {
      '@type': 'PerformingGroup',
      name: event.performerName || event.organizerName
    };
  }

  return schema;
};

/**
 * Utility function to generate BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of {name, url}
 * @returns {Object} Schema.org BreadcrumbList JSON-LD
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
};

/**
 * Utility function to generate Organization schema
 * @returns {Object} Schema.org Organization JSON-LD
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Synkro',
    url: 'https://synkro-app-bice.vercel.app',
    logo: 'https://synkro-app-bice.vercel.app/icons/icon-512x512.png',
    description: 'Application de coordination d\'événements. Trouvez la date parfaite pour votre groupe en 1 minute.',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['French', 'English']
    }
  };
};

/**
 * Utility function to generate FAQ schema
 * @param {Array} faqs - Array of {question, answer}
 * @returns {Object} Schema.org FAQPage JSON-LD
 */
export const generateFAQSchema = (faqs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};
