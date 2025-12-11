'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';


type Order = {
  id: string;
  customerId: string;
  orderDate: { seconds: number; nanoseconds: number; };
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  gstAmount: number;
  status: 'pending' | 'shipped' | 'delivered';
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
};

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const orderRef = useMemoFirebase(() => doc(firestore, 'orders', orderId as string), [firestore, orderId]);
  const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);
  
  const orderItemsQuery = useMemoFirebase(() => 
    orderId ? query(collection(firestore, 'orderItems'), where('orderId', '==', orderId)) : null,
    [firestore, orderId]
  );
  const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);

  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // Security check
  if (!orderLoading && order && user && order.customerId !== user.uid) {
      router.push('/');
      return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />
      <main className="container mx-auto py-8 sm:py-12 px-4">
        {orderLoading || itemsLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
        ) : order && orderItems ? (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center bg-muted/30 p-6">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <CardTitle className="text-2xl sm:text-3xl">Thank you for your order!</CardTitle>
                <CardDescription className="text-base">
                    Your order has been placed and is being processed.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4">Tax Invoice</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <p className="text-muted-foreground">Order ID:</p>
                          <p className="font-mono text-xs break-all">{order.id}</p>
                      </div>
                       <div className="text-right">
                          <p className="text-muted-foreground">Order Date:</p>
                          <p>{formatDate(order.orderDate)}</p>
                      </div>
                  </div>
              </div>

              <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/3">Product</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orderItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                                           <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                                        </div>
                                        <span className="font-medium">{item.productName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                  <div>
                      <h4 className="font-semibold mb-2">Shipping To:</h4>
                      <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{order.shippingDetails.name}</p>
                          <p>{order.shippingDetails.address}</p>
                          <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
                          <p>Phone: {order.shippingDetails.phone}</p>
                      </div>
                  </div>
                   <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{order.shippingFee > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.shippingFee) : "Free"}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.gstAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-base">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                        </div>
                   </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 p-6 sm:p-8 bg-muted/30">
                 <p className="text-center text-sm text-muted-foreground">You will receive an email confirmation shortly.</p>
                 <Link href="/purchase">
                    <Button>Continue Shopping</Button>
                 </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Order not found</h2>
            <p className="text-muted-foreground mt-2">The requested order could not be found.</p>
             <Link href="/" className="mt-6 inline-block">
                <Button>Go to Homepage</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
