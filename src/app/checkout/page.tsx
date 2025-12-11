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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';

const shippingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

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

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
  });

  const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const cartItemsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'cart') : null,
    [firestore, user]
  );
  const { data: cartData, isLoading: cartLoading } = useCollection<{ productId: string; quantity: number }>(cartItemsQuery);

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


  const onSubmit = async (data: ShippingFormValues) => {
    if (!user || cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: 'Error',
        description: "Your cart is empty or you are not logged in.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);

      // Create Order document
      const orderRef = doc(collection(firestore, 'orders'));
      batch.set(orderRef, {
        customerId: user.uid,
        orderDate: serverTimestamp(),
        totalAmount: totalAmount,
        status: 'pending',
        shippingDetails: data,
        subtotal: subtotal,
        shippingFee: shippingFee,
        gstAmount: gstAmount
      });

      // Create OrderItem documents and delete cart items
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

      toast({
        title: 'Order Placed!',
        description: 'Your order has been successfully placed.',
      });

      router.push(`/order-confirmation/${orderRef.id}`);

    } catch (error) {
      console.error("Order placement error:", error);
      toast({
        variant: "destructive",
        title: 'Uh oh!',
        description: 'There was a problem placing your order.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || cartLoading) {
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
                <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} id="shipping-form" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...register('address')} />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register('city')} />
                        {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register('state')} />
                    {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" {...register('pincode')} />
                    {errors.pincode && <p className="text-sm text-destructive">{errors.pincode.message}</p>}
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                </div>
                </form>
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
                         <Button type="submit" form="shipping-form" size="lg" className="w-full" disabled={isSubmitting}>
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
