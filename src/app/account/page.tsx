
'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { PlusCircle, Edit, Trash2, Home, Building, Briefcase, Star } from 'lucide-react';
import { AddressForm, AddressFormValues } from '@/components/account/AddressForm';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type ShippingAddress = AddressFormValues & { id: string };

export default function AccountPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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
      await deleteDocumentNonBlocking(addressRef);
      toast({ title: "Address Deleted", description: "The address has been removed." });
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user || !addresses) return;
    const batch = writeBatch(firestore);
    addresses.forEach(addr => {
        const addressRef = doc(firestore, 'users', user.uid, 'shippingAddresses', addr.id);
        if (addr.id === addressId) {
            batch.update(addressRef, { isDefault: true });
        } else if (addr.isDefault) {
            batch.update(addressRef, { isDefault: false });
        }
    });
    await batch.commit();
    toast({ title: "Default Address Updated", description: "Your preferred shipping address has been set." });
  };

  const handleEditSubmit = async (formData: AddressFormValues) => {
      if (!user || !selectedAddress) return;
      
      const batch = writeBatch(firestore);
      const addressRef = doc(firestore, 'users', user.uid, 'shippingAddresses', selectedAddress.id);
      
      // If setting this address as default, unset other defaults
      if (formData.isDefault && addresses) {
          addresses.forEach(addr => {
              if (addr.id !== selectedAddress.id && addr.isDefault) {
                  const otherAddressRef = doc(firestore, 'users', user.uid, 'shippingAddresses', addr.id);
                  batch.update(otherAddressRef, { isDefault: false });
              }
          });
      }
      
      batch.update(addressRef, { ...formData });
      
      await batch.commit();
      
      toast({ title: "Address Updated", description: "Your address has been successfully updated." });
      setIsEditFormOpen(false);
      setSelectedAddress(null);
  };

  const getAddressIcon = (addressType: AddressFormValues['addressType']) => {
    switch (addressType) {
        case 'Home': return <Home className="h-4 w-4" />;
        case 'Work': return <Briefcase className="h-4 w-4" />;
        case 'Other': return <Building className="h-4 w-4" />;
        default: return <Home className="h-4 w-4" />;
    }
  }

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.sort((a,b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map((address) => (
                  <Card key={address.id} className="flex flex-col">
                    <CardHeader className="flex-row items-start gap-4 pb-2">
                        <div className="mt-1">{getAddressIcon(address.addressType)}</div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {address.addressType}
                                {address.isDefault && <Badge variant="outline"><Star className="h-3 w-3 mr-1" /> Default</Badge>}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="font-semibold">{address.name}</p>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                      <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                      <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(address)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAddressToDelete(address)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                        {!address.isDefault && (
                            <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                                Set as Default
                            </Button>
                        )}
                    </CardFooter>
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
            <DialogContent className="sm:max-w-md">
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
                        This will permanently delete this shipping address. This action cannot be undone.
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
