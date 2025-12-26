
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';


type Order = {
  id: string;
  customerId: string;
  orderDate: { seconds: number; nanoseconds: number; };
  totalAmount: number;
  status: 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled';
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod?: 'UPI_PARTIAL' | 'UPI_FULL';
  paymentDetails: {
      advanceAmount: number;
      remainingAmount: number;
      utr: string;
      paymentPercentage: number;
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

export default function ReceiptPage() {
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
      // Allow admins to view any order
      const userDocRef = doc(firestore, 'users', user.uid);
      useDoc<{role: string}>(userDocRef).data?.role !== 'admin' && router.push('/');
      return null;
  }

  const isLoading = orderLoading || itemsLoading;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto py-8 sm:py-12 px-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
        ) : order && orderItems ? (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="p-6 sm:p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <h1 className="text-2xl font-bold mt-4">Order Received!</h1>
                <p className="text-muted-foreground">Thank you for your purchase.</p>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
                <Alert className="mb-8">
                    <AlertTitle>Your order is pending payment approval.</AlertTitle>
                    <AlertDescription>
                        We have received your advance payment details. Your order will be processed as soon as our team confirms the payment. This usually takes a few hours.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                    <div>
                        <p className="font-semibold text-muted-foreground">Order #</p>
                        <p className="font-mono text-xs">{order.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-muted-foreground">Order Date</p>
                        <p>{formatDate(order.orderDate)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                                <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                                </div>
                                <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-medium">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                            </p>
                        </div>
                    ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center font-bold text-base">
                        <span>Total Order Value</span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                    </div>
                    <Separator className="my-2" />
                     {order.paymentMethod === 'UPI_PARTIAL' && (
                        <>
                            <div className="flex justify-between items-center text-green-600">
                                <span className="font-semibold">Advance Paid</span>
                                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.advanceAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-destructive">
                                <span className="font-semibold">Remaining Due</span>
                                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.remainingAmount)}</span>
                            </div>
                        </>
                    )}
                    {order.paymentMethod === 'UPI_FULL' && (
                        <div className="flex justify-between items-center text-green-600">
                            <span className="font-semibold">Amount Paid</span>
                            <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="flex-col gap-4 p-6 sm:p-8 bg-muted/30">
                 <p className="text-center text-sm text-muted-foreground">You can view the status of your order and the final invoice from the "My Orders" page.</p>
                 <div className="flex gap-4">
                    <Link href="/orders">
                        <Button variant="outline">Go to My Orders</Button>
                    </Link>
                    <Link href="/purchase">
                        <Button>Continue Shopping</Button>
                    </Link>
                 </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Receipt not found</h2>
            <p className="text-muted-foreground mt-2">The requested receipt could not be found.</p>
             <Link href="/" className="mt-6 inline-block">
                <Button>Go to Homepage</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
