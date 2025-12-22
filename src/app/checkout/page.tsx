

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import placeholderImages from '@/lib/placeholder-images.json';
import { isValidImageDomain } from '@/lib/utils';

type ShippingAddress = AddressFormValues & { id: string, email?: string };

type Product = {
  id: string;
  name: string;
  gst: number;
  images: string[];
  inStock: boolean;
  baseMrp?: number;
  variants?: { size: string; price: number }[];
};

type CartItem = Product & { quantity: number; cartItemId: string; selectedSize?: string; };

const UPI_ID = 'gpay-12190144290@okbizaxis';
const PAYEE_NAME = 'Purbanchal Hasta Udyog';

export default function CheckoutPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedPaymentPercentage, setSelectedPaymentPercentage] = useState<number>(1);
  const [utr, setUtr] = useState('');
  const [transactionId, setTransactionId] = useState('');


  const { reset } = useForm<AddressFormValues>();

  const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const cartItemsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'cart') : null,
    [firestore, user]
  );
  const { data: cartData, isLoading: cartLoading } = useCollection<{ productId: string; quantity: number; selectedSize?: string }>(cartItemsQuery);

  const addressesQuery = useMemoFirebase(
    () => (user && !user.isAnonymous ? collection(firestore, 'users', user.uid, 'shippingAddresses') : null),
    [firestore, user]
  );
  const { data: addresses, isLoading: addressesLoading } = useCollection<ShippingAddress>(addressesQuery);

  useEffect(() => {
    // Generate a unique transaction ID when the component mounts
    setTransactionId(`PHU${Date.now()}`);
  }, []);

  const cartItems: CartItem[] = useMemo(() => {
    if (!cartData || !allProducts) return [];
    return cartData.map(cartItem => {
      const product = allProducts.find(p => p.id === cartItem.productId);
      return product ? { ...product, ...cartItem, cartItemId: cartItem.id } as CartItem : null;
    }).filter((item): item is CartItem => item !== null);
  }, [cartData, allProducts]);

  const getCartItemPrice = (item: CartItem): number => {
      if (item.variants && item.variants.length > 0) {
          const selectedVariant = item.variants.find(v => v.size === item.selectedSize);
          if (selectedVariant) {
              return selectedVariant.price;
          }
          return item.variants[0].price; // Default to first variant if no selection
      }
      return item.baseMrp || 0;
  };

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + getCartItemPrice(item) * item.quantity, 0), [cartItems]);
  const shippingFee = useMemo(() => subtotal > 0 && subtotal < 1000 ? 79 : 0, [subtotal]);
  const totalAmount = subtotal + shippingFee;
  
  const { totalGST, cgst, sgst, igst } = useMemo(() => {
    const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
    let totalGST = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    cartItems.forEach(item => {
        const itemPrice = getCartItemPrice(item);
        const itemTotal = itemPrice * item.quantity;
        const gstRate = (item.gst || 5) / 100;
        const itemGST = itemTotal - (itemTotal / (1 + gstRate));
        totalGST += itemGST;
    });

    if (selectedAddress?.state.toLowerCase() === 'assam') {
        cgst = totalGST / 2;
        sgst = totalGST / 2;
    } else {
        igst = totalGST;
    }

    return { totalGST, cgst, sgst, igst };
  }, [cartItems, addresses, selectedAddressId]);
  
  const priceBeforeTax = subtotal - totalGST;
  
  const paymentPercentages = useMemo(() => {
    const options = [{ value: 1, label: 'Full Payment' }];
    if (totalAmount > 40000) {
        options.push({ value: 0.5, label: '50% Advance' });
    }
    return options;
  }, [totalAmount]);

  useEffect(() => {
    if (totalAmount > 40000) {
        setSelectedPaymentPercentage(0.5); // Default to 50% advance if available
    } else {
        setSelectedPaymentPercentage(1); // Default to full payment
    }
  }, [totalAmount]);

  const advanceAmount = useMemo(() => totalAmount * selectedPaymentPercentage, [totalAmount, selectedPaymentPercentage]);
  const remainingAmount = useMemo(() => totalAmount - advanceAmount, [totalAmount, advanceAmount]);
  
  const qrCodeUrl = useMemo(() => {
    if (!advanceAmount || advanceAmount <= 0 || !transactionId) return null;
    
    const upiLink = new URL('upi://pay');
    upiLink.searchParams.set('pa', UPI_ID);
    upiLink.searchParams.set('pn', PAYEE_NAME);
    upiLink.searchParams.set('am', advanceAmount.toFixed(2));
    upiLink.searchParams.set('cu', 'INR');
    upiLink.searchParams.set('tn', `Order for ${transactionId}`);

    const qrApiUrl = new URL('https://api.qrserver.com/v1/create-qr-code/');
    qrApiUrl.searchParams.set('size', '200x200');
    qrApiUrl.searchParams.set('data', upiLink.toString());

    return qrApiUrl.toString();
  }, [advanceAmount, transactionId]);

  const handleNewAddressSubmit = (formData: AddressFormValues) => {
    if (!user) return;
    const addressesCollection = collection(firestore, 'users', user.uid, 'shippingAddresses');
    const newAddressRef = doc(addressesCollection);
    const newAddressData = { 
        ...formData, 
        userId: user.uid, 
        id: newAddressRef.id,
        email: user.email // Also save user's email with address
    };
    setDoc(newAddressRef, newAddressData).then(() => {
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
    
    if (user.isAnonymous) {
      router.push('/login?redirect=/checkout');
      return;
    }
    
    if (!selectedAddressId) {
      toast({ variant: "destructive", title: 'Error', description: "Please select or add a shipping address." });
      return;
    }

    if (!utr || utr.trim().length === 0) {
        toast({ variant: "destructive", title: 'Error', description: "Please enter the UTR number from your UPI app." });
        return;
    }
    
    const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
    if (!selectedAddress || !user.email) {
        toast({ variant: "destructive", title: 'Error', description: "Selected address not found or user email is missing." });
        return;
    }
    
    const finalShippingDetails = { ...selectedAddress, email: user.email };

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, 'orders'));

      const orderData = {
        id: orderRef.id,
        customerId: user.uid,
        orderDate: serverTimestamp(),
        totalAmount: totalAmount,
        status: 'pending-payment-approval' as const,
        shippingDetails: finalShippingDetails,
        subtotal: subtotal,
        shippingFee: shippingFee,
        gstAmount: totalGST,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        paymentMethod: selectedPaymentPercentage === 1 ? ('UPI_FULL' as const) : ('UPI_PARTIAL' as const),
        paymentDetails: {
            advanceAmount: advanceAmount,
            remainingAmount: remainingAmount,
            utr: utr,
            paymentPercentage: selectedPaymentPercentage,
            transactionId: transactionId,
        }
      };

      batch.set(orderRef, orderData);
      
      for (const item of cartItems) {
        const orderItemRef = doc(collection(firestore, 'orderItems'));
        batch.set(orderItemRef, {
          orderId: orderRef.id,
          productId: item.id,
          quantity: item.quantity,
          price: getCartItemPrice(item),
          productName: item.name,
          productImage: item.images?.[0] || null,
          size: item.selectedSize,
        });

        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.cartItemId);
        batch.delete(cartItemRef);
      }

      await batch.commit();

      toast({ title: 'Order Placed!', description: 'Your order has been placed and is pending payment approval.' });
      router.push(`/receipt/${orderRef.id}`);

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

  if (!user) {
      // This case should be handled by the provider, but as a fallback
      return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
  }

  if (user && !user.isAnonymous && addresses?.length === 0 && !showNewAddressForm) {
      setShowNewAddressForm(true);
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
            <div className="space-y-8">
                {user.isAnonymous ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Login to Continue</CardTitle>
                      <CardDescription>Please log in or create an account to proceed with your order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => router.push('/login?redirect=/checkout')} className="w-full">
                        Login or Sign Up
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                <>
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

                            <Dialog open={showNewAddressForm} onOpenChange={setShowNewAddressForm}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Address
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add a New Address</DialogTitle>
                                        <DialogDescription>Enter the details for your new shipping address.</DialogDescription>
                                    </DialogHeader>
                                    <AddressForm 
                                        onSuccess={handleNewAddressSubmit} 
                                        onCancel={() => setShowNewAddressForm(false)}
                                        address={null}
                                    />
                                </DialogContent>
                            </Dialog>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardHeader>
                          <CardTitle>Payment</CardTitle>
                          <CardDescription>{totalAmount > 40000 ? 'An advance payment option is available for this order.' : 'Full payment is required for this order.'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          {paymentPercentages.length > 1 && (
                              <div>
                                  <Label className="font-semibold">Select Payment Option</Label>
                                  <RadioGroup value={String(selectedPaymentPercentage)} onValueChange={(val) => setSelectedPaymentPercentage(Number(val))} className="flex flex-wrap gap-2 mt-2">
                                      {paymentPercentages.map(p => (
                                          <Label key={p.value} htmlFor={`payment-${p.value}`} className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary flex-1 justify-center min-w-[120px]">
                                              <RadioGroupItem value={String(p.value)} id={`payment-${p.value}`} />
                                              <span>{p.label}</span>
                                          </Label>
                                      ))}
                                  </RadioGroup>
                              </div>
                          )}

                          <div className="flex flex-col md:flex-row items-center gap-6 p-4 border rounded-lg bg-muted/30">
                              <div className="w-40 h-40 p-2 bg-white rounded-md flex items-center justify-center">
                                  {qrCodeUrl ? (
                                      <Image src={qrCodeUrl} alt="UPI QR Code" width={150} height={150} unoptimized />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <PottersWheelSpinner />
                                      </div>
                                  )}
                              </div>
                              <div className="space-y-2 text-center md:text-left">
                                  <p className="font-semibold">Scan to pay with any UPI app</p>
                                  <p className="text-sm text-muted-foreground">You need to pay an amount of:</p>
                                  <p className="text-2xl font-bold text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(advanceAmount)}</p>
                                  <p className="text-xs text-muted-foreground">UPI ID: {UPI_ID}</p>
                              </div>
                          </div>

                          <div>
                              <Label htmlFor="utr" className="font-semibold">Enter UTR Number</Label>
                               <p className="text-xs text-muted-foreground mb-2">
                                  After payment, find the 12-digit UTR/Transaction ID in your UPI app's history and enter it below.
                              </p>
                              <Input 
                                  id="utr" 
                                  value={utr}
                                  onChange={(e) => setUtr(e.target.value)}
                                  placeholder="12-digit UTR Number"
                              />
                          </div>
                      </CardContent>
                  </Card>
                </>
              )}
            </div>

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
                            <Image src={isValidImageDomain(item.images?.[0]) ? item.images[0] : placeholderImages.product.url} alt={item.name} fill className="object-cover" />
                            </div>
                            <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                        </div>
                        <p className="font-semibold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(getCartItemPrice(item) * item.quantity)}
                        </p>
                        </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Subtotal (incl. Tax)</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Shipping Fee</p>
                            <p>{shippingFee > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(shippingFee) : 'Free'}</p>
                        </div>
                         <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <p>Total</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}</p>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2">
                            <p>Includes a total of {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalGST)} in taxes.</p>
                        </div>
                    </div>
                     <Separator />
                     <div className="space-y-2">
                        <div className="flex justify-between font-semibold text-primary">
                            <p>{selectedPaymentPercentage === 1 ? 'Amount to Pay' : 'Advance to Pay'}</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(advanceAmount)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Remaining Amount</p>
                            <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(remainingAmount)}</p>
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={onSubmit} size="lg" className="w-full" disabled={isSubmitting || !!user?.isAnonymous || !selectedAddressId}>
                            {isSubmitting ? <PottersWheelSpinner /> : 'Place Order'}
                        </Button>
                    </CardFooter>
                </Card>
                 {!selectedAddressId && !user?.isAnonymous && (
                    <Alert variant="destructive">
                        <AlertTitle>Address Required</AlertTitle>
                        <AlertDescription>
                            Please select or add a shipping address to calculate taxes and place your order.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
        </main>
    </div>
  );
}
