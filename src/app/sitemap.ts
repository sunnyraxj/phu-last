import { MetadataRoute } from 'next';
import { initializeAdminApp } from '@/firebase/admin';

async function fetchProductUrls(): Promise<string[]> {
  try {
    const { firestore } = initializeAdminApp();
    const productsSnapshot = await firestore.collection('products').get();
    const urls = productsSnapshot.docs.map(doc => `/purchase/${doc.id}`);
    return urls;
  } catch (error) {
    console.error('Error fetching product URLs for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://purbanchal-hasta-udyog.com';

  const staticRoutes = [
    '',
    '/purchase',
    '/our-stores',
    '/our-team',
    '/about',
    '/privacy-policy',
    '/help-center',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const productUrls = await fetchProductUrls();
  const productRoutes = productUrls.map(url => ({
    url: `${baseUrl}${url}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
