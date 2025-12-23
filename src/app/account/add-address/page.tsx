
'use client';

import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddressForm, AddressFormValues } from '@/components/account/AddressForm';
import { Header } from '@/components/shared/Header';
import { useToast } from '@/hooks/use-toast';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddAddressPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const handleAddSubmit = async (formData: AddressFormValues) => {
        if (!user || !user.email) return;
        const addressesCollection = collection(firestore, 'users', user.uid, 'shippingAddresses');
        
        try {
            await addDocumentNonBlocking(addressesCollection, { 
                ...formData, 
                userId: user.uid,
                email: user.email // Also save user's email with address
            });
            toast({ title: "Address Saved", description: "Your new address has been saved." });
            const redirectUrl = searchParams.get('redirect') || '/account';
            router.push(redirectUrl);
        } catch (e) {
            console.error(e);
            toast({variant: "destructive", title: "Could not save address"});
        }
    };

    const handleCancel = () => {
        const redirectUrl = searchParams.get('redirect') || '/account';
        router.push(redirectUrl);
    };

    if (isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
    }
    
    if (!user || user.isAnonymous) {
        router.push('/login?redirect=/account/add-address');
        return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
    }

    return (
        <div className="bg-background min-h-screen">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-4 sm:py-12 px-0 sm:px-4">
                <Card className="max-w-2xl mx-auto sm:shadow-sm sm:border rounded-none sm:rounded-lg">
                    <CardHeader>
                        <CardTitle>Add New Address</CardTitle>
                        <CardDescription>Enter the details for your new shipping address.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddressForm
                            onSuccess={handleAddSubmit}
                            onCancel={handleCancel}
                            address={null}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
