import { MetadataRoute } from 'next';
import { getDocs, collection, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase outside of the component to avoid re-initialization
const { firestore } = initializeFirebase();

type Product = {
  id: string;
};

type Store = {
  id: string;
}

type TeamMember = {
    id: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://purbanchal-hasta-udyog.com'; // Replace with your actual domain

  // Get all products
  const productsSnapshot = await getDocs(collection(firestore, 'products'));
  const products = productsSnapshot.docs.map(doc => doc.data() as Product);
  const productUrls = products.map(product => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Get all stores
  const storesSnapshot = await getDocs(collection(firestore, 'stores'));
  const stores = storesSnapshot.docs.map(doc => doc.data() as Store);
  const storeUrls = stores.map(store => ({
    url: `${baseUrl}/store/${store.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  
  // Get all team members
  const teamMembersSnapshot = await getDocs(collection(firestore, 'teamMembers'));
  const teamMembers = teamMembersSnapshot.docs.map(doc => doc.data() as TeamMember);
  const teamMemberUrls = teamMembers.map(member => ({
      url: `${baseUrl}/team/${member.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
  }));


  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/purchase`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/our-stores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/our-team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  return [...staticUrls, ...productUrls, ...storeUrls, ...teamMemberUrls];
}
