
import { MetadataRoute } from 'next';

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
    '/b2b',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticRoutes];
}
