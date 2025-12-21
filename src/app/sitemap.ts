import { MetadataRoute } from 'next';

// This function would ideally fetch dynamic data, e.g., from a CMS or database.
// For now, we'll keep it static as per the project's reliability guidelines.
async function fetchProductUrls(): Promise<string[]> {
  // In a real app, you'd fetch product slugs from your database:
  // const products = await db.collection('products').get();
  // return products.docs.map(doc => `/product/${doc.data().slug}`);
  return []; // Returning empty for now to avoid breaking the build.
}


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://purbanchal-hasta-udyog.com';

  // Static pages
  const staticRoutes = [
    '',
    '/purchase',
    '/our-stores',
    '/our-team',
    '/privacy-policy',
    '/help-center',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  // Dynamic product pages (if any)
  const productUrls = await fetchProductUrls();
  const productRoutes = productUrls.map(url => ({
    url: `${baseUrl}${url}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));


  return [...staticRoutes, ...productRoutes];
}
