

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

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    bio: string;
    image: string;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                   <div className="relative h-80 w-80 sm:h-96 sm:w-96 mx-auto rounded-lg overflow-hidden shadow-2xl group">
                     <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint={founder['data-ai-hint']}
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                       <div className="absolute bottom-0 left-0 p-4 text-white">
                           <h3 className="text-2xl font-bold">{founder.name}</h3>
                           <p className="text-sm opacity-90">{founder.role}</p>
                       </div>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">{founder.bio}</p>
                  </div>
                </div>
              </div>
            )}
            
            {managementMembers.length > 0 && (
                <div className="mb-12 md:mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Management</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {managementMembers.map((member) => (
                           <div key={member.id} className="relative aspect-[4/5] rounded-lg overflow-hidden group shadow-lg">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                    data-ai-hint={member['data-ai-hint']}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-4 text-white transition-all duration-300 group-hover:bottom-4">
                                   <h3 className="text-xl font-bold">{member.name}</h3>
                                   <p className="text-xs opacity-90">{member.role}</p>
                                   <p className="text-sm mt-2 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-40 transition-all duration-300 overflow-hidden">{member.bio}</p>
                               </div>
                           </div>
                        ))}
                    </div>
                </div>
            )}

            {otherTeamMembers.length > 0 && (
                <div>
                     <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Dedicated Team</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
