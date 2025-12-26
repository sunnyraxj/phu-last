

'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from "@/components/shared/Header";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    image: string;
    'data-ai-hint'?: string;
    socialLink?: string;
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

type Store = {
    id: string;
    name: string;
    image?: string;
};

export default function OurTeamPage() {
    const firestore = useFirestore();
    const teamMembersQuery = useMemoFirebase(() => collection(firestore, 'teamMembers'), [firestore]);
    const { data: teamMembers, isLoading: teamMembersLoading } = useCollection<TeamMember>(teamMembersQuery);

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
      // Dummy function, as cart management is handled elsewhere.
    };

    const { founder, managementMembers, teamMembers: otherTeamMembers } = useMemo(() => {
        if (!teamMembers) return { founder: null, managementMembers: [], teamMembers: [] };
        const founderMember = teamMembers.find(member => member.role === 'Founder');
        const management = teamMembers.filter(member => member.role === 'Management');
        const others = teamMembers.filter(member => member.role === 'Team Member');
        return { founder: founderMember, managementMembers: management, teamMembers: others };
    }, [teamMembers]);


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
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Meet Our Team</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
            The passionate individuals dedicated to bringing you the finest handcrafted goods.
          </p>
        </div>

        {teamMembersLoading ? (
            <div className="flex justify-center items-center h-64">
                <PottersWheelSpinner />
            </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <>
            {founder && (
              <div className="mb-12 md:mb-16">
                <div className="flex flex-row items-center justify-center gap-8 md:gap-12 text-center">
                   <div className="relative h-32 w-32 md:h-48 md:w-48 rounded-lg overflow-hidden shadow-2xl group">
                     <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint={founder['data-ai-hint']}
                      />
                  </div>
                  <div className="text-left flex-1 max-w-lg">
                    <h3 className="text-2xl font-bold">{founder.name}</h3>
                    <p className="text-sm text-muted-foreground">{founder.role}</p>
                  </div>
                </div>
              </div>
            )}
            
            {managementMembers.length > 0 && (
                <div className="mb-12 md:mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Management</h2>
                    </div>
                     <Carousel opts={{ align: "start" }} className="w-full">
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {managementMembers.map((member) => (
                          <CarouselItem key={member.id} className="pl-4 md:pl-6 basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                              <Card className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg group">
                                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl">
                                  <Image
                                      src={member.image}
                                      alt={member.name}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      data-ai-hint={member['data-ai-hint']}
                                  />
                                </div>
                                <div className="p-4 text-left bg-white">
                                  <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 mb-3">{member.role}</p>
                                  {member.socialLink ? (
                                        <Link href={member.socialLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                            <Button size="sm" className="w-full rounded-full">Follow +</Button>
                                        </Link>
                                    ) : (
                                        <Button size="sm" className="w-full rounded-full" disabled>Follow +</Button>
                                    )}
                                </div>
                              </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                </div>
            )}

            {otherTeamMembers.length > 0 && (
                <div>
                     <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Dedicated Team</h2>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                    {otherTeamMembers.map((member) => (
                        <div key={member.id} className="relative aspect-square rounded-full overflow-hidden group shadow-lg">
                            <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={member['data-ai-hint']}
                            />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <div className="text-white">
                                 <h3 className="font-bold text-sm sm:text-base">{member.name}</h3>
                                 <p className="text-xs sm:text-sm opacity-90">{member.role}</p>
                               </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
          </>
        ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">No team members have been added yet.</p>
            </div>
        )}


        <div className="text-center mt-16">
          <Link href="/">
            <Button size="lg">Back to Shopping</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
