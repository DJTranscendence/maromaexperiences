import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file to guide search engine crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/confirm-booking/'],
    },
    sitemap: 'https://maromaexperience.com/sitemap.xml',
  };
}
