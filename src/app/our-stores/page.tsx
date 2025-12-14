

'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from "@/components/shared/Header";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, ExternalLink } from "lucide-react";

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
    'data-ai-hint'?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
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

export default function OurStoresPage() {
    const firestore = useFirestore();
    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);

    const { user } = useUser();
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData } = useDoc<{ role: string }>(userDocRef);

    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: allProducts } = useCollection<Product>(productsQuery);

    const ordersQuery = useMemoFirebase(() => 
      (userData?.role === 'admin') ? collection(firestore, 'orders') : null,
      [firestore, userData]
    );
    const { data: orders } = useCollection<Order>(ordersQuery);

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
    
    const adminActionCounts = useMemo(() => {
        if (userData?.role !== 'admin' || !orders || !allProducts) {
            return { pendingOrders: 0, outOfStockProducts: 0, pendingReturns: 0 };
        }
        const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'pending-payment-approval').length;
        const outOfStockProducts = allProducts.filter(p => !p.inStock).length;
        const pendingReturns = 0; // Assuming this needs to be implemented
        return { pendingOrders, outOfStockProducts, pendingReturns };
    }, [orders, allProducts, userData]);

    const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
      // Dummy function, as this is handled elsewhere.
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

      <main className="container mx-auto py-8 sm:py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Our Store Locations</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
            Find a Purbanchal Hasta Udyog store near you.
          </p>
        </div>

        {storesLoading ? (
            <div className="flex justify-center items-center h-64">
                <PottersWheelSpinner />
            </div>
        ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stores.map((store) => (
                    <Card key={store.id} className="overflow-hidden flex flex-col">
                        {store.image && (
                            <div className="relative h-48 sm:h-56 w-full">
                                <Image
                                    src={store.image}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={store['data-ai-hint']}
                                />
                            </div>
                        )}
                        <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="text-sm sm:text-base font-bold truncate">{store.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 flex-grow space-y-2">
                            <div className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <p className="text-xs">{store.address}</p>
                            </div>
                             {store.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <p className="text-xs">{store.phone}</p>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-3 sm:p-4 pt-0 mt-auto">
                             <Link href={store.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full text-xs">
                                    View on Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">No store locations have been added yet.</p>
            </div>
        )}
      </main>
    </div>
  );
}
