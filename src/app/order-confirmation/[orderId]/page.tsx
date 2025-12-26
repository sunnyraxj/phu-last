

'use client';

import { useMemo, useEffect } from 'react';
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
import { CheckCircle2, AlertCircle, Printer } from 'lucide-react';


type CompanySettings = {
    companyName?: string;
    companyAddress?: string;
    gstin?: string;
    invoiceLogoUrl?: string;
};

type Order = {
  id: string;
  customerId: string;
  orderDate: { seconds: number; nanoseconds: number; };
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
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
  paymentDetails?: {
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

export default function FinalInvoicePage() {
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

  const settingsRef = useMemoFirebase(() => doc(firestore, 'companySettings', 'main'), [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<CompanySettings>(settingsRef);
  
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: userIsLoading } = useDoc<{role: string}>(userDocRef);


  useEffect(() => {
    // Security check
    if (!orderLoading && order && user && order.customerId !== user.uid) {
        // Allow admins to view any order
        if (!userIsLoading && userData?.role !== 'admin') {
            router.push('/');
        }
    }
  }, [order, orderLoading, user, userIsLoading, userData, router])


  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  
  const priceBeforeTax = useMemo(() => {
      if (!order) return 0;
      return order.subtotal - order.gstAmount;
  }, [order]);


  const isLoading = orderLoading || itemsLoading || settingsLoading;
  
  const isPaidInFull = order?.paymentMethod === 'UPI_FULL';

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto py-8 sm:py-12 px-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
        ) : order && orderItems ? (
          <>
            <div className="max-w-4xl mx-auto mb-4 flex justify-end">
                <Button onClick={() => window.print()} className="print:hidden">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save as PDF
                </Button>
            </div>
            <Card className="w-full max-w-4xl mx-auto" id="invoice">
                <CardHeader className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div>
                            {settings?.invoiceLogoUrl && (
                                <div className="relative h-16 w-48 mb-4">
                                    <Image src={settings.invoiceLogoUrl} alt="Company Logo" layout="fill" objectFit="contain" objectPosition="left" />
                                </div>
                            )}
                            <h1 className="text-2xl font-bold">
                                Tax Invoice
                            </h1>
                            <p className="text-muted-foreground text-sm">Invoice #{order.id.substring(0,8)}</p>
                        </div>
                        <div className="text-sm text-right">
                            <p className="font-bold">{settings?.companyName || 'Purbanchal Hasta Udyog'}</p>
                            {settings?.companyAddress && <p className="text-muted-foreground whitespace-pre-line">{settings.companyAddress}</p>}
                            {settings?.gstin && <p className="text-muted-foreground">GSTIN: {settings.gstin}</p>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">

                <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-muted-foreground">Billed To</p>
                        <p className="font-medium">{order.shippingDetails.name}</p>
                        <p className="text-muted-foreground whitespace-pre-line">{`${order.shippingDetails.address}\n${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pincode}`}</p>
                        <p className="text-muted-foreground">{order.shippingDetails.phone}</p>
                    </div>
                    <div className="text-right">
                            <p className="font-semibold text-muted-foreground">Order Date</p>
                            <p>{formatDate(order.orderDate)}</p>
                            <p className="font-semibold text-muted-foreground mt-2">Order Status</p>
                            <p className="capitalize font-medium">{order.status.replace(/-/g, ' ')}</p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/3">Product</TableHead>
                                <TableHead className="text-center">Quantity</TableHead>
                                <TableHead className="text-right">Price (incl. GST)</TableHead>
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
                        {isPaidInFull && order.status !== 'cancelled' && (
                            <h4 className="font-semibold mb-2">Payment Status: <span className="font-medium capitalize text-green-600">Paid in Full</span></h4>
                        )}
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
                                <span className="text-muted-foreground">Total before tax</span>
                                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(priceBeforeTax)}</span>
                            </div>
                            {order.cgstAmount != null && order.cgstAmount > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">CGST</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.cgstAmount)}</span>
                                </div>
                            )}
                            {order.sgstAmount != null && order.sgstAmount > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">SGST</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.sgstAmount)}</span>
                                </div>
                            )}
                            {order.igstAmount != null && order.igstAmount > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">IGST</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.igstAmount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-base">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                            </div>
                            {order.paymentMethod === 'UPI_PARTIAL' && order.paymentDetails && (
                                <>
                                    <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                                        <span>Advance Paid</span>
                                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.advanceAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-destructive font-semibold">
                                        <span>Remaining Due</span>
                                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.remainingAmount)}</span>
                                    </div>
                                </>
                            )}
                            {order.paymentMethod === 'UPI_FULL' && (
                                <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                                    <span>Amount Paid</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                                </div>
                            )}
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 p-6 sm:p-8 bg-muted/30">
                    <p className="text-center text-sm text-muted-foreground">Thank you for your business!</p>
                    <Link href="/purchase" className="print:hidden">
                        <Button>Continue Shopping</Button>
                    </Link>
                </CardFooter>
            </Card>
          </>
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
