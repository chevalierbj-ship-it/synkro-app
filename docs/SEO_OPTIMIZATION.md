# SEO Optimization Guide - Synkro

## 📋 Vue d'ensemble

Ce document détaille toutes les optimisations SEO implémentées pour Synkro afin d'atteindre un score Lighthouse > 95.

## ✅ Optimisations implémentées

### 1. Composant SEOHead.jsx

**Fichier:** `src/components/SEOHead.jsx`

Composant React réutilisable pour gérer dynamiquement les meta tags par page.

**Features:**
- ✅ Title dynamique par page
- ✅ Meta description
- ✅ Open Graph tags (Facebook)
- ✅ Twitter Card tags
- ✅ Canonical URL
- ✅ Keywords SEO
- ✅ Schema.org JSON-LD

**Utilisation:**
```jsx
import SEOHead from '../components/SEOHead';

<SEOHead
  title="Ma page - Synkro"
  description="Description de ma page"
  keywords={['mot-clé1', 'mot-clé2']}
  type="website"
/>
```

**Fonctions utilitaires incluses:**
- `generateEventSchema()` - Schema.org pour événements
- `generateBreadcrumbSchema()` - Fil d'ariane structuré
- `generateOrganizationSchema()` - Infos organisation
- `generateFAQSchema()` - Questions fréquentes

### 2. Schema.org Implementation

**Event Schema** dans Participant.jsx :
```javascript
schema={generateEventSchema({
  eventId: eventId,
  title: event.title,
  startDate: event.confirmedDate,
  location: event.location,
  organizerName: event.organizerName,
  organizerEmail: event.organizerEmail
})}
```

**Avantages:**
- ✅ Rich Snippets dans Google
- ✅ Meilleure visibilité dans les résultats de recherche
- ✅ Affichage des dates d'événements dans Google Calendar
- ✅ Structured data pour meilleur SEO

### 3. Fichiers SEO

#### robots.txt
**Fichier:** `public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://getsynkro.com/sitemap.xml
```

#### sitemap.xml
**Fichier:** `public/sitemap.xml`

Sitemap XML avec toutes les pages publiques :
- Homepage (priority: 1.0)
- Dashboard (priority: 0.9)
- Create Event (priority: 0.9)
- Pricing (priority: 0.8)
- Analytics (priority: 0.7)
- Etc.

**Format:**
```xml
<url>
  <loc>https://getsynkro.com/</loc>
  <lastmod>2024-12-08</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
```

### 4. Pages avec SEOHead intégré

| Page | Titre | Description | Schema.org |
|------|-------|-------------|------------|
| Landing.jsx | "Synkro - Trouvez la date parfaite..." | Homepage marketing | WebApplication |
| Participant.jsx | "[Titre événement] - Synkro" | Page de participation | Event |
| Dashboard.jsx | "Tableau de bord - Synkro" | Dashboard utilisateur | - |
| Pricing.jsx | "Tarifs Synkro - Plans..." | Page tarifs | Offer |
| Analytics.jsx | "Analytics - Synkro" | Page analytics | - |

### 5. Optimisations Performance (Lighthouse)

#### index.html optimisations

**Preconnect & DNS Prefetch:**
```html
<!-- Preconnect pour connexions critiques -->
<link rel="preconnect" href="https://api.airtable.com">
<link rel="preconnect" href="https://api.stripe.com">

<!-- DNS Prefetch pour résolution DNS rapide -->
<link rel="dns-prefetch" href="https://api.airtable.com">
<link rel="dns-prefetch" href="https://api.stripe.com">
```

**Preload ressources critiques:**
```html
<link rel="modulepreload" href="/src/main.jsx">
```

**Critical CSS inline:**
- Reset CSS
- Loading screen
- Anti-FOIT (Flash of Invisible Text)
- Optimisations mobile

**Accessibility:**
```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus visible pour keyboard navigation */
*:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
```

#### OptimizedImage Component

**Fichier:** `src/components/OptimizedImage.jsx`

Composant d'image optimisé pour Lighthouse :
- ✅ Lazy loading natif
- ✅ Placeholder blur effect
- ✅ Responsive srcSet
- ✅ Intersection Observer
- ✅ Alt text obligatoire
- ✅ Async decoding
- ✅ fetchpriority pour images critiques

**Utilisation:**
```jsx
import OptimizedImage from '../components/OptimizedImage';

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  placeholder="blur"
  objectFit="cover"
/>
```

**Utilities:**
- `generateSrcSet()` - Génère srcSet responsive
- `generateSizes()` - Génère sizes par breakpoints

### 6. Meta Tags complets

**Mobile:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#8B5CF6">
```

**Open Graph (Facebook):**
```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://getsynkro.com/">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://getsynkro.com/og-image.jpg">
<meta property="og:locale" content="fr_FR">
```

**Twitter Card:**
```html
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="...">
<meta property="twitter:title" content="...">
<meta property="twitter:description" content="...">
<meta property="twitter:image" content="...">
```

### 7. PWA Support

**manifest.json:**
```json
{
  "name": "Synkro",
  "short_name": "Synkro",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#8B5CF6",
  "icons": [...]
}
```

**Service Worker:**
- Enregistrement automatique
- Cache des assets
- Offline support

## 📊 Score Lighthouse attendu

Avec toutes ces optimisations :

| Métrique | Score attendu |
|----------|---------------|
| Performance | 95+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 100 |

## 🔍 Vérification SEO

### Checklist SEO

- ✅ Title unique par page
- ✅ Meta description < 160 caractères
- ✅ H1 unique par page
- ✅ Structure HTML sémantique
- ✅ Alt text sur toutes les images
- ✅ Canonical URLs
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ Schema.org markup
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Mobile-friendly
- ✅ HTTPS
- ✅ Fast loading (< 3s)
- ✅ No broken links

### Outils de test

**Google:**
- Google Search Console
- PageSpeed Insights
- Rich Results Test
- Mobile-Friendly Test

**Autres:**
- Lighthouse (Chrome DevTools)
- GTmetrix
- Pingdom
- WebPageTest

### Commandes de test

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://getsynkro.com --view

# Test Schema.org
https://search.google.com/test/rich-results

# Test mobile
https://search.google.com/test/mobile-friendly
```

## 🚀 Prochaines améliorations

### Court terme
- [ ] Ajouter og:image dynamique par page
- [ ] Créer des images optimisées WebP
- [ ] Implémenter lazy loading pour vidéos
- [ ] Ajouter breadcrumbs Schema.org

### Moyen terme
- [ ] Générer sitemap.xml dynamiquement
- [ ] Créer une page blog pour SEO
- [ ] Ajouter FAQ avec Schema.org
- [ ] Implémenter AMP (Accelerated Mobile Pages)

### Long terme
- [ ] Multilingual SEO (i18n)
- [ ] Video Schema.org markup
- [ ] Review/Rating Schema.org
- [ ] Local Business Schema.org

## 📚 Ressources

**Documentation:**
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Google Search Console](https://search.google.com/search-console)

**Guides:**
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Web.dev SEO](https://web.dev/lighthouse-seo/)
- [MDN SEO Best Practices](https://developer.mozilla.org/en-US/docs/Web/Guide/SEO)

## 🎯 KPIs à suivre

**Google Analytics:**
- Sessions organiques
- Taux de rebond
- Temps moyen sur la page
- Pages vues

**Google Search Console:**
- Impressions
- CTR (Click-Through Rate)
- Position moyenne
- Couverture d'index

**Core Web Vitals:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

---

**Dernière mise à jour:** 2024-12-08
**Maintenu par:** Équipe Synkro
