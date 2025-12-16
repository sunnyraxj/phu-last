

'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from "@/components/shared/Header";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";


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

export default function OurStoresPage() {
    const firestore = useFirestore();
    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);

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
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {stores.map((store) => (
                        <CarouselItem key={store.id} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3">
                            <div className="p-1">
                                <Card className="overflow-hidden flex flex-col h-full">
                                    {store.image && (
                                        <div className="relative h-40 sm:h-48 w-full">
                                            <Image
                                                src={store.image}
                                                alt={store.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={store['data-ai-hint']}
                                            />
                                        </div>
                                    )}
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base font-bold truncate">{store.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex-grow space-y-2">
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
                                    <div className="p-3 pt-0 mt-auto">
                                        <Link href={store.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full text-xs">
                                                View on Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">No store locations have been added yet.</p>
            </div>
        )}
      </main>
    </div>
  );
}
