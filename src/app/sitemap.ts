import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Dynamically generates the sitemap including all active experience pages
 * to ensure maximum indexing efficiency for SEO.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://maromaexperience.com';
  
  // Static Routes
  const routes = [
    '',
    '/schools',
    '/corporate',
    '/simulator',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Tour Routes
  try {
    const { firestore } = initializeFirebase();
    const toursQuery = query(collection(firestore, 'tours'), where('isActive', '==', true));
    const snapshot = await getDocs(toursQuery);
    
    const tourRoutes = snapshot.docs.map((doc) => ({
      url: `${baseUrl}/tours/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...routes, ...tourRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
