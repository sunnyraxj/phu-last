
'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
    status: 'pending' | 'shipped' | 'delivered';
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

    const ordersQuery = useMemoFirebase(() => collection(firestore, 'orders'), [firestore]);
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

    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores } = useCollection<Store>(storesQuery);
    
    const adminActionCount = useMemo(() => {
        if (userData?.role !== 'admin' || !orders || !allProducts) return 0;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const outOfStock = allProducts.filter(p => !p.inStock).length;
        return pendingOrders + outOfStock;
    }, [orders, allProducts, userData]);

    const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
      // Dummy function, as cart management is handled on the main page.
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
        adminActionCount={adminActionCount}
      />

      <main className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Meet Our Team</h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
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
              <div className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="relative h-96 w-96 mx-auto rounded-lg overflow-hidden shadow-2xl">
                     <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        className="object-cover"
                        data-ai-hint={founder['data-ai-hint']}
                      />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-lg font-semibold text-primary">{founder.role}</p>
                    <h2 className="text-5xl font-bold text-foreground mt-2">{founder.name}</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">{founder.bio}</p>
                  </div>
                </div>
              </div>
            )}
            
            {managementMembers.length > 0 && (
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Management</h2>
                        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                            The leaders guiding our vision and strategy.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                        {managementMembers.map((member) => (
                           <Card key={member.id} className="flex flex-col md:flex-row items-center gap-6 p-6">
                               <div className="relative h-40 w-40 shrink-0 rounded-full overflow-hidden shadow-lg">
                                   <Image
                                       src={member.image}
                                       alt={member.name}
                                       fill
                                       className="object-cover"
                                       data-ai-hint={member['data-ai-hint']}
                                   />
                               </div>
                               <div className="text-center md:text-left">
                                   <h3 className="text-2xl font-semibold text-foreground">{member.name}</h3>
                                   <p className="text-primary font-medium">{member.role}</p>
                                   <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto md:mx-0">{member.bio}</p>
                               </div>
                           </Card>
                        ))}
                    </div>
                </div>
            )}

            {otherTeamMembers.length > 0 && (
                <div>
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Dedicated Team</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {otherTeamMembers.map((member) => (
                        <div key={member.id} className="text-center">
                        <div className="relative h-64 w-64 mx-auto rounded-full overflow-hidden mb-4 shadow-lg">
                            <Image
                            src={member.image}
                            alt={member.name}
                            width={400}
                            height={400}
                            className="object-cover"
                            data-ai-hint={member['data-ai-hint']}
                            />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground">{member.name}</h2>
                        <p className="text-primary font-medium">{member.role}</p>
                        <p className="mt-2 text-muted-foreground max-w-xs mx-auto">{member.bio}</p>
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


        <div className="text-center mt-20">
          <Link href="/">
            <Button size="lg">Back to Shopping</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
