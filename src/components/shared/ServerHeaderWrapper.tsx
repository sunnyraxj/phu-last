
import { initializeAdminApp } from '@/firebase/admin';
import { Header } from './Header';

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
};

type Store = {
    id: string;
    name: string;
    image?: string;
};

async function getHeaderData() {
    const { firestore } = initializeAdminApp();
    const productsPromise = firestore.collection('products').get();
    const storesPromise = firestore.collection('stores').get();
    
    const [productsSnapshot, storesSnapshot] = await Promise.all([
        productsPromise,
        storesPromise
    ]);

    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Store[];

    return { products, stores };
}

export async function ServerHeaderWrapper() {
    const { products, stores } = await getHeaderData();
    return <Header products={products} stores={stores} />;
}
