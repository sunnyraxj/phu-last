
'use client';

import { useMemo } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Header } from "@/components/shared/Header";
import placeholderImages from '@/lib/placeholder-images.json';
import { Card } from '@/components/ui/card';

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  "data-ai-hint": string;
  collection: string;
  material: string;
  inStock: boolean;
  description: string;
  artisanId: string;
};

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval';
};

type CartItem = Product & { quantity: number; cartItemId: string; };

type Store = {
    id:string;
    name:string;
    image?:string;
}

export default function AboutPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData } = useDoc<{ role: string }>(userDocRef);

    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: allProducts } = useCollection<Product>(productsQuery);

    const isAuthorizedAdmin = userData?.role === 'admin';

    const ordersQuery = useMemoFirebase(() =>
        (isAuthorizedAdmin) ? query(collection(firestore, 'orders'), where('status', 'in', ['pending', 'pending-payment-approval'])) : null,
        [firestore, isAuthorizedAdmin]
    );
    const { data: orders } = useCollection<Order>(ordersQuery);

    const outOfStockQuery = useMemoFirebase(() => 
        (isAuthorizedAdmin) ? query(collection(firestore, 'products'), where('inStock', '==', false)) : null,
        [firestore, isAuthorizedAdmin]
    );
    const { data: outOfStockProducts } = useCollection<Product>(outOfStockQuery);

    const returnsQuery = useMemoFirebase(() => 
        (isAuthorizedAdmin) ? query(collection(firestore, 'returnRequests'), where('status', '==', 'pending-review')) : null,
        [firestore, isAuthorizedAdmin]
    );
    const { data: returnRequests } = useCollection<any>(returnsQuery);


    const cartItemsQuery = useMemoFirebase(() =>
      user ? collection(firestore, 'users', user.uid, 'cart') : null,
      [firestore, user]
    );
    const { data: cartData } = useCollection<{ productId: string; quantity: number }>(cartItemsQuery);

    const cartItems = useMemo(() => {
      if (!cartData || !allProducts) return [];
      return cartData.map(cartItem => {
        const product = allProducts.find(p => p.id === cartItem.productId);
        return product ? { ...product, quantity: cartItem.quantity, cartItemId: cartItem.id } : null;
      }).filter((item): item is CartItem => item !== null);
    }, [cartData, allProducts]);
    
    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores } = useCollection<Store>(storesQuery);
    
    const adminActionCounts = useMemo(() => {
        if (userData?.role !== 'admin') {
            return { pendingOrders: 0, outOfStockProducts: 0, pendingReturns: 0 };
        }
        return { 
            pendingOrders: orders?.length || 0,
            outOfStockProducts: outOfStockProducts?.length || 0,
            pendingReturns: returnRequests?.length || 0
        };
    }, [orders, outOfStockProducts, returnRequests, userData]);

    const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
      // Dummy function
    };

    return (
        <div className="bg-background">
            <Header 
                userData={userData}
                cartItems={cartItems}
                updateCartItemQuantity={updateCartItemQuantity}
                stores={stores || []}
                products={allProducts || []}
                adminActionCounts={adminActionCounts}
            />

            <section className="bg-primary text-primary-foreground py-20">
                <div className="container mx-auto text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Our Story</h1>
                </div>
            </section>
            
            <main className="container mx-auto py-12 sm:py-16 px-4">
                <Card className="max-w-4xl mx-auto overflow-hidden shadow-lg border-none bg-card">
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">From Village Roots to a Wider Vision</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Established in 1986 as Kamrup Handicraft, our journey began in the small village of Barkulhati. In 2019, we became Purbanchal Hasta Udyog, symbolizing our growth and unwavering dedication to reviving the timeless crafts of Northeast India.
                        </p>
                    </div>
                </Card>

                <div className="max-w-4xl mx-auto my-12 sm:my-16">
                     <div className="p-6 sm:p-8">
                         <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">The Founders' Vision</h2>
                         <p className="text-muted-foreground leading-relaxed mb-4">
                            Our story began with a simple yet powerful idea: to uplift rural artisans. Two brothers, Mr. Islam Ahmed and the late Ramjan Ali, started Kamrup Handicraft in their village with a passion to empower their community. 
                         </p>
                         <p className="text-muted-foreground leading-relaxed">
                            Ruby Ahmed, wife of Islam Ahmed, was the first woman to actively participate, providing unwavering support that became the cornerstone of our family-driven mission.
                        </p>
                    </div>
                </div>

                 <Card className="max-w-4xl mx-auto overflow-hidden shadow-lg border-none bg-card">
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Preserving the Soul of Craft</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            From humble beginnings with cane baskets to a diverse range of jute bags and sophisticated home décor, our products reflect sustainability and constant innovation.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            But our real pride lies in the hands that create them — the women and men across Assam who find income, dignity, and a renewed sense of purpose through this collective. This is more than a business; it’s a movement to preserve the soul of handmade craftsmanship.
                        </p>
                    </div>
                </Card>
                 <div className="text-center mt-16">
                    <Link href="/purchase">
                        <Button size="lg">Explore Our Crafts</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
