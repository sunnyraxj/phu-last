
import { initializeAdminApp } from "@/firebase/admin";
import { HomePageClient } from "@/components/home/HomePageClient";

type Product = {
  id: string;
  name: string;
  images: string[];
  "data-ai-hint": string;
  category: string;
  material: string;
  inStock: boolean;
  description: string;
  artisanId: string;
  baseMrp?: number;
  variants?: { size: string; price: number }[];
  createdAt: { seconds: number; nanoseconds: number; };
};

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    image: string;
    'data-ai-hint'?: string;
    socialLink?: string;
};

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
    'data-ai-hint'?: string;
};

type MaterialSetting = {
    id: string;
    name: string;
    imageUrl: string;
};

type SiteSettings = {
    heroImageUrl?: string;
    heroImageUrlMobile?: string;
};

type BrandLogo = {
    id: string;
    name: string;
    logoUrl: string;
};

type PageData = {
  allProducts: Product[];
  newArrivals: Product[];
  teamMembers: TeamMember[];
  stores: Store[];
  materialSettings: MaterialSetting[];
  siteSettings: SiteSettings | null;
  brandLogos: BrandLogo[];
};

async function getPageData(): Promise<PageData> {
  const { firestore } = initializeAdminApp();
  
  const productsPromise = firestore.collection('products').get();
  const newArrivalsPromise = firestore.collection('products').orderBy('createdAt', 'desc').limit(5).get();
  const teamMembersPromise = firestore.collection('teamMembers').get();
  const storesPromise = firestore.collection('stores').get();
  const materialSettingsPromise = firestore.collection('materialSettings').get();
  const siteSettingsPromise = firestore.collection('siteSettings').doc('homepage').get();
  const brandLogosPromise = firestore.collection('brandLogos').get();

  const [
    productsSnapshot,
    newArrivalsSnapshot,
    teamMembersSnapshot,
    storesSnapshot,
    materialSettingsSnapshot,
    siteSettingsDoc,
    brandLogosSnapshot,
  ] = await Promise.all([
    productsPromise,
    newArrivalsPromise,
    teamMembersPromise,
    storesPromise,
    materialSettingsPromise,
    siteSettingsPromise,
    brandLogosPromise,
  ]);

  const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  const newArrivals = newArrivalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  const teamMembers = teamMembersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamMember[];
  const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Store[];
  const materialSettings = materialSettingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaterialSetting[];
  const siteSettings = siteSettingsDoc.exists ? siteSettingsDoc.data() as SiteSettings : null;
  const brandLogos = brandLogosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BrandLogo[];

  return {
    allProducts,
    newArrivals,
    teamMembers,
    stores,
    materialSettings,
    siteSettings,
    brandLogos,
  };
}

export default async function ProductPage() {
    const pageData = await getPageData();
    
    return <HomePageClient {...pageData} />;
}
