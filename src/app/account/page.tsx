
'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AddressForm, AddressFormValues } from '@/components/account/AddressForm';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';

type ShippingAddress = AddressFormValues & { id: string };

export default function AccountPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<ShippingAddress | null>(null);

  const addressesQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'shippingAddresses') : null),
    [firestore, user]
  );
  const { data: addresses, isLoading: addressesLoading } = useCollection<ShippingAddress>(addressesQuery);

  const handleEditClick = (address: ShippingAddress) => {
    setSelectedAddress(address);
    setIsEditFormOpen(true);
  };
  
  const handleDeleteAddress = async () => {
    if (user && addressToDelete) {
      const addressRef = doc(firestore, 'users', user.uid, 'shippingAddresses', addressToDelete.id);
      deleteDocumentNonBlocking(addressRef);
      setAddressToDelete(null);
    }
  };

  const handleEditSubmit = (formData: AddressFormValues) => {
      if (!user || !selectedAddress) return;
      const addressRef = doc(firestore, 'users', user.uid, 'shippingAddresses', selectedAddress.id);
      setDocumentNonBlocking(addressRef, { ...formData, userId: user.uid }, { merge: true });
      setIsEditFormOpen(false);
      setSelectedAddress(null);
  };

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
  }

  if (!user || user.isAnonymous) {
    router.push('/login?redirect=/account');
    return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
  }

  return (
    <div className="bg-background">
      <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

      <main className="container mx-auto py-8 sm:py-12 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">My Account</h1>

        <Card>
          <CardHeader>
            <CardTitle>My Addresses</CardTitle>
            <CardDescription>Manage your saved shipping addresses.</CardDescription>
          </CardHeader>
          <CardContent>
            {addressesLoading ? (
              <div className="flex justify-center items-center h-40">
                <PottersWheelSpinner />
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <Card key={address.id} className="p-4 flex flex-col">
                    <div className="flex-grow">
                      <p className="font-semibold">{address.name}</p>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                      <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                      <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(address)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAddressToDelete(address)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You have no saved addresses.</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/account/add-address?redirect=/account">
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Address</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Address</DialogTitle>
                     <DialogDescription>
                        Update your shipping address details.
                    </DialogDescription>
                </DialogHeader>
                <AddressForm
                    onSuccess={handleEditSubmit}
                    onCancel={() => setIsEditFormOpen(false)}
                    address={selectedAddress}
                />
            </DialogContent>
        </Dialog>


        <AlertDialog open={!!addressToDelete} onOpenChange={(isOpen) => !isOpen && setAddressToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this shipping address.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAddressToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
