
'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from "@/components/shared/Header";
import { useMemo } from "react";

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

type CartItem = Product & { quantity: number; cartItemId: string; };

type Store = {
    id: string;
    name: string;
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

    const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
      // Dummy function, as cart management is handled on the main page.
    };

    const sortedTeamMembers = useMemo(() => {
      if (!teamMembers) return null;
      const roleOrder = { 'Founder': 1, 'Management': 2, 'Team Member': 3 };
      return [...teamMembers].sort((a, b) => (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4));
    }, [teamMembers]);


  return (
    <div className="bg-background">
      <Header 
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        stores={stores || []}
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
        ) : sortedTeamMembers && sortedTeamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {sortedTeamMembers.map((member) => (
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
