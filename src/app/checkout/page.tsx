'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { AddressForm, AddressFormValues } from '@/components/account/AddressForm';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle } from 'lucide-react';

type ShippingAddress = AddressFormValues & { id: string };

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
};

type CartItem = Product & { quantity: number; cartItemId: string; };

const GST_RATE = 0.05; // 5%

export default function CheckoutPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const { reset } = useForm<AddressFormValues>();

  const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const cartItemsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'cart') : null,
    [firestore, user]
  );
  const { data: cartData, isLoading: cartLoading } = useCollection<{ productId: string; quantity: number }>(cartItemsQuery);

  const addressesQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'shippingAddresses') : null),
    [firestore, user]
  );
  const { data: addresses, isLoading: addressesLoading } = useCollection<ShippingAddress>(addressesQuery);

  const cartItems = useMemo(() => {
    if (!cartData || !allProducts) return [];
    return cartData.map(cartItem => {
      const product = allProducts.find(p => p.id === cartItem.productId);
      return product ? { ...product, quantity: cartItem.quantity, cartItemId: cartItem.id } : null;
    }).filter((item): item is CartItem => item !== null);
  }, [cartData, allProducts]);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const shippingFee = useMemo(() => subtotal > 0 && subtotal < 1000 ? 79 : 0, [subtotal]);
  const totalAmount = subtotal + shippingFee;
  const gstAmount = useMemo(() => subtotal * (GST_RATE / (1 + GST_RATE)), [subtotal]);
  const priceBeforeTax = subtotal - gstAmount;

  const handleNewAddressSubmit = (formData: AddressFormValues) => {
    if (!user) return;
    const addressesCollection = collection(firestore, 'users', user.uid, 'shippingAddresses');
    const newAddressRef = doc(addressesCollection);
    setDoc(newAddressRef, { ...formData, userId: user.uid, id: newAddressRef.id }).then(() => {
        setSelectedAddressId(newAddressRef.id);
        setShowNewAddressForm(false);
        reset();
    });
  };

  const onSubmit = async () => {
    if (!user || cartItems.length === 0) {
      toast({ variant: "destructive", title: 'Error', description: "Your cart is empty or you are not logged in." });
      return;
    }
    
    if (!selectedAddressId) {
      toast({ variant: "destructive", title: 'Error', description: "Please select or add a shipping address." });
      return;
    }
    
    const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
        toast({ variant: "destructive", title: 'Error', description: "Selected address not found." });
        return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, 'orders'));
      batch.set(orderRef, {
        customerId: user.uid,
        orderDate: serverTimestamp(),
        totalAmount: totalAmount,
        status: 'pending',
        shippingDetails: selectedAddress,
        subtotal: subtotal,
        shippingFee: shippingFee,
        gstAmount: gstAmount
      });

      for (const item of cartItems) {
        const orderItemRef = doc(collection(firestore, 'orderItems'));
        batch.set(orderItemRef, {
          orderId: orderRef.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          productName: item.name,
          productImage: item.image,
        });

        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.cartItemId);
        batch.delete(cartItemRef);
      }

      await batch.commit();
      toast({ title: 'Order Placed!', description: 'Your order has been successfully placed.' });
      router.push(`/order-confirmation/${orderRef.id}`);

    } catch (error) {
      console.error("Order placement error:", error);
      toast({ variant: "destructive", title: 'Uh oh!', description: 'There was a problem placing your order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || cartLoading || addressesLoading) {
    return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
  }

  if (!user || user.isAnonymous) {
      router.push('/login?redirect=/checkout');
      return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
  }

  if (cartItems.length === 0 && !cartLoading) {
    return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
            <h2 className="text-2xl font-semibold">Your cart is empty</h2>
            <Button onClick={() => router.push('/purchase')}>Continue Shopping</Button>
        </div>
    )
  }

  return (
    <div className="bg-background">
        <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />
        <main className="container mx-auto py-8 sm:py-12 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                    <CardDescription>Select a saved address or add a new one.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={selectedAddressId || undefined} onValueChange={setSelectedAddressId} className="space-y-4">
                        {addresses && addresses.map(address => (
                            <Label key={address.id} htmlFor={address.id} className="flex items-start gap-4 border rounded-md p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary">
                                <RadioGroupItem value={address.id} id={address.id} />
                                <div className="text-sm">
                                    <p className="font-semibold">{address.name}</p>
                                    <p className="text-muted-foreground">{address.address}</p>
                                    <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                                    <p className="text-muted-foreground">Phone: {address.phone}</p>
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                    
                    <Separator className="my-6" />

                    {showNewAddressForm ? (
                       <div>
                         <h3 className="text-lg font-semibold mb-4">Add a New Address</h3>
                         <AddressForm 
                            isOpen={true} 
                            onClose={() => setShowNewAddressForm(false)} 
                            onSubmit={handleNewAddressSubmit} 
                            address={null}
                          />
                       </div>
                    ) : (
                        <Button variant="outline" onClick={() => setShowNewAddressForm(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Address
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.cartItemId} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                        </div>
                        <p className="font-semibold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                        </p>
                        </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Shipping Fee</p>
                            <p>{shippingFee > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(shippingFee) : 'Free'}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Total before tax</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(priceBeforeTax)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">GST (5% included)</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(gstAmount)}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}</p>
                    </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={onSubmit} size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <PottersWheelSpinner /> : 'Place Order'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
        </main>
    </div>
  );
}
